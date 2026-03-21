// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  const page   = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const status = req.nextUrl.searchParams.get("status") || "";
  const limit  = 20;
  const where  = status ? { status } : {};

  try {
    // Try with collectedCodes count first
    let merchants: any[], total: number;
    try {
      [merchants, total] = await Promise.all([
        prisma.merchant.findMany({
          where, orderBy: { createdAt: "desc" }, skip: (page-1)*limit, take: limit,
          include: { _count: { select: { receipts: true, collectedCodes: true } } },
        }),
        prisma.merchant.count({ where }),
      ]);
    } catch {
      // Fallback: DB still has old schema (before prisma db push)
      [merchants, total] = await Promise.all([
        prisma.merchant.findMany({
          where, orderBy: { createdAt: "desc" }, skip: (page-1)*limit, take: limit,
          include: { _count: { select: { receipts: true } } },
        }),
        prisma.merchant.count({ where }),
      ]);
    }

    const merchantIds = merchants.map((m: any) => m.id);
    let qMap: Record<number, any> = {};
    try {
      const quotaAgg = await prisma.merchantQuota.groupBy({
        by: ["merchantId"],
        where: { merchantId: { in: merchantIds } },
        _sum: { totalCodes: true, usedCodes: true },
      });
      qMap = Object.fromEntries(quotaAgg.map((q: any) => [q.merchantId, q._sum]));
    } catch { /* quota table might not exist yet */ }

    return NextResponse.json({
      merchants: merchants.map((m: any) => ({
        ...m,
        totalCodes:     qMap[m.id]?.totalCodes    || 0,
        usedCodes:      qMap[m.id]?.usedCodes     || 0,
        totalCollected: m._count?.collectedCodes  || 0,
        totalReceipts:  m._count?.receipts        || 0,
      })),
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[merchants GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const { id, action } = await req.json();
    if (!id) return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });
    if (action === "approve") {
      await prisma.merchant.update({ where: { id: Number(id) }, data: { status: "approved", isActive: true } });
      return NextResponse.json({ message: "อนุมัติร้านค้าสำเร็จ" });
    }
    if (action === "reject") {
      await prisma.merchant.update({ where: { id: Number(id) }, data: { status: "rejected", isActive: false } });
      return NextResponse.json({ message: "ปฏิเสธร้านค้าแล้ว" });
    }
    return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
  } catch (err) {
    console.error("[merchants PATCH]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
