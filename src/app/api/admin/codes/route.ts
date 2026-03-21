// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = "/api/admin/collections";
  return NextResponse.redirect(url);
}
