// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Default values — used when not yet in DB (not exported — Next.js only allows GET/POST/PATCH etc.)
const DEFAULTS: Record<string, { value: string; label: string }> = {
  spin_daily_limit:         { value: "3",   label: "จำนวนสิทธิ์หมุนวงล้อต่อวัน (ต่อลูกค้า รวมทุกร้าน)" },
  spin_weight_discount_10:  { value: "50",  label: "% โอกาส ส่วนลด 10 บาท" },
  spin_weight_free_meal:    { value: "20",  label: "% โอกาส ทานฟรีมื้อนี้" },
  spin_weight_lucky_draw:   { value: "30",  label: "% โอกาส สิทธิ์ลุ้นโชคใหญ่" },
  gps_radius_meters:        { value: "20",  label: "รัศมี GPS (เมตร) สำหรับยืนยันลูกค้าในร้าน" },
  otp_expire_minutes:       { value: "5",   label: "เวลาหมดอายุ OTP (นาที)" },
  otp_rate_limit_seconds:   { value: "60",  label: "ระยะ cooldown ขอ OTP ใหม่ (วินาที)" },
  app_name:                 { value: "ปังจัง Lucky Draw", label: "ชื่อแอปพลิเคชัน" },
  app_contact:              { value: "", label: "เบอร์ติดต่อ / LINE @ แอดมิน" },
};

// GET — return all configs merged with defaults
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const rows = await prisma.systemConfig.findMany();
  const map: Record<string, string> = {};
  rows.forEach(r => { map[r.key] = r.value; });

  const result: Record<string, { value: string; label: string }> = {};
  for (const [key, def] of Object.entries(DEFAULTS)) {
    result[key] = { value: map[key] ?? def.value, label: def.label };
  }
  return NextResponse.json({ config: result });
}

// PATCH — upsert one or many configs
export async function PATCH(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    // body: { key: value, ... }
    const updates = Object.entries(body).filter(([k]) => k in DEFAULTS);

    await Promise.all(updates.map(([key, value]) =>
      prisma.systemConfig.upsert({
        where:  { key },
        create: { key, value: String(value), label: DEFAULTS[key]?.label },
        update: { value: String(value) },
      })
    ));

    return NextResponse.json({ updated: updates.length, message: "บันทึกสำเร็จ" });
  } catch (err) {
    console.error("[system-config PATCH]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
