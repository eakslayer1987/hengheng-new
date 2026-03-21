// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!id || isNaN(id)) return new NextResponse("Not found", { status: 404 });

    const etag = `"upload-${id}"`;
    if (req.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const file = await prisma.uploadedFile.findUnique({
      where: { id },
      select: { data: true, mimeType: true, size: true },
    });
    if (!file) return new NextResponse("Not found", { status: 404 });

    return new NextResponse(new Uint8Array(file.data as Buffer), {
      headers: {
        "Content-Type":   file.mimeType,
        "Content-Length": String(file.size),
        "Cache-Control":  "public, max-age=31536000, immutable",
        "ETag":           etag,
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.uploadedFile.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ message: "ลบสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
