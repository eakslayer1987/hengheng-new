// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  if (!code) return NextResponse.json({ error: "ต้องระบุ code" }, { status: 400 });
  const item = await prisma.collectedCode.findUnique({
    where: { code: code.toUpperCase() },
    include: { merchant: { select: { name: true } }, campaign: { select: { name: true } }, prize: { select: { name: true } } },
  }).catch(()=>null);
  if (!item) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, item });
}
