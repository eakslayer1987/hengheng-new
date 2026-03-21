// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, verifyToken } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "pj_admin_token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 3600,
};

const failedAttempts = new Map<string, { count: number; lockUntil: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`login:${ip}`, 10, 60000)) {
      return NextResponse.json({ error: "คุณลองบ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
    }
    const record = failedAttempts.get(ip);
    if (record && record.count >= 5 && Date.now() < record.lockUntil) {
      const minsLeft = Math.ceil((record.lockUntil - Date.now()) / 60000);
      return NextResponse.json({ error: `บัญชีถูกล็อค กรุณารอ ${minsLeft} นาที` }, { status: 429 });
    }
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }
    const user = await prisma.adminUser.findUnique({ where: { username: String(username).trim() } });
    if (!user || !comparePassword(password, user.password)) {
      const ex = failedAttempts.get(ip) || { count: 0, lockUntil: 0 };
      ex.count++;
      if (ex.count >= 5) ex.lockUntil = Date.now() + 15 * 60 * 1000;
      failedAttempts.set(ip, ex);
      return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }
    failedAttempts.delete(ip);
    const token = signToken({ id: user.id, username: user.username, role: "admin" });
    const res = NextResponse.json({ token, user: { id: user.id, username: user.username } });
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res;
  } catch (e: any) {
    console.error("[AUTH]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, user: payload });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// PATCH — change admin username/password
export async function PATCH(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  try {
    const { username, password } = await req.json();
    if (!password || String(password).length < 6)
      return NextResponse.json({ error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัว" }, { status: 400 });

    const admin = await prisma.adminUser.findFirst();
    if (!admin) return NextResponse.json({ error: "ไม่พบบัญชีแอดมิน" }, { status: 404 });

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(String(password), 10);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        ...(username?.trim() ? { username: username.trim() } : {}),
        password: hash,
      },
    });
    return NextResponse.json({ ok: true, message: "เปลี่ยนรหัสผ่านสำเร็จ กรุณาล็อกอินใหม่" });
  } catch (err) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
