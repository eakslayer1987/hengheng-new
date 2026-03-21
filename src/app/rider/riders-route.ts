// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function notifyLine(message: string) {
  try {
    const s = await prisma.systemConfig.findUnique({ where: { key: "line_notify_token" } });
    if (!s?.value) return;
    await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Bearer ${s.value}` },
      body: `message=${encodeURIComponent(message)}`,
    });
  } catch {}
}

async function addTimeline(orderId: number, status: string, label: string) {
  await prisma.orderTimeline.create({ data: { orderId, status, label } });
}

// POST: Rider login or actions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Login
    if (action === "login") {
      const rider = await prisma.rider.findFirst({ where: { phone: body.phone, pin: body.pin, isActive: true } });
      if (!rider) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 401 });
      await prisma.rider.update({ where: { id: rider.id }, data: { status: "online" } });
      return NextResponse.json({ id: rider.id, name: rider.name, phone: rider.phone, photo: rider.photo });
    }

    // All other actions require valid riderId
    const riderId = Number(body.riderId);
    if (!riderId) return NextResponse.json({ error: "Missing riderId" }, { status: 400 });
    const rider = await prisma.rider.findUnique({ where: { id: riderId, isActive: true } });
    if (!rider) return NextResponse.json({ error: "Rider not found" }, { status: 401 });

    // Get available orders (ready for pickup)
    if (action === "available-orders") {
      const orders = await prisma.order.findMany({
        where: { status: "ready", riderId: null, kitchenStatus: "ready" },
        include: { items: { include: { menuItem: true } } },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(orders);
    }

    // Get my assigned orders
    if (action === "my-orders") {
      const orders = await prisma.order.findMany({
        where: { riderId, status: { in: ["ready", "delivering"] } },
        include: { items: { include: { menuItem: true } }, timeline: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    }

    // ─── HISTORY: ประวัติการส่งงาน ───
    if (action === "history") {
      const page = body.page || 1;
      const limit = 20;
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { riderId, status: "delivered" },
          include: { items: { include: { menuItem: true } } },
          orderBy: { deliveredAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.order.count({ where: { riderId, status: "delivered" } }),
      ]);

      // Earnings summary
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const allDelivered = await prisma.order.findMany({
        where: { riderId, status: "delivered" },
        select: { total: true, deliveredAt: true, createdAt: true },
      });

      // Commission settings
      const commSetting = await prisma.systemConfig.findUnique({ where: { key: "rider_commission" } });
      const commPercent = parseFloat(commSetting?.value || "10"); // default 10%

      const calcEarnings = (orders: any[]) => {
        const totalSales = orders.reduce((s, o) => s + Number(o.total), 0);
        return { trips: orders.length, sales: totalSales, commission: Math.round(totalSales * commPercent / 100) };
      };

      const todayOrders = allDelivered.filter(o => new Date(o.deliveredAt || o.createdAt) >= todayStart);
      const weekOrders = allDelivered.filter(o => new Date(o.deliveredAt || o.createdAt) >= weekStart);
      const monthOrders = allDelivered.filter(o => new Date(o.deliveredAt || o.createdAt) >= monthStart);

      return NextResponse.json({
        orders,
        total,
        page,
        pages: Math.ceil(total / limit),
        commPercent,
        earnings: {
          today: calcEarnings(todayOrders),
          week: calcEarnings(weekOrders),
          month: calcEarnings(monthOrders),
          all: calcEarnings(allDelivered),
        },
      });
    }

    // ─── PROFILE: อัพเดทโปรไฟล์ ───
    if (action === "update-profile") {
      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.photo !== undefined) updateData.photo = body.photo;
      const updated = await prisma.rider.update({ where: { id: riderId }, data: updateData });
      return NextResponse.json({ id: updated.id, name: updated.name, phone: updated.phone, photo: updated.photo });
    }

    // Accept order
    if (action === "accept") {
      const order = await prisma.order.update({
        where: { id: body.orderId },
        data: { riderId, status: "delivering" },
        include: { items: { include: { menuItem: true } } },
      });
      await prisma.rider.update({ where: { id: riderId }, data: { status: "busy" } });
      await addTimeline(body.orderId, "rider_accepted", "คนขับรับงานแล้ว");
      await notifyLine(`\n📋 #${order.orderNo}\n🏍️ ${rider.name} รับงานแล้ว\n📍 กำลังไปรับอาหาร`);
      return NextResponse.json(order);
    }

    // Picked up
    if (action === "picked-up") {
      const order = await prisma.order.update({
        where: { id: body.orderId },
        data: { pickedUpAt: new Date() },
        include: { items: { include: { menuItem: true } } },
      });
      await addTimeline(body.orderId, "picked_up", "รับอาหารแล้ว กำลังจัดส่ง");
      await notifyLine(`\n📋 #${order.orderNo}\n📦 ${rider.name} รับอาหารแล้ว\n🏍️ กำลังจัดส่ง...`);
      return NextResponse.json(order);
    }

    // Delivered
    if (action === "delivered") {
      const order = await prisma.order.update({
        where: { id: body.orderId },
        data: { status: "delivered", deliveredAt: new Date() },
        include: { items: { include: { menuItem: true } } },
      });
      await addTimeline(body.orderId, "delivered", "ส่งอาหารสำเร็จ!");
      await notifyLine(`\n📋 #${order.orderNo}\n✅ ${rider.name} ส่งสำเร็จ!\n💰 ฿${Number(order.total).toLocaleString()}`);
      await prisma.rider.update({ where: { id: riderId }, data: { status: "online" } });
      return NextResponse.json(order);
    }

    // Update GPS
    if (action === "update-location") {
      await prisma.rider.update({ where: { id: riderId }, data: { lat: body.lat, lng: body.lng } });
      return NextResponse.json({ ok: true });
    }

    // Go offline
    if (action === "offline") {
      await prisma.rider.update({ where: { id: riderId }, data: { status: "offline" } });
      return NextResponse.json({ ok: true });
    }

    // Link LINE account
    if (action === "link-line") {
      await prisma.rider.update({ where: { id: riderId }, data: { lineUserId: body.lineUserId } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
