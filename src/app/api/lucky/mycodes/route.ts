// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone") || "";
  const clean = phone.replace(/\D/g, "");
  if (!clean) return NextResponse.json({ codes: [], todayCount: 0 });
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const [codes, todayCount] = await Promise.all([
    prisma.collectedCode.findMany({
      where: { customerPhone: clean },
      include: { merchant: { select: { name: true } }, campaign: { select: { name: true } } },
      orderBy: { collectedAt: "desc" }, take: 50,
    }).catch(()=>[]),
    prisma.collectedCode.count({ where: { customerPhone: clean, collectedAt: { gte: todayStart } } }).catch(()=>0),
  ]);
  return NextResponse.json({
    codes: codes.map((c: any) => ({
      id: c.id, code: c.code, merchantName: c.merchant?.name || "", campaignName: c.campaign?.name || "",
      isWinner: c.isWinner, claimStatus: c.claimStatus, collectedAt: c.collectedAt,
    })),
    todayCount,
  });
}
