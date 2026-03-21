// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// Default content values
const CONTENT_DEFAULTS: Record<string, string> = {
  // App header
  app_name:           "ปังจัง Lucky Draw",
  app_subtitle:       "ชิงโชคมูลค่ากว่า 1 ล้านบาท",
  // Fallback hero slides (JSON array)
  hero_slides:        JSON.stringify([
    { emoji:"🎰", title:"ชิงโชคมูลค่า 2.4 ล้านบาท", sub:"สแกน QR ที่ร้านพาร์ทเนอร์" },
    { emoji:"🏪", title:"ร้านค้าพาร์ทเนอร์",          sub:"ยิ่งขายซอสหมีปรุง ยิ่งได้ QR" },
    { emoji:"🎫", title:"สะสมโค้ด ลุ้นโชคใหญ่",      sub:"เก็บโค้ดได้สูงสุด 3 ร้าน/วัน" },
  ]),
  // Daily limit info card
  daily_limit_title:  "เก็บโค้ดได้ 3 ครั้ง/วัน",
  daily_limit_sub:    "สะสมได้จากร้านค้าพาร์ทเนอร์ต่างๆ รวมกัน ไม่เกิน 3 ครั้งต่อวัน",
  // How-to steps (JSON array)
  how_to_steps:       JSON.stringify([
    { n:1, e:"🍽️", t:"ซื้อซอสหมีปรุงที่ร้านพาร์ทเนอร์", d:"ร้านที่มีป้าย Smart QR ปังจัง" },
    { n:2, e:"📍",  t:"สแกน QR ในระยะ 20 เมตร",          d:"ต้องอยู่ในร้านเท่านั้น เพื่อยืนยันตัวตน" },
    { n:3, e:"📝",  t:"กรอกชื่อ+เบอร์ → รับโค้ดทันที",   d:"1 ร้านได้ 1 โค้ด/วัน สูงสุด 3 ร้าน/วัน" },
    { n:4, e:"🎟️", t:"สะสมโค้ด → ลุ้นโชคใหญ่",          d:"ยิ่งมีโค้ดมาก ยิ่งมีสิทธิ์มาก" },
  ]),
  // Bottom navbar
  nav_home:           "หน้าหลัก",
  nav_prizes:         "รางวัล",
  nav_scan:           "รหัสชิง",
  nav_check:          "ตรวจสอบ",
  nav_more:           "อื่นๆ",
  // Scan button text
  scan_btn_text:      "สแกน QR รับโค้ดลุ้นโชค",
  // Prize section title
  prize_section_title: "🏆 รางวัลโชคใหญ่",
};

export async function GET() {
  try {
    const keys = Object.keys(CONTENT_DEFAULTS);
    const rows = await prisma.systemConfig.findMany({ where: { key: { in: keys } } });
    const map: Record<string, string> = { ...CONTENT_DEFAULTS };
    for (const r of rows) map[r.key] = r.value;
    return NextResponse.json({ content: map });
  } catch {
    return NextResponse.json({ content: CONTENT_DEFAULTS });
  }
}
