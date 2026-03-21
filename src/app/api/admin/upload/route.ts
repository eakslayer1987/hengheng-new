// @ts-nocheck
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // Accept auth from either header
    const token = req.headers.get("x-admin-token") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "ไฟล์ใหญ่เกินไป (สูงสุด 5MB)" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowed.includes(ext)) return NextResponse.json({ error: "อนุญาตเฉพาะไฟล์ jpg, png, webp, gif" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
    const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ url: base64 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
