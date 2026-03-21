// @ts-nocheck
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIP } from "@/lib/rate-limit";

async function getCfg(key: string, fallback: string): Promise<string> {
  try {
    const r = await prisma.systemConfig.findUnique({ where: { key } });
    return r?.value ?? fallback;
  } catch { return fallback; }
}

const SMSMKT_URL = "https://www.smsmkt.com/api/sms-send";
function genOTP() { return String(Math.floor(100000 + Math.random() * 900000)); }

async function sendSMS(phone: string, msg: string): Promise<boolean> {
  const api_key = process.env.SMSMKT_API_KEY || "";
  const secret_key = process.env.SMSMKT_SECRET_KEY || "";
  if (!api_key) { console.log("[OTP dev]", phone, msg); return true; }
  try {
    const res = await fetch(SMSMKT_URL, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key, secret_key, sender: "หมีปรุง", phone, message: msg }) });
    const d = await res.json();
    return d.result === "0" || d.result === 0;
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  try {
    const { action, phone, code } = await req.json();
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (cleanPhone.length < 9) return NextResponse.json({ error: "เบอร์โทรไม่ถูกต้อง" }, { status: 400 });

    const ip = getIP(req);

    if (action === "send") {
      // ─── Rate limit 1: max 5 OTP requests per phone per hour ───
      if (!rateLimit(`otp:phone:${cleanPhone}`, 5, 3_600_000)) {
        return NextResponse.json(
          { error: "ขอ OTP เกินกำหนด กรุณารอ 1 ชั่วโมง" },
          { status: 429 }
        );
      }
      // ─── Rate limit 2: max 10 OTP requests per IP per hour ─────
      if (!rateLimit(`otp:ip:${ip}`, 10, 3_600_000)) {
        return NextResponse.json(
          { error: "คำขอมากเกินไป กรุณาลองใหม่ภายหลัง" },
          { status: 429 }
        );
      }
    }

    if (action === "verify") {
      // ─── Rate limit: max 10 verify attempts per phone per 15 min ─
      if (!rateLimit(`otp:verify:${cleanPhone}`, 10, 900_000)) {
        return NextResponse.json(
          { error: "พยายามยืนยัน OTP มากเกินไป กรุณารอสักครู่" },
          { status: 429 }
        );
      }
    }

    const expireMin   = parseInt(await getCfg("otp_expire_minutes", "5")) || 5;
    const rateLimitSec = parseInt(await getCfg("otp_rate_limit_seconds", "60")) || 60;

    if (action === "send") {
      const recent = await prisma.otpCode.findFirst({
        where: { phone: cleanPhone, createdAt: { gte: new Date(Date.now() - rateLimitSec * 1000) } },
        orderBy: { createdAt: "desc" },
      });
      if (recent) return NextResponse.json({ error: `กรุณารอ ${rateLimitSec} วินาทีก่อนขอ OTP ใหม่` }, { status: 429 });

      const otp = genOTP();
      const expiresAt = new Date(Date.now() + expireMin * 60_000);
      await prisma.otpCode.create({ data: { phone: cleanPhone, code: otp, purpose: "register", expiresAt } });

      const ok = await sendSMS(cleanPhone, `[ปังจัง Lucky Draw] รหัส OTP: ${otp} (หมดอายุใน ${expireMin} นาที)`);
      return NextResponse.json({
        sent: ok,
        message: ok ? `ส่ง OTP ไปที่ ${cleanPhone.slice(0,3)}****${cleanPhone.slice(-3)} แล้ว` : "ส่ง SMS ไม่สำเร็จ",
        ...(process.env.SMSMKT_API_KEY ? {} : { devOtp: otp }),
      });
    }

    if (action === "verify") {
      if (!code) return NextResponse.json({ error: "กรุณากรอก OTP" }, { status: 400 });
      const record = await prisma.otpCode.findFirst({
        where: { phone: cleanPhone, code: String(code).trim(), verified: false, expiresAt: { gte: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      if (!record) return NextResponse.json({ error: "OTP ไม่ถูกต้อง หรือหมดอายุแล้ว" }, { status: 400 });
      await prisma.otpCode.update({ where: { id: record.id }, data: { verified: true } });
      return NextResponse.json({ verified: true, phone: cleanPhone });
    }

    return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
  } catch (err) {
    console.error("[otp]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
