// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, ownerName, address, lat, lng } = body;

    if (!phone) return NextResponse.json({ error: "ต้องระบุ phone" }, { status: 400 });
    const cleanPhone = String(phone).replace(/\D/g, "");

    const merchant = await prisma.merchant.findUnique({ where: { phone: cleanPhone } });
    if (!merchant) return NextResponse.json({ error: "ไม่พบร้านค้า" }, { status: 404 });
    if (merchant.status === "rejected")
      return NextResponse.json({ error: "ร้านค้าถูกระงับ" }, { status: 403 });

    const updated = await prisma.merchant.update({
      where: { phone: cleanPhone },
      data: {
        ...(name?.trim()      && { name: String(name).trim().slice(0, 100) }),
        ...(ownerName?.trim() && { ownerName: String(ownerName).trim().slice(0, 100) }),
        ...(address?.trim()   && { address: String(address).trim() }),
        ...(lat !== undefined && lat !== null && { lat: Number(lat) }),
        ...(lng !== undefined && lng !== null && { lng: Number(lng) }),
      },
    });

    return NextResponse.json({ success: true, merchant: updated });
  } catch (err) {
    console.error("[merchant/update]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
