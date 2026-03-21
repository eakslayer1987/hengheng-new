// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getLineToken() {
  const s = await prisma.systemConfig.findUnique({ where: { key: "line_channel_access_token" } });
  return s?.value || null;
}

async function sendLinePush(token: string, to: string, message: string) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text: message }],
    }),
  });
  return res.ok;
}

// GET: List riders with LINE chat capability
export async function GET() {
  try {
    const riders = await prisma.rider.findMany({
      where: { isActive: true },
      select: { id: true, name: true, phone: true, photo: true, lineUserId: true, status: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(riders);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Send message to rider via LINE
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Send message to specific rider
    if (action === "send") {
      const { riderId, message } = body;
      if (!riderId || !message) return NextResponse.json({ error: "Missing riderId or message" }, { status: 400 });

      const rider = await prisma.rider.findUnique({ where: { id: riderId } });
      if (!rider) return NextResponse.json({ error: "Rider not found" }, { status: 404 });
      if (!rider.lineUserId) return NextResponse.json({ error: "คนขับยังไม่ได้เชื่อมต่อ LINE", noLine: true }, { status: 400 });

      const token = await getLineToken();
      if (!token) return NextResponse.json({ error: "LINE token not configured" }, { status: 500 });

      const ok = await sendLinePush(token, rider.lineUserId, `📢 ข้อความจากแอดมิน:\n${message}`);
      if (!ok) return NextResponse.json({ error: "ส่งข้อความไม่สำเร็จ" }, { status: 500 });

      return NextResponse.json({ ok: true, sent: true });
    }

    // Broadcast message to all online riders
    if (action === "broadcast") {
      const { message } = body;
      if (!message) return NextResponse.json({ error: "Missing message" }, { status: 400 });

      const token = await getLineToken();
      if (!token) return NextResponse.json({ error: "LINE token not configured" }, { status: 500 });

      const riders = await prisma.rider.findMany({
        where: { isActive: true, lineUserId: { not: null }, status: { in: ["online", "busy"] } },
      });

      let sent = 0;
      for (const r of riders) {
        if (r.lineUserId) {
          const ok = await sendLinePush(token, r.lineUserId, `📢 ประกาศจากแอดมิน:\n${message}`);
          if (ok) sent++;
        }
      }

      return NextResponse.json({ ok: true, sent, total: riders.length });
    }

    // Link LINE userId to rider (from webhook when rider adds OA as friend)
    if (action === "link-line") {
      const { riderId, lineUserId } = body;
      if (!riderId || !lineUserId) return NextResponse.json({ error: "Missing data" }, { status: 400 });
      await prisma.rider.update({ where: { id: riderId }, data: { lineUserId } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
