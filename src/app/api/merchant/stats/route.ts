// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get("phone")?.replace(/\D/g, "");
    if (!phone) return NextResponse.json({ error: "ต้องระบุ phone" }, { status: 400 });

    const merchant = await prisma.merchant.findUnique({ where: { phone } });
    if (!merchant) return NextResponse.json({ error: "ไม่พบร้านค้า" }, { status: 404 });
    if (merchant.status !== "approved")
      return NextResponse.json({ error: "ร้านค้ายังไม่ได้รับการอนุมัติ" }, { status: 403 });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // รัน parallel ทั้งหมด
    const [dailyRaw, recentScans, todayCount, totalCount] = await Promise.all([
      // กราฟ 7 วัน - 1 query
      prisma.$queryRaw<{ day: string; cnt: bigint }[]>`
        SELECT DATE(collectedAt) AS day, COUNT(*) AS cnt
        FROM CollectedCode
        WHERE merchantId = ${merchant.id}
          AND collectedAt >= ${sevenDaysAgo}
        GROUP BY DATE(collectedAt)
        ORDER BY day ASC
      `,
      // รายการสแกน 30 วัน ล่าสุด
      prisma.collectedCode.findMany({
        where: {
          merchantId: merchant.id,
          collectedAt: { gte: thirtyDaysAgo },
        },
        orderBy: { collectedAt: "desc" },
        take: 100,
        select: {
          id: true,
          code: true,
          customerName: true,
          customerPhone: true,
          collectedAt: true,
          isWinner: true,
          claimStatus: true,
        },
      }),
      // วันนี้
      prisma.collectedCode.count({
        where: { merchantId: merchant.id, collectedAt: { gte: todayStart } },
      }),
      // ทั้งหมด
      prisma.collectedCode.count({ where: { merchantId: merchant.id } }),
    ]);

    // Build 7-day chart
    const rawMap: Record<string, number> = {};
    for (const row of dailyRaw) {
      const key =
        typeof row.day === "string"
          ? row.day.slice(0, 10)
          : new Date(row.day).toISOString().slice(0, 10);
      rawMap[key] = Number(row.cnt);
    }
    const dailyChart = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("th-TH", { weekday: "short", day: "numeric" });
      return { date: key, label, count: rawMap[key] || 0 };
    });

    return NextResponse.json({
      dailyChart,
      recentScans,
      todayCount,
      totalCount,
    });
  } catch (err) {
    console.error("[merchant/stats]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
