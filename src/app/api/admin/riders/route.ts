// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const riders = await prisma.rider.findMany({
      orderBy: { createdAt: "desc" },
      include: { orders: { where: { status: { in: ["delivering", "ready"] } }, select: { id: true, orderNo: true, status: true } } },
    });
    return NextResponse.json(riders);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    if (action === "create") {
      const rider = await prisma.rider.create({ data: { name: data.name, phone: data.phone, pin: data.pin || "1234" } });
      return NextResponse.json(rider);
    }
    if (action === "update") {
      const rider = await prisma.rider.update({ where: { id: data.id }, data: { name: data.name, phone: data.phone, pin: data.pin } });
      return NextResponse.json(rider);
    }
    if (action === "toggle") {
      const r = await prisma.rider.findUnique({ where: { id: data.id } });
      if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.rider.update({ where: { id: data.id }, data: { isActive: !r.isActive } });
      return NextResponse.json({ ok: true });
    }
    if (action === "delete") {
      await prisma.rider.delete({ where: { id: data.id } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
