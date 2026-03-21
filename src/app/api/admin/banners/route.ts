// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/admin/banners?position=all&page=1
export async function GET(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const position = req.nextUrl.searchParams.get("position") || "";
    const page     = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
    const limit    = 20;

    const where = position && position !== "all" ? { position } : {};
    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.banner.count({ where }),
    ]);
    return NextResponse.json({ banners, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/admin/banners — create
export async function POST(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const data = await req.json();
    const banner = await prisma.banner.create({
      data: {
        position:       String(data.position || "user_topbar"),
        type:           String(data.type || "announcement"),
        title:          data.title   ? String(data.title).trim()   : null,
        body:           data.body    ? String(data.body).trim()    : null,
        imageUrl:       data.imageUrl || null,
        videoUrl:       data.videoUrl || null,
        linkUrl:        data.linkUrl || null,
        linkTarget:     data.linkTarget || "_blank",
        bgColor:        data.bgColor    || "#FD1803",
        textColor:      data.textColor  || "#FFFFFF",
        ctaText:        data.ctaText    || null,
        targetAudience: data.targetAudience || "all",
        showMobile:     data.showMobile  !== false,
        showDesktop:    data.showDesktop !== false,
        startsAt:       data.startsAt  ? new Date(data.startsAt)  : null,
        endsAt:         data.endsAt    ? new Date(data.endsAt)    : null,
        priority:       Number(data.priority   || 0),
        delayMs:        Number(data.delayMs    || 0),
        dismissDays:    Number(data.dismissDays ?? 1),
        isActive:       data.isActive === true,
      },
    });
    return NextResponse.json({ banner, message: "สร้าง banner สำเร็จ" });
  } catch (err) {
    console.error("[banner POST]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PATCH /api/admin/banners — update / toggle
export async function PATCH(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });

    const updateData: any = {};
    const fields = [
      "position","type","title","body","imageUrl","videoUrl","linkUrl","linkTarget",
      "bgColor","textColor","ctaText","targetAudience","showMobile","showDesktop",
      "priority","delayMs","dismissDays","isActive",
    ];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.endsAt   !== undefined) updateData.endsAt   = data.endsAt   ? new Date(data.endsAt)   : null;

    const banner = await prisma.banner.update({ where: { id: Number(id) }, data: updateData });
    return NextResponse.json({ banner, message: "อัปเดต banner สำเร็จ" });
  } catch (err) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/admin/banners
export async function DELETE(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const { id } = await req.json();
    await prisma.banner.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "ลบ banner สำเร็จ" });
  } catch (err) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
