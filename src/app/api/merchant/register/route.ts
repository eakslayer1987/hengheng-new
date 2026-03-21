// @ts-nocheck
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const {
      name, ownerName, phone, address,
      lineUserId, lineDisplayName, lineAvatarUrl,
      lat, lng,
      otpVerified,   // true = phone was verified via OTP
    } = await req.json();

    // ── Validate required fields ──
    if (!name?.trim())    return NextResponse.json({ error: "กรุณากรอกชื่อร้านค้า"    }, { status: 400 });
    if (!ownerName?.trim()) return NextResponse.json({ error: "กรุณากรอกชื่อเจ้าของ"    }, { status: 400 });
    if (!address?.trim()) return NextResponse.json({ error: "กรุณากรอกที่อยู่ร้านค้า (บังคับ)" }, { status: 400 });
    if (!lat || !lng)     return NextResponse.json({ error: "กรุณาบันทึกตำแหน่ง GPS ก่อนสมัคร" }, { status: 400 });

    // ── Phone or LINE required ──
    const cleanPhone = phone ? String(phone).replace(/\D/g, "") : "";
    if (!cleanPhone && !lineUserId)
      return NextResponse.json({ error: "ต้องระบุเบอร์โทร หรือเชื่อมต่อ LINE" }, { status: 400 });

    if (cleanPhone && cleanPhone.length < 9)
      return NextResponse.json({ error: "เบอร์โทรไม่ถูกต้อง" }, { status: 400 });

    // ── Verify OTP was done (if registering via phone) ──
    if (cleanPhone && !lineUserId && !otpVerified) {
      // Double-check a verified OTP exists in DB
      const validOtp = await prisma.otpCode.findFirst({
        where: {
          phone: cleanPhone,
          verified: true,
          createdAt: { gte: new Date(Date.now() - 10 * 60_000) }, // within 10 min
        },
        orderBy: { createdAt: "desc" },
      });
      if (!validOtp)
        return NextResponse.json({ error: "กรุณายืนยัน OTP ก่อนสมัคร" }, { status: 403 });
    }

    // ── Check duplicates ──
    if (cleanPhone) {
      const existsByPhone = await prisma.merchant.findUnique({ where: { phone: cleanPhone } });
      if (existsByPhone) {
        const msg = existsByPhone.status === "pending"
          ? "เบอร์นี้สมัครแล้ว กำลังรอแอดมินอนุมัติ"
          : existsByPhone.status === "rejected"
            ? "เบอร์นี้ถูกปฏิเสธ กรุณาติดต่อแอดมิน"
            : "เบอร์โทรนี้สมัครแล้ว";
        return NextResponse.json({ error: msg, merchant: existsByPhone }, { status: 409 });
      }
    }
    if (lineUserId) {
      const existsByLine = await prisma.merchant.findFirst({ where: { lineUserId } });
      if (existsByLine)
        return NextResponse.json({ error: "บัญชี LINE นี้สมัครแล้ว", merchant: existsByLine }, { status: 409 });
    }

    // ── Create merchant ──
    const merchant = await prisma.merchant.create({
      data: {
        name:            String(name).trim(),
        ownerName:       String(ownerName).trim(),
        phone:           cleanPhone || `LINE_${lineUserId}`, // fallback key if LINE-only
        address:         String(address).trim(),
        lineUserId:      lineUserId   || null,
        lineDisplayName: lineDisplayName || null,
        lineAvatarUrl:   lineAvatarUrl || null,
        lat:             Number(lat),
        lng:             Number(lng),
        status:          "pending",
        isActive:        false,
      },
    });

    return NextResponse.json({
      merchant,
      message: "สมัครสำเร็จ! รอแอดมินอนุมัติก่อนใช้งานได้",
    });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
