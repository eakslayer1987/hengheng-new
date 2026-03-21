// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  const prizes = await prisma.prize.findMany({ orderBy: [{ campaignId: "asc" }, { sortOrder: "asc" }] });
  return NextResponse.json({ prizes });
}

export async function POST(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  try {
    const { campaignId, name, value, quantity, sortOrder } = await req.json();
    const prize = await prisma.prize.create({
      data: { campaignId: Number(campaignId), name, value: Number(value), quantity: Number(quantity), remaining: Number(quantity), sortOrder: sortOrder || 0 },
    });
    return NextResponse.json({ prize });
  } catch (err) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  try {
    const { id, name, value, quantity, remaining, sortOrder } = await req.json();
    const prize = await prisma.prize.update({
      where: { id: Number(id) },
      data: { ...(name && { name }), ...(value !== undefined && { value: Number(value) }), ...(quantity !== undefined && { quantity: Number(quantity) }), ...(remaining !== undefined && { remaining: Number(remaining) }), ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }) },
    });
    return NextResponse.json({ prize });
  } catch (err) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  try {
    const { id } = await req.json();
    await prisma.prize.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ลบไม่ได้ (มีรหัสผูกอยู่)" }, { status: 400 });
  }
}
