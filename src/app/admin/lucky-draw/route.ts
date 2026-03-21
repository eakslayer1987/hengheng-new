// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";

// POST /api/admin/lucky-draw - run lucky draw for a campaign
export async function POST(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const { campaignId, prizeId, count } = await req.json();
    if (!campaignId || !prizeId || !count)
      return NextResponse.json({ error: "กรุณาระบุ campaignId, prizeId, count" }, { status: 400 });

    const prize = await prisma.prize.findUnique({ where: { id: Number(prizeId) } });
    if (!prize) return NextResponse.json({ error: "ไม่พบรางวัล" }, { status: 404 });
    if (prize.remaining < Number(count))
      return NextResponse.json({ error: `รางวัลเหลือ ${prize.remaining} ชิ้น ไม่พอจับ ${count} รายการ` }, { status: 400 });

    // Get eligible codes (not yet winner) for this campaign
    const eligible = await prisma.collectedCode.findMany({
      where: { campaignId: Number(campaignId), isWinner: false },
      select: { id: true, customerName: true, customerPhone: true, code: true },
    });

    if (eligible.length === 0)
      return NextResponse.json({ error: "ไม่มีรายการที่ยังไม่ได้รับรางวัล" }, { status: 400 });
    if (eligible.length < Number(count))
      return NextResponse.json({ error: `มีสิทธิ์ ${eligible.length} รายการ น้อยกว่าที่ต้องจับ ${count}` }, { status: 400 });

    // Fisher-Yates shuffle → pick count winners
    const pool = [...eligible];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const winners = pool.slice(0, Number(count));

    // Update DB in transaction
    await prisma.$transaction([
      ...winners.map(w => prisma.collectedCode.update({
        where: { id: w.id },
        data: { isWinner: true, prizeId: Number(prizeId), claimStatus: "pending" },
      })),
      prisma.prize.update({
        where: { id: Number(prizeId) },
        data: { remaining: { decrement: Number(count) } },
      }),
    ]);

    return NextResponse.json({
      winners: winners.map(w => ({ id: w.id, name: w.customerName, phone: w.customerPhone, code: w.code })),
      message: `จับรางวัลสำเร็จ! ผู้โชคดี ${count} คน`,
    });
  } catch (err) {
    console.error("[lucky-draw]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
