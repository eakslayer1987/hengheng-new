// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/banners?position=user_topbar
// GET /api/banners?position=user_topbar,user_hero  (multiple)
export async function GET(req: NextRequest) {
  try {
    const posParam = req.nextUrl.searchParams.get("position") || "";
    const positions = posParam.split(",").map(p => p.trim()).filter(Boolean);
    if (!positions.length)
      return NextResponse.json({ banners: [] });

    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        position: { in: positions },
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ banners });
  } catch (err) {
    console.error("[banners GET]", err);
    return NextResponse.json({ banners: [] });
  }
}

// POST /api/banners  — track impression/click
export async function POST(req: NextRequest) {
  try {
    const { id, event } = await req.json(); // event: "impression" | "click"
    if (!id || !["impression", "click"].includes(event))
      return NextResponse.json({ ok: false });
    await prisma.banner.update({
      where: { id: Number(id) },
      data: event === "click" ? { clicks: { increment: 1 } } : { impressions: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
