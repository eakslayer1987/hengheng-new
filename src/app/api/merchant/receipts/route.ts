// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) return NextResponse.json({ error: "ต้องระบุเบอร์โทร" }, { status: 400 });
  const merchant = await prisma.merchant.findUnique({
    where: { phone: phone.replace(/\D/g, "") },
    include: { receipts: { orderBy: { submittedAt: "desc" }, include: { quota: { select: { totalCodes: true, usedCodes: true } } } } },
  });
  if (!merchant) return NextResponse.json({ error: "ไม่พบร้านค้า" }, { status: 404 });
  return NextResponse.json({ receipts: merchant.receipts });
}

export async function POST(req: NextRequest) {
  try {
    const form     = await req.formData();
    const phone    = String(form.get("phone") || "").replace(/\D/g, "");
    const bagCount = parseInt(form.get("bagCount") as string) || 1;
    const file     = form.get("image") as File | null;
    if (!phone || !file)
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

    const merchant = await prisma.merchant.findUnique({ where: { phone } });
    if (!merchant) return NextResponse.json({ error: "ไม่พบร้านค้า" }, { status: 404 });
    if (merchant.status !== "approved")
      return NextResponse.json({ error: "ร้านค้ายังไม่ได้รับการอนุมัติ" }, { status: 403 });

    const mimeType = file.type || "image/jpeg";
    const allowed  = ["image/jpeg","image/jpg","image/png","image/gif","image/webp"];
    if (!allowed.includes(mimeType))
      return NextResponse.json({ error: "รองรับเฉพาะ JPG, PNG, GIF, WEBP" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024)
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 5MB" }, { status: 400 });

    // Save to DB (not filesystem)
    const upload = await prisma.uploadedFile.create({
      data: { filename: file.name || "receipt.jpg", mimeType, size: buffer.length, data: buffer },
    });
    const imageUrl = `/api/upload/${upload.id}`;

    const receipt = await prisma.receipt.create({
      data: { merchantId: merchant.id, imageUrl, bagCount, status: "pending" },
    });
    return NextResponse.json({ receipt, message: "อัปโหลดใบเสร็จสำเร็จ รอการอนุมัติจาก Admin" });
  } catch (err) {
    console.error("[receipts POST]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
