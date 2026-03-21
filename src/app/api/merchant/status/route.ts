// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const phone      = req.nextUrl.searchParams.get("phone") || "";
  const lineUserId = req.nextUrl.searchParams.get("lineUserId") || "";
  if (!phone && !lineUserId) return NextResponse.json({ error: "ต้องระบุ phone หรือ lineUserId" }, { status: 400 });
  try {
    const merchant = await prisma.merchant.findFirst({
      where: phone ? { phone } : { lineUserId },
      include: {
        quotas: { where: { isActive: true }, include: { campaign: { select: { name: true, endDate: true, isActive: true } } }, orderBy: { createdAt: "desc" } },
        receipts: { orderBy: { submittedAt: "desc" }, take: 5, include: { quota: { select: { totalCodes: true, usedCodes: true } } } },
        _count: { select: { collectedCodes: true } },
      },
    });
    if (!merchant) return NextResponse.json({ merchant: null });
    const totalQuota = merchant.quotas.reduce((s, q) => s + q.totalCodes, 0);
    const usedQuota  = merchant.quotas.reduce((s, q) => s + q.usedCodes, 0);
    return NextResponse.json({ merchant: { ...merchant, totalQuota, usedQuota, remainingQuota: totalQuota - usedQuota, totalCollected: merchant._count.collectedCodes } });
  } catch (err) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
