// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  const campaigns = await prisma.campaign.findMany({
    include: { prizes: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  // Count collected codes per campaign safely
  const campaignsWithCount = await Promise.all(campaigns.map(async (camp) => {
    const count = await prisma.collectedCode.count({ where: { campaignId: camp.id } }).catch(() => 0);
    return { ...camp, _count: { codes: count } };
  }));
  return NextResponse.json({ campaigns: campaignsWithCount });
}

export async function POST(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  try {
    const { name, description, startDate, endDate, totalBudget, codesPerBag } = await req.json();
    const campaign = await prisma.campaign.create({
      data: {
        name, description,
        startDate: new Date(startDate), endDate: new Date(endDate),
        totalBudget: Number(totalBudget) || 1000000,
        codesPerBag: Number(codesPerBag) || 30,
      },
    });
    return NextResponse.json({ campaign });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  try {
    const { id, name, description, startDate, endDate, totalBudget, codesPerBag, isActive } = await req.json();
    const campaign = await prisma.campaign.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(totalBudget !== undefined && { totalBudget: Number(totalBudget) }),
        ...(codesPerBag !== undefined && { codesPerBag: Number(codesPerBag) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json({ campaign });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
