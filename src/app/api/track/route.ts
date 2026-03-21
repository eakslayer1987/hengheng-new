// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNo = searchParams.get("no");
    if (!orderNo) return NextResponse.json({ error: "Missing order no" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        items: { include: { menuItem: true } },
        timeline: { orderBy: { createdAt: "asc" } },
        rider: { select: { id: true, name: true, phone: true, lat: true, lng: true, photo: true } },
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Get shop location
    const shopLat = await prisma.systemConfig.findUnique({ where: { key: "shop_lat" } });
    const shopLng = await prisma.systemConfig.findUnique({ where: { key: "shop_lng" } });
    const shopName = await prisma.systemConfig.findUnique({ where: { key: "shop_name" } });

    // Calculate ETA if rider assigned
    let eta = null;
    if (order.rider?.lat && order.custLat) {
      const R = 6371;
      const dLat = (Number(order.custLat) - Number(order.rider.lat)) * Math.PI / 180;
      const dLng = (Number(order.custLng) - Number(order.rider.lng)) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(Number(order.rider.lat)*Math.PI/180) * Math.cos(Number(order.custLat)*Math.PI/180) * Math.sin(dLng/2)**2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      eta = Math.max(1, Math.round(dist / 0.5)); // ~30km/h avg speed
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNo: order.orderNo,
        custName: order.custName,
        status: order.status,
        kitchenStatus: order.kitchenStatus,
        total: order.total,
        createdAt: order.createdAt,
        estimatedMins: order.estimatedMins,
        items: order.items,
      },
      timeline: order.timeline,
      rider: order.rider,
      eta,
      shop: {
        name: shopName?.value || "ตลาดปัง",
        lat: Number(shopLat?.value || 13.7563),
        lng: Number(shopLng?.value || 100.5018),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
