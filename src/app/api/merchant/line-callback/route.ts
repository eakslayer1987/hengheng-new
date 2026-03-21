// @ts-nocheck
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/merchant/line-callback
// Called from LIFF after LINE login — receives profile from frontend
// (LIFF runs client-side; profile is verified by accessToken exchange server-side if needed)
export async function POST(req: NextRequest) {
  try {
    const { accessToken, lineUserId, displayName, pictureUrl, phone } = await req.json();
    if (!lineUserId || !displayName)
      return NextResponse.json({ error: "ข้อมูล LINE ไม่ครบ" }, { status: 400 });

    // Optional server-side verify: call LINE API to confirm token
    if (accessToken) {
      try {
        const verify = await fetch(`https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`);
        const vd = await verify.json();
        const channelId = process.env.LINE_CHANNEL_ID;
        if (channelId && vd.client_id !== channelId) {
          return NextResponse.json({ error: "LINE token ไม่ถูกต้อง" }, { status: 401 });
        }
      } catch { /* skip if network issue */ }
    }

    // Check if already registered with this LINE account
    const existsByLine = await prisma.merchant.findFirst({ where: { lineUserId } });
    if (existsByLine) {
      return NextResponse.json({
        exists: true,
        merchant: existsByLine,
        message: existsByLine.status === "pending"
          ? "บัญชีนี้สมัครแล้ว กำลังรอแอดมินอนุมัติ"
          : "เข้าสู่ระบบสำเร็จ",
      });
    }

    // Check by phone if provided
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      const existsByPhone = await prisma.merchant.findUnique({ where: { phone: cleanPhone } });
      if (existsByPhone) {
        // Link LINE to existing account
        const updated = await prisma.merchant.update({
          where: { id: existsByPhone.id },
          data: { lineUserId, lineDisplayName: displayName, lineAvatarUrl: pictureUrl || null },
        });
        return NextResponse.json({ exists: true, merchant: updated, message: "เชื่อม LINE กับบัญชีเดิมสำเร็จ" });
      }
    }

    // Return LINE profile for pre-filling registration form
    return NextResponse.json({
      exists: false,
      lineProfile: { lineUserId, displayName, pictureUrl: pictureUrl || null },
      message: "กรุณากรอกข้อมูลร้านค้าเพื่อสมัคร",
    });
  } catch (err) {
    console.error("[line-callback]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
