// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getCustomer(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const payload = verifyToken(token) as any;
  if (!payload?.id || payload.type !== "customer") return null;
  return payload;
}

// GET: Profile + order history
export async function GET(req: NextRequest) {
  const auth = getCustomer(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const customer = await prisma.customer.findUnique({ where: { id: auth.id } });
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let orders: any[] = [];
    try {
      orders = await prisma.order.findMany({
        where: { customerId: customer.id },
        include: { items: { include: { menuItem: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" }, take: 20,
      });
    } catch {}

    return NextResponse.json({
      customer: { id: customer.id, name: customer.name, phone: customer.phone, avatar: customer.avatar, address: customer.address, totalOrders: customer.totalOrders, totalSpent: customer.totalSpent },
      orders: orders.map(o => ({ id: o.id, orderNo: o.orderNo, total: o.total, status: o.status, createdAt: o.createdAt, items: o.items.map((i: any) => ({ name: i.menuItem.name, qty: i.qty, price: i.price })) })),
    });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// PATCH: Update profile
export async function PATCH(req: NextRequest) {
  const auth = getCustomer(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { phone, address, lat, lng, name } = await req.json();
    const d: any = {};
    if (phone !== undefined) d.phone = String(phone).replace(/[^0-9+-]/g, "").substring(0, 20);
    if (address !== undefined) d.address = String(address).replace(/<[^>]*>/g, "").substring(0, 1000);
    if (lat !== undefined) d.lat = Number(lat) || null;
    if (lng !== undefined) d.lng = Number(lng) || null;
    if (name !== undefined) d.name = String(name).replace(/<[^>]*>/g, "").substring(0, 100);
    const c = await prisma.customer.update({ where: { id: auth.id }, data: d });
    return NextResponse.json({ id: c.id, name: c.name, phone: c.phone, avatar: c.avatar, address: c.address, totalOrders: c.totalOrders });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
