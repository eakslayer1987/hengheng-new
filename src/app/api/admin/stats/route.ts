// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fb: T): Promise<T> {
  try { return await fn(); } catch { return fb; }
}

export async function GET(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // 7 วันย้อนหลัง
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // ─── ทุกอย่างรันพร้อมกันใน Promise.all เดียว ─────────────────
    const [
      campaign,
      totalCodes,
      todayCollections,
      totalWinners,
      pendingClaim,
      totalMerchants,
      pendingMerchants,
      pendingReceipts,
      approvedMerchants,
      quotaAgg,
      // dailyData: 1 raw query แทน 7 loops
      rawDaily,
    ] = await Promise.all([
      safe(() => prisma.campaign.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }), null),
      safe(() => prisma.collectedCode.count(), 0),
      safe(() => prisma.collectedCode.count({ where: { collectedAt: { gte: todayStart } } }), 0),
      safe(() => prisma.collectedCode.count({ where: { isWinner: true } }), 0),
      safe(() => prisma.collectedCode.count({ where: { isWinner: true, claimStatus: "pending" } }), 0),
      safe(() => prisma.merchant.count(), 0),
      safe(() => prisma.merchant.count({ where: { status: "pending" } }), 0),
      safe(() => prisma.receipt.count({ where: { status: "pending" } }), 0),
      safe(() => prisma.merchant.count({ where: { status: "approved" } }), 0),
      safe(() => prisma.merchantQuota.aggregate({
        _sum: { totalCodes: true, usedCodes: true },
      }), { _sum: { totalCodes: 0, usedCodes: 0 } }),
      // Single GROUP BY query แทน 7 sequential queries
      safe(() => prisma.$queryRaw<{ day: string; cnt: bigint }[]>`
        SELECT DATE(collectedAt) AS day, COUNT(*) AS cnt
        FROM CollectedCode
        WHERE collectedAt >= ${sevenDaysAgo}
        GROUP BY DATE(collectedAt)
      `, []),
    ]);

    // prizes query (ต้องการ campaign.id)
    const prizes = campaign
      ? await safe(() => prisma.prize.findMany({
          where: { campaignId: campaign.id },
          orderBy: { sortOrder: "asc" },
        }), [])
      : [];

    // Build dailyData array จาก raw result
    const rawMap: Record<string, number> = {};
    for (const row of rawDaily) {
      const key = typeof row.day === "string"
        ? row.day.slice(0, 10)
        : new Date(row.day).toISOString().slice(0, 10);
      rawMap[key] = Number(row.cnt);
    }
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return { date: key, count: rawMap[key] || 0 };
    });

    const totalQuotaGiven = campaign
      ? await safe(() => prisma.merchantQuota.aggregate({
          where: { campaignId: campaign.id },
          _sum: { totalCodes: true, usedCodes: true },
        }).then(r => ({ given: r._sum.totalCodes || 0, used: r._sum.usedCodes || 0 })),
        { given: 0, used: 0 })
      : { given: Number(quotaAgg._sum.totalCodes) || 0, used: Number(quotaAgg._sum.usedCodes) || 0 };

    return NextResponse.json({
      stats: {
        campaign: campaign
          ? { id: campaign.id, name: campaign.name, endDate: campaign.endDate, isActive: campaign.isActive }
          : null,
        totalCodes,
        todayCollections,
        totalWinners,
        pendingClaim,
        totalMerchants,
        pendingMerchants,
        approvedMerchants,
        pendingReceipts,
        totalQuotaGiven: totalQuotaGiven.given,
        totalQuotaUsed: totalQuotaGiven.used,
        totalQuotaRemaining: totalQuotaGiven.given - totalQuotaGiven.used,
        dailyData,
        prizes,
      },
    });
  } catch (err) {
    console.error("[stats]", err);
    return NextResponse.json({ stats: null, error: String(err) }, { status: 500 });
  }
}
