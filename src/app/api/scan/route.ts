// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/scan?m=PHONE
// Smart QR redirect — checks merchant status then redirects to customer app
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("m");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!phone) return NextResponse.redirect(`${appUrl}/?err=invalid`);

  const cleanPhone = phone.replace(/\D/g, "");

  try {
    const merchant = await prisma.merchant.findUnique({ where: { phone: cleanPhone } });

    if (!merchant)
      return NextResponse.redirect(`${appUrl}/?err=notfound`);
    if (merchant.status === "pending")
      return NextResponse.redirect(`${appUrl}/?err=pending`);
    if (merchant.status === "rejected")
      return NextResponse.redirect(`${appUrl}/?err=rejected`);
    if (!merchant.isActive)
      return NextResponse.redirect(`${appUrl}/?err=inactive`);

    // All good — redirect to scan tab with merchant phone pre-filled
    return NextResponse.redirect(`${appUrl}/scan?m=${cleanPhone}`);
  } catch {
    return NextResponse.redirect(`${appUrl}/?err=error`);
  }
}
