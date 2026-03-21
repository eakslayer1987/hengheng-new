// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const KITCHEN_STEPS: Record<string, { label: string; next: string | null }> = {
  waiting: { label: "รอรับออเดอร์", next: "preparing" },
  preparing: { label: "เตรียมวัตถุดิบ", next: "cooking" },
  cooking: { label: "กำลังปรุง", next: "plating" },
  plating: { label: "จัดจาน", next: "ready" },
  ready: { label: "พร้อมส่ง", next: null },
};

async function addTimeline(orderId: number, status: string, label: string, note?: string) {
  await prisma.orderTimeline.create({ data: { orderId, status, label, note } });
}

async function notifyLine(message: string) {
  try {
    const setting = await prisma.systemConfig.findUnique({ where: { key: "line_notify_token" } });
    if (!setting?.value) return;
    await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Bearer ${setting.value}` },
      body: `message=${encodeURIComponent(message)}`,
    });
  } catch {}
}

// GET: Active kitchen orders
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ["pending", "cooking", "ready"] }, kitchenStatus: { not: "delivered" } },
      orderBy: { createdAt: "asc" },
      include: { items: { include: { menuItem: true } }, timeline: { orderBy: { createdAt: "asc" } } },
    });

    // Calculate avg cook times
    const avgTimes = await prisma.order.groupBy({
      by: ["kitchenStatus"],
      where: { kitchenDoneAt: { not: null }, kitchenStartAt: { not: null } },
      _avg: { estimatedMins: true },
    });

    return NextResponse.json({ orders, avgTimes, steps: KITCHEN_STEPS });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: Update kitchen status
export async function PATCH(req: NextRequest) {
  try {
    const { orderId, action } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } } },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const currentStep = KITCHEN_STEPS[order.kitchenStatus];
    if (!currentStep) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    if (action === "next" && currentStep.next) {
      const nextStatus = currentStep.next;
      const nextLabel = KITCHEN_STEPS[nextStatus]?.label || nextStatus;

      const updateData: any = { kitchenStatus: nextStatus };

      if (nextStatus === "preparing") {
        updateData.status = "cooking";
        updateData.kitchenStartAt = new Date();
      }
      if (nextStatus === "ready") {
        updateData.status = "ready";
        updateData.kitchenDoneAt = new Date();
        // Calculate cook time in minutes
        if (order.kitchenStartAt) {
          const mins = Math.round((Date.now() - new Date(order.kitchenStartAt).getTime()) / 60000);
          updateData.estimatedMins = mins;
        }
      }

      await prisma.order.update({ where: { id: orderId }, data: updateData });
      await addTimeline(orderId, nextStatus, nextLabel);

      // Notify customer via LINE
      const statusEmoji: Record<string, string> = {
        preparing: "🧅 เตรียมวัตถุดิบแล้ว",
        cooking: "🔥 กำลังปรุงอาหาร",
        plating: "🍽️ กำลังจัดจาน",
        ready: "✅ อาหารพร้อมส่งแล้ว!",
      };
      if (statusEmoji[nextStatus]) {
        await notifyLine(`\n📋 #${order.orderNo}\n${statusEmoji[nextStatus]}\n🛒 ${order.items.map(i => i.menuItem.name).join(", ")}`);
      }

      return NextResponse.json({ ok: true, newStatus: nextStatus });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
