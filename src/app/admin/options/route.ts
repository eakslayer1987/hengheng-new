// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";
const JWT_SECRET = process.env.JWT_SECRET || "taladpang-secret-2026";

function auth(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  try { jwt.verify(token, JWT_SECRET); return true; } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const menuItemId = Number(searchParams.get("menuItemId"));
  if (!menuItemId) return NextResponse.json({ error: "menuItemId required" }, { status: 400 });
  const groups = await prisma.optionGroup.findMany({
    where: { menuItemId },
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { action, ...data } = body;

  if (action === "create-group") {
    const g = await prisma.optionGroup.create({ data: {
      menuItemId: data.menuItemId, name: data.name,
      description: data.description || null,
      type: data.type || "single", required: data.required || false,
      maxSelect: data.maxSelect || null, sortOrder: 0,
      isActive: true,
    }, include: { items: true } });
    return NextResponse.json(g);
  }

  if (action === "update-group") {
    const g = await prisma.optionGroup.update({ where: { id: data.id }, data: {
      name: data.name,
      description: data.description !== undefined ? data.description : undefined,
      type: data.type, required: data.required, maxSelect: data.maxSelect,
    }, include: { items: true } });
    return NextResponse.json(g);
  }

  if (action === "delete-group") {
    await prisma.optionGroup.delete({ where: { id: data.id } });
    return NextResponse.json({ ok: true });
  }

  if (action === "create-item") {
    const item = await prisma.optionItem.create({ data: {
      groupId: data.groupId, name: data.name,
      price: data.price || 0, isDefault: data.isDefault || false, sortOrder: 0,
      isActive: true,
    }});
    return NextResponse.json(item);
  }

  if (action === "update-item") {
    const item = await prisma.optionItem.update({ where: { id: data.id }, data: {
      name: data.name, price: data.price, isDefault: data.isDefault,
    }});
    return NextResponse.json(item);
  }

  if (action === "delete-item") {
    await prisma.optionItem.delete({ where: { id: data.id } });
    return NextResponse.json({ ok: true });
  }

  if (action === "copy-options") {
    const fromGroups = await prisma.optionGroup.findMany({
      where: { menuItemId: data.fromMenuItemId },
      include: { items: true },
    });
    for (const g of fromGroups) {
      const newG = await prisma.optionGroup.create({ data: {
        menuItemId: data.toMenuItemId, name: g.name,
        description: g.description,
        type: g.type, required: g.required, maxSelect: g.maxSelect, sortOrder: g.sortOrder,
        isActive: true,
      }});
      for (const i of g.items) {
        await prisma.optionItem.create({ data: {
          groupId: newG.id, name: i.name, price: i.price,
          isDefault: i.isDefault, sortOrder: i.sortOrder,
        }});
      }
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
