// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// GET /api/merchant/wallet?phone=0812345678
export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get("phone")?.replace(/\D/g, "");
    if (!phone) return NextResponse.json({ error: "ต้องระบุเบอร์โทร" }, { status: 400 });

    const merchant = await prisma.merchant.findUnique({ where: { phone } });
    if (!merchant) return NextResponse.json({ error: "ไม่พบร้านค้า" }, { status: 404 });

    const [unclaimed, activated, total] = await Promise.all([
      (prisma as any).digitalTicket.count({ where: { merchantId: merchant.id, status: "unclaimed" } }),
      (prisma as any).digitalTicket.count({ where: { merchantId: merchant.id, status: "activated" } }),
      (prisma as any).digitalTicket.count({ where: { merchantId: merchant.id } }),
    ]);

    // รายการล่าสุดที่ถูก activate
    const recentActivated = await (prisma as any).digitalTicket.findMany({
      where: { merchantId: merchant.id, status: "activated" },
      orderBy: { activatedAt: "desc" },
      take: 10,
      select: { ticketCode: true, customerName: true, customerPhone: true, activatedAt: true },
    });

    return NextResponse.json({
      wallet: { unclaimed, activated, total },
      recentActivated,
    });
  } catch (err) {
    console.error("[wallet GET]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
