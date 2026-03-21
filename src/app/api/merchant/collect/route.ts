// @ts-nocheck
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConfigInt } from "@/lib/config";
import { rateLimit, getIP } from "@/lib/rate-limit";

function genCode(len = 10) {
  return Array.from({ length: len }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
  ).join("");
}

function haversineM(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIP(req);
    // ─── Rate limit: max 20 collect requests per IP per 10 min ───
    if (!rateLimit(`collect:ip:${ip}`, 20, 600_000)) {
      return NextResponse.json(
        { error: "คำขอมากเกินไป กรุณารอสักครู่" },
        { status: 429 }
      );
    }

    const { merchantPhone, customerName, customerPhone, customerLat, customerLng } = await req.json();

    if (!merchantPhone || !customerName || !customerPhone)
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });

    const cleanPhone = String(customerPhone).replace(/\D/g, "");
    if (cleanPhone.length < 9)
      return NextResponse.json({ error: "เบอร์โทรลูกค้าไม่ถูกต้อง" }, { status: 400 });

    const [dailyLimit, gpsRadius] = await Promise.all([
      getConfigInt("daily_collect_limit"),
      getConfigInt("gps_radius_m"),
    ]);
    const limit  = dailyLimit || 3;
    const radius = gpsRadius  || 20;

    const merchant = await prisma.merchant.findUnique({ where: { phone: String(merchantPhone) } });
    if (!merchant)           return NextResponse.json({ error: "ไม่พบร้านค้า" }, { status: 404 });
    if (merchant.status !== "approved")
      return NextResponse.json({ error: "ร้านค้านี้ยังไม่ได้รับการอนุมัติ" }, { status: 403 });
    if (!merchant.isActive)
      return NextResponse.json({ error: "ร้านค้าถูกระงับชั่วคราว" }, { status: 403 });

    // GPS check
    if (merchant.lat && merchant.lng) {
      if (!customerLat || !customerLng)
        return NextResponse.json({ error: "ต้องเปิด GPS เพื่อยืนยันตำแหน่ง", needGps: true }, { status: 400 });
      const dist = haversineM(Number(merchant.lat), Number(merchant.lng), Number(customerLat), Number(customerLng));
      if (dist > radius)
        return NextResponse.json({
          error: `คุณอยู่ห่างร้าน ${Math.round(dist)} เมตร — ต้องอยู่ในระยะ ${radius} เมตร`,
          distance: Math.round(dist), maxDistance: radius,
        }, { status: 403 });
    }

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    // 1 code per shop per day
    const alreadyShop = await prisma.collectedCode.findFirst({
      where: { merchantId: merchant.id, customerPhone: cleanPhone, collectedAt: { gte: todayStart } },
    });
    if (alreadyShop)
      return NextResponse.json({ error: "คุณเก็บโค้ดจากร้านนี้แล้ววันนี้ มาใหม่พรุ่งนี้ 🌟", alreadyCollected: true }, { status: 409 });

    // Daily limit
    const todayTotal = await prisma.collectedCode.count({
      where: { customerPhone: cleanPhone, collectedAt: { gte: todayStart } },
    });
    if (todayTotal >= limit)
      return NextResponse.json({
        error: `คุณเก็บโค้ดครบ ${limit} ครั้งแล้ววันนี้ มาใหม่พรุ่งนี้ 🌟`,
        todayUsed: todayTotal, dailyLimit: limit,
      }, { status: 429 });

    const campaign = await prisma.campaign.findFirst({
      where: { isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!campaign)
      return NextResponse.json({ error: "ขณะนี้ยังไม่มีแคมเปญที่เปิดอยู่" }, { status: 400 });

    const allQuotas = await prisma.merchantQuota.findMany({
      where: { merchantId: merchant.id, isActive: true, campaignId: campaign.id },
    });
    const activeQuota = allQuotas.find(q => q.usedCodes < q.totalCodes) ?? null;
    if (!activeQuota)
      return NextResponse.json({ error: "โควต้า QR ของร้านนี้หมดแล้ว กรุณาติดต่อร้านค้า" }, { status: 400 });

    // Generate unique code
    let code = genCode();
    let tries = 0;
    while (await prisma.collectedCode.findUnique({ where: { code } })) {
      code = genCode(); if (++tries > 20) throw new Error("code_gen_fail");
    }

    const collected = await prisma.$transaction(async (tx) => {
      const c = await tx.collectedCode.create({
        data: {
          code, campaignId: campaign.id, merchantId: merchant.id, quotaId: activeQuota.id,
          customerPhone: cleanPhone, customerName: String(customerName).trim().slice(0, 100),
        },
      });
      await tx.merchantQuota.update({ where: { id: activeQuota.id }, data: { usedCodes: { increment: 1 } } });
      return c;
    });

    return NextResponse.json({
      success: true,
      code: collected.code,
      merchantName: merchant.name,
      campaignName: campaign.name,
      campaignEndDate: campaign.endDate,
      todayUsed: todayTotal + 1,
      dailyLimit: limit,
      remainingToday: limit - todayTotal - 1,
    });

  } catch (err) {
    console.error("[collect]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
