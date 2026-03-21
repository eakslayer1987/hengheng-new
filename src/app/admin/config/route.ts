// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Default system config values
const DEFAULTS: Record<string, { value: string; label: string }> = {
  // System
  gps_radius_m:         { value: "20",    label: "รัศมี GPS (เมตร)" },
  daily_collect_limit:  { value: "3",     label: "สิทธิ์สะสม/วัน/คน" },
  otp_expire_min:       { value: "5",     label: "OTP หมดอายุ (นาที)" },
  otp_cooldown_sec:     { value: "60",    label: "รอก่อนขอ OTP ใหม่ (วินาที)" },
  registration_open:    { value: "true",  label: "เปิด/ปิดสมัครร้านค้าใหม่" },
  // Content
  app_name:             { value: "ปังจัง Lucky Draw", label: "ชื่อแอป" },
  app_subtitle:         { value: "ชิงโชคมูลค่ากว่า 1 ล้านบาท", label: "คำโปรยหัว" },
  daily_limit_title:    { value: "เก็บโค้ดได้ 3 ครั้ง/วัน", label: "หัวข้อ daily limit" },
  daily_limit_sub:      { value: "สะสมได้จากร้านค้าพาร์ทเนอร์ต่างๆ รวมกัน ไม่เกิน 3 ครั้งต่อวัน", label: "รายละเอียด daily limit" },
  scan_btn_text:        { value: "สแกน QR รับโค้ดลุ้นโชค", label: "ข้อความปุ่ม Scan" },
  prize_section_title:  { value: "🏆 รางวัลโชคใหญ่", label: "หัวข้อส่วนรางวัล" },
  nav_home:             { value: "หน้าหลัก",   label: "เมนู: หน้าหลัก" },
  nav_prizes:           { value: "รางวัล",     label: "เมนู: รางวัล" },
  nav_scan:             { value: "รหัสชิง",    label: "เมนู: สแกน" },
  nav_check:            { value: "ตรวจสอบ",   label: "เมนู: ตรวจสอบ" },
  nav_more:             { value: "อื่นๆ",      label: "เมนู: อื่นๆ" },
};

export async function GET(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const rows = await prisma.systemConfig.findMany();
    const map: Record<string, string> = {};
    for (const [k, d] of Object.entries(DEFAULTS)) map[k] = d.value;
    for (const r of rows) map[r.key] = r.value;
    return NextResponse.json({ config: map, defaults: DEFAULTS });
  } catch (err) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const updates: Record<string, string> = await req.json();
    const ops = Object.entries(updates).map(([key, value]) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value), label: DEFAULTS[key]?.label },
        create: { key, value: String(value), label: DEFAULTS[key]?.label },
      })
    );
    await Promise.all(ops);
    return NextResponse.json({ ok: true, message: `บันทึก ${ops.length} ค่าสำเร็จ` });
  } catch (err) {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
