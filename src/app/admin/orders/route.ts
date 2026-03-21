// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusToCustomer } from "@/lib/line-messaging";

export const dynamic = "force-dynamic";

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

async function addTimeline(orderId: number, status: string, label: string) {
  await prisma.orderTimeline.create({ data: { orderId, status, label } });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const days = parseInt(searchParams.get("days") || "30");
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const where: any = { createdAt: { gte: dateFrom } };
    if (status && status !== "all") where.status = status;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { menuItem: true } },
        rider: { select: { id: true, name: true, phone: true, status: true, lat: true, lng: true } },
        timeline: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    });
    return NextResponse.json(orders);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, riderId } = await req.json();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (riderId !== undefined) updateData.riderId = riderId;

    // Sync kitchen status when admin changes order status
    if (status === "cooking") {
      updateData.kitchenStatus = "preparing";
      updateData.kitchenStartAt = new Date();
    }
    if (status === "ready") {
      updateData.kitchenStatus = "ready";
      updateData.kitchenDoneAt = new Date();
    }
    if (status === "cancelled") {
      updateData.kitchenStatus = "waiting";
      updateData.riderId = null;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: { include: { menuItem: true } }, rider: true },
    });

    // Add timeline
    const timelineMap: Record<string, string> = {
      cooking: "เริ่มเตรียมอาหาร",
      ready: "อาหารพร้อมส่ง",
      delivering: "คนขับรับงาน กำลังจัดส่ง",
      delivered: "ส่งอาหารสำเร็จ",
      cancelled: "ออเดอร์ถูกยกเลิก",
    };
    if (status && timelineMap[status]) {
      await addTimeline(id, status, timelineMap[status]);
    }

    // LINE Notify
    const statusText: Record<string, string> = {
      cooking: "🔥 กำลังจัดเตรียม",
      ready: "✅ พร้อมรับ/จัดส่ง",
      delivered: "🎉 จัดส่งสำเร็จ",
      cancelled: "❌ ยกเลิก",
    };
    if (status && statusText[status]) {
      const items = order.items.map((i: any) => `${i.menuItem.name} x${i.qty}`).join(", ");
      await notifyLine(`\n📋 #${order.orderNo}\n${statusText[status]}\n🛒 ${items}\n💰 ฿${Number(order.total).toLocaleString()}`);
    }

    // ─── Push Message ถึงลูกค้า (LINE Messaging API) ───
    if (status && order.customerId) {
      try {
        const customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
        if (customer?.lineUserId) {
          const itemsList = order.items.map((i: any) => ({ name: i.menuItem.name, qty: i.qty }));
          await sendOrderStatusToCustomer(
            customer.lineUserId,
            order.orderNo,
            status,
            itemsList,
            Number(order.total),
            order.rider?.name
          );
        }
      } catch (e) { console.error("[LINE Push] Error:", e); }
    }

    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
