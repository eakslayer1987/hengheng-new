// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
// Entries replaced by /api/admin/collections
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = "/api/admin/collections";
  return NextResponse.redirect(url);
}
export async function PATCH() {
  return NextResponse.json({ error: "ใช้ /api/admin/collections แทน" }, { status: 410 });
}
