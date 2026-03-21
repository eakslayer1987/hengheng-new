// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";

// GET /api/admin/tickets?page=1&status=activated&campaignId=1
export async function GET(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const status     = req.nextUrl.searchParams.get("status") || "";
    const campaignId = req.nextUrl.searchParams.get("campaignId");
    const page       = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
    const limit      = 20;

    const where: any = {};
    if (status)     where.status     = status;
    if (campaignId) where.campaignId = Number(campaignId);

    const [tickets, total, summary] = await Promise.all([
      (prisma as any).digitalTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page-1)*limit,
        take: limit,
        include: {
          merchant: { select: { name: true, phone: true } },
        },
      }),
      (prisma as any).digitalTicket.count({ where }),
      // summary stats
      Promise.all([
        (prisma as any).digitalTicket.count({ where: campaignId ? { campaignId: Number(campaignId) } : {} }),
        (prisma as any).digitalTicket.count({ where: { ...(campaignId ? { campaignId: Number(campaignId) } : {}), status: "unclaimed" } }),
        (prisma as any).digitalTicket.count({ where: { ...(campaignId ? { campaignId: Number(campaignId) } : {}), status: "activated" } }),
        (prisma as any).digitalTicket.count({ where: { ...(campaignId ? { campaignId: Number(campaignId) } : {}), isWinner: true } }),
      ]),
    ]);

    const [totalAll, unclaimed, activated, winners] = summary;

    return NextResponse.json({
      tickets,
      total,
      pages: Math.ceil(total/limit),
      summary: { total: totalAll, unclaimed, activated, winners },
    });
  } catch (err) {
    console.error("[admin/tickets]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
