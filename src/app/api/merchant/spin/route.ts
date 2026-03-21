// @ts-nocheck
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "ระบบหมุนวงล้อถูกยกเลิกแล้ว ใช้ /api/merchant/collect แทน" }, { status: 410 });
}
