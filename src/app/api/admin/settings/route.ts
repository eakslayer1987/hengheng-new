// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const SENSITIVE_KEYS = ["line_notify_token", "line_channel_id", "line_channel_secret", "line_channel_access_token", "admin_password", "jwt_secret"];

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.systemConfig.findMany();
    const obj: Record<string, string> = {};
    const token = req.headers.get("x-admin-token") || req.headers.get("authorization")?.replace("Bearer ", "");
    const isAdmin = !!token;
    settings.forEach(s => {
      if (!isAdmin && SENSITIVE_KEYS.includes(s.key)) return;
      obj[s.key] = s.value;
    });
    return NextResponse.json(obj);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 100);
      if (!safeKey) continue;
      await prisma.systemConfig.upsert({
        where: { key: safeKey },
        update: { value: String(value).substring(0, 5000) },
        create: { key: safeKey, value: String(value).substring(0, 5000) },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
