// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(coupons);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { action, ...data } = await req.json();
    if (action === "create") {
      const c = await prisma.coupon.create({ data: {
        code: data.code.toUpperCase(), type: data.type, value: data.value || 0,
        minOrder: data.minOrder || 0, maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      }});
      return NextResponse.json(c);
    }
    if (action === "update") {
      const c = await prisma.coupon.update({ where: { id: data.id }, data: {
        code: data.code?.toUpperCase(), type: data.type, value: data.value,
        minOrder: data.minOrder, maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      }});
      return NextResponse.json(c);
    }
    if (action === "toggle") {
      const c = await prisma.coupon.findUnique({ where: { id: data.id } });
      if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.coupon.update({ where: { id: data.id }, data: { isActive: !c.isActive } });
      return NextResponse.json({ ok: true });
    }
    if (action === "delete") {
      await prisma.coupon.delete({ where: { id: data.id } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
