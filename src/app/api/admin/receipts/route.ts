// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";

const TICKETS_PER_BAG = 20; // ฉลาก 20 ใบ ต่อ 1 ถุง

// ─── สร้างเลข 6 หลักไม่ซ้ำ ─────────────────────────────────────────
function genTicketCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function generateUniqueCode(): Promise<string> {
  let code = genTicketCode();
  let tries = 0;
  while (true) {
    const exists = await (prisma as any).digitalTicket.findUnique({ where: { ticketCode: code } });
    if (!exists) return code;
    if (++tries > 50) throw new Error("ticket_gen_fail");
    code = genTicketCode();
  }
}

// ─── GET — list receipts ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  const status = req.nextUrl.searchParams.get("status") || "";
  const page   = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit  = 10;
  const where  = status ? { status } : {};
  const [receipts, total] = await Promise.all([
    prisma.receipt.findMany({
      where, orderBy: { submittedAt: "desc" }, skip: (page-1)*limit, take: limit,
      include: { merchant: { select: { name: true, phone: true } }, quota: true },
    }),
    prisma.receipt.count({ where }),
  ]);
  let codesPerBag = 30;
  try { const c = await prisma.campaign.findFirst({ where: { isActive: true } }); if (c) codesPerBag = c.codesPerBag; } catch {}
  return NextResponse.json({ receipts, total, pages: Math.ceil(total/limit), codesPerBag });
}

// ─── PATCH — approve / reject ─────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try {
    const { id, action, reviewNote } = await req.json();
    const receipt = await prisma.receipt.findUnique({
      where: { id: Number(id) },
      include: { merchant: true },
    });
    if (!receipt) return NextResponse.json({ error: "ไม่พบใบเสร็จ" }, { status: 404 });

    if (action === "approve") {
      const campaign = await prisma.campaign.findFirst({ where: { isActive: true } });
      if (!campaign) return NextResponse.json({ error: "ไม่มีแคมเปญที่เปิดอยู่" }, { status: 400 });

      const totalCodes   = receipt.bagCount * campaign.codesPerBag;
      const totalTickets = receipt.bagCount * TICKETS_PER_BAG;

      // สร้าง ticket codes ทั้งหมดก่อน (ป้องกัน duplicate)
      const ticketCodes: string[] = [];
      for (let i = 0; i < totalTickets; i++) {
        ticketCodes.push(await generateUniqueCode());
      }

      await prisma.$transaction(async (tx) => {
        // 1. อนุมัติใบเสร็จ
        await tx.receipt.update({
          where: { id: Number(id) },
          data: { status: "approved", reviewedAt: new Date(), reviewNote: reviewNote || null },
        });

        // 2. สร้าง/อัปเดต MerchantQuota (QR Code เดิม)
        await tx.merchantQuota.upsert({
          where: { receiptId: Number(id) },
          update: { totalCodes, isActive: true },
          create: {
            merchantId: receipt.merchantId,
            receiptId: Number(id),
            campaignId: campaign.id,
            totalCodes,
            usedCodes: 0,
            isActive: true,
          },
        });

        // 3. สร้าง DigitalTicket ฉลากดิจิทัล
        await (tx as any).digitalTicket.createMany({
          data: ticketCodes.map(code => ({
            merchantId: receipt.merchantId,
            receiptId:  Number(id),
            campaignId: campaign.id,
            ticketCode: code,
            status:     "unclaimed",
          })),
        });
      });

      return NextResponse.json({
        message: `อนุมัติแล้ว — QR ${totalCodes} รหัส + ฉลากดิจิทัล ${totalTickets} ใบ (${receipt.bagCount} ถุง × ${TICKETS_PER_BAG})`,
        totalCodes,
        totalTickets,
      });
    }

    if (action === "reject") {
      await prisma.receipt.update({
        where: { id: Number(id) },
        data: { status: "rejected", reviewedAt: new Date(), reviewNote: reviewNote || null },
      });
      return NextResponse.json({ message: "ปฏิเสธใบเสร็จแล้ว" });
    }

    return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
  } catch (err) {
    console.error("[receipts PATCH]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
