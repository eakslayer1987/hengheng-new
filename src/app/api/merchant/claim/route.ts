// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIP } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

const DAILY_LIMIT = 3; // สแกนได้สูงสุด 3 สิทธิ์/วัน

function haversineM(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// POST /api/merchant/claim
// body: { merchantPhone, customerName, customerPhone, customerLat?, customerLng? }
export async function POST(req: NextRequest) {
  try {
    const ip = getIP(req);

    // Rate limit per IP
    if (!rateLimit(`claim:ip:${ip}`, 20, 600_000)) {
      return NextResponse.json({ error: "คำขอมากเกินไป กรุณารอสักครู่" }, { status: 429 });
    }

    const { merchantPhone, customerName, customerPhone, customerLat, customerLng } = await req.json();

    if (!merchantPhone || !customerName || !customerPhone)
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });

    const cleanPhone = String(customerPhone).replace(/\D/g, "");
    if (cleanPhone.length < 9)
      return NextResponse.json({ error: "เบอร์โทรไม่ถูกต้อง" }, { status: 400 });

    // หาร้านค้า
    const merchant = await prisma.merchant.findUnique({
      where: { phone: String(merchantPhone).replace(/\D/g, "") },
    });
    if (!merchant)         return NextResponse.json({ error: "ไม่พบร้านค้า" }, { status: 404 });
    if (merchant.status !== "approved")
      return NextResponse.json({ error: "ร้านค้านี้ยังไม่ได้รับการอนุมัติ" }, { status: 403 });

    // GPS check
    if (merchant.lat && merchant.lng) {
      if (!customerLat || !customerLng)
        return NextResponse.json({ error: "ต้องเปิด GPS เพื่อยืนยันตำแหน่ง", needGps: true }, { status: 400 });
      const dist = haversineM(Number(merchant.lat), Number(merchant.lng), Number(customerLat), Number(customerLng));
      if (dist > 20)
        return NextResponse.json({
          error: `คุณอยู่ห่างร้าน ${Math.round(dist)} เมตร — ต้องอยู่ในระยะ 20 เมตร`,
          distance: Math.round(dist),
        }, { status: 403 });
    }

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    // เช็กว่าสแกนร้านนี้แล้วหรือยัง
    const alreadyThisShop = await (prisma as any).digitalTicket.findFirst({
      where: { merchantId: merchant.id, customerPhone: cleanPhone, activatedAt: { gte: todayStart } },
    });
    if (alreadyThisShop)
      return NextResponse.json({
        error: "คุณรับฉลากจากร้านนี้แล้ววันนี้ มาใหม่พรุ่งนี้ 🌟",
        alreadyCollected: true,
      }, { status: 409 });

    // เช็ก daily limit
    const todayTotal = await (prisma as any).digitalTicket.count({
      where: { customerPhone: cleanPhone, activatedAt: { gte: todayStart } },
    });
    if (todayTotal >= DAILY_LIMIT)
      return NextResponse.json({
        error: `คุณรับฉลากครบ ${DAILY_LIMIT} สิทธิ์แล้ววันนี้ มาใหม่พรุ่งนี้ 🌟`,
        todayUsed: todayTotal,
        dailyLimit: DAILY_LIMIT,
      }, { status: 429 });

    // ดึงฉลาก Unclaimed จาก Wallet ของร้าน
    const ticket = await (prisma as any).digitalTicket.findFirst({
      where: { merchantId: merchant.id, status: "unclaimed" },
      orderBy: { id: "asc" }, // FIFO
    });

    if (!ticket)
      return NextResponse.json({
        error: "ฉลากในกระเป๋าของร้านนี้หมดแล้ว กรุณาติดต่อร้านค้า",
        walletEmpty: true,
      }, { status: 400 });

    // Activate ฉลาก (ต้นขั้ว + หางตั๋ว)
    const activated = await (prisma as any).digitalTicket.update({
      where: { id: ticket.id },
      data: {
        status:        "activated",
        customerPhone: cleanPhone,
        customerName:  String(customerName).trim().slice(0, 100),
        activatedAt:   new Date(),
      },
    });

    return NextResponse.json({
      success:      true,
      ticketCode:   activated.ticketCode,  // หางตั๋ว — แสดงบนมือถือลูกค้า
      merchantName: merchant.name,
      todayUsed:    todayTotal + 1,
      dailyLimit:   DAILY_LIMIT,
      remainingToday: DAILY_LIMIT - todayTotal - 1,
      message: `ได้รับฉลากเลขที่ ${activated.ticketCode} จากร้าน ${merchant.name} 🎉`,
    });

  } catch (err) {
    console.error("[claim]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
