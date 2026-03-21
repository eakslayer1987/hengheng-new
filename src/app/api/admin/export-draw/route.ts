// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";

// GET /api/admin/export-draw?campaignId=1&from=2026-03-01&to=2026-03-15
// ส่งออก CSV เฉพาะฉลาก "activated" เพื่อใช้จับรางวัล
export async function GET(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const campaignId = req.nextUrl.searchParams.get("campaignId");
    const from       = req.nextUrl.searchParams.get("from");
    const to         = req.nextUrl.searchParams.get("to");

    const where: any = { status: "activated" };
    if (campaignId) where.campaignId = Number(campaignId);
    if (from || to) {
      where.activatedAt = {};
      if (from) where.activatedAt.gte = new Date(from);
      if (to)   where.activatedAt.lte = new Date(to + "T23:59:59");
    }

    const tickets = await (prisma as any).digitalTicket.findMany({
      where,
      orderBy: { activatedAt: "asc" },
      include: {
        merchant: { select: { name: true, phone: true } },
      },
    });

    if (tickets.length === 0) {
      return NextResponse.json({ error: "ไม่มีฉลากที่ Activated ในช่วงเวลานี้" }, { status: 404 });
    }

    // Build CSV
    const period = from && to ? `${from}_${to}` : "all";
    const rows = [
      // Header
      ["ลำดับ","รหัสฉลาก","ร้านค้า","เบอร์ร้าน","ชื่อลูกค้า","เบอร์ลูกค้า","วันที่รับ"].join(","),
      // Data
      ...tickets.map((t: any, i: number) => [
        i+1,
        t.ticketCode,
        `"${t.merchant?.name || ""}"`,
        t.merchant?.phone || "",
        `"${t.customerName || ""}"`,
        t.customerPhone || "",
        t.activatedAt ? new Date(t.activatedAt).toLocaleDateString("th-TH", {
          year:"numeric", month:"2-digit", day:"2-digit",
          hour:"2-digit", minute:"2-digit"
        }) : "",
      ].join(",")),
    ];

    const csv = "\uFEFF" + rows.join("\n"); // BOM for Thai Excel

    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="draw_${period}_${tickets.length}tickets.csv"`,
      },
    });
  } catch (err) {
    console.error("[export-draw]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/admin/export-draw — mark winners
export async function POST(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const { ticketCodes, drawPeriod } = await req.json();
    if (!Array.isArray(ticketCodes) || ticketCodes.length === 0)
      return NextResponse.json({ error: "ต้องระบุรหัสฉลากผู้โชคดี" }, { status: 400 });

    const updated = await (prisma as any).digitalTicket.updateMany({
      where: { ticketCode: { in: ticketCodes } },
      data: { isWinner: true, drawPeriod: drawPeriod || null },
    });

    return NextResponse.json({
      message: `บันทึกผู้โชคดี ${updated.count} คนสำเร็จ`,
      count: updated.count,
    });
  } catch (err) {
    console.error("[export-draw POST]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
