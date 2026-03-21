// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { isActive: true, endDate: { gte: new Date() } },
      include: { prizes: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    if (!campaign) return NextResponse.json({ campaign: null });
    const totalCollected = await prisma.collectedCode.count({ where: { campaignId: campaign.id } }).catch(()=>0);
    return NextResponse.json({ campaign: { ...campaign, totalCollected } });
  } catch { return NextResponse.json({ campaign: null }); }
}
