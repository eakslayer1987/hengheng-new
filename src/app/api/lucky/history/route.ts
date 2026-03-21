// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone") || "";
  const clean = phone.replace(/\D/g, "");
  if (!clean) return NextResponse.json({ codes: [] });
  const codes = await prisma.collectedCode.findMany({
    where: { customerPhone: clean },
    include: { merchant: { select: { name: true } }, campaign: { select: { name: true } } },
    orderBy: { collectedAt: "desc" }, take: 50,
  }).catch(() => []);
  return NextResponse.json({ codes });
}
