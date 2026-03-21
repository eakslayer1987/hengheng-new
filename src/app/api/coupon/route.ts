// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal } = await req.json();
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) return NextResponse.json({ error: "โค้ดไม่ถูกต้อง" }, { status: 400 });
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return NextResponse.json({ error: "โค้ดหมดอายุแล้ว" }, { status: 400 });
    if (coupon.startsAt && new Date() < coupon.startsAt) return NextResponse.json({ error: "โค้ดยังไม่เริ่มใช้งาน" }, { status: 400 });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return NextResponse.json({ error: "โค้ดถูกใช้ครบแล้ว" }, { status: 400 });
    if (Number(coupon.minOrder) > orderTotal) return NextResponse.json({ error: `สั่งขั้นต่ำ ฿${Number(coupon.minOrder)}` }, { status: 400 });

    let discount = 0;
    if (coupon.type === "percent") { discount = orderTotal * Number(coupon.value) / 100; if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount)); }
    else if (coupon.type === "fixed") { discount = Number(coupon.value); }
    else if (coupon.type === "free_delivery") { discount = 0; }

    return NextResponse.json({ valid: true, type: coupon.type, discount, code: coupon.code, label: coupon.type === "percent" ? `ลด ${Number(coupon.value)}%` : coupon.type === "fixed" ? `ลด ฿${Number(coupon.value)}` : "ฟรีค่าส่ง" });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
