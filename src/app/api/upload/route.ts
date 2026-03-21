// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.data) return NextResponse.json({ error: "ไม่มีข้อมูล" }, { status: 400 });

    const base64   = body.data.replace(/^data:[^;]+;base64,/, "");
    const match    = body.data.match(/^data:([^;]+);base64,/);
    const mimeType = match?.[1] || "image/jpeg";
    const filename = body.filename || "upload";

    const allowed = ["image/jpeg","image/jpg","image/png","image/gif","image/webp"];
    if (!allowed.includes(mimeType))
      return NextResponse.json({ error: "รองรับเฉพาะ JPG, PNG, GIF, WEBP" }, { status: 400 });

    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > 10 * 1024 * 1024)
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 10MB" }, { status: 400 });

    const upload = await prisma.uploadedFile.create({
      data: { filename, mimeType, size: buffer.length, data: buffer },
    });

    return NextResponse.json({ id: upload.id, url: `/api/upload/${upload.id}` });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
