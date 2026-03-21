// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(categories);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    if (action === "create-item") {
      const item = await prisma.menuItem.create({ data: {
        categoryId: data.categoryId, name: data.name, description: data.description || "",
        price: data.price, image: data.image || null, isPopular: data.isPopular || false, sortOrder: data.sortOrder || 0,
      }});
      return NextResponse.json(item);
    }

    if (action === "update-item") {
      const d: any = {};
      if (data.name !== undefined) d.name = data.name;
      if (data.description !== undefined) d.description = data.description;
      if (data.price !== undefined) d.price = data.price;
      if (data.image !== undefined) d.image = data.image;
      if (data.isPopular !== undefined) d.isPopular = data.isPopular;
      if (data.isActive !== undefined) d.isActive = data.isActive;
      if (data.categoryId !== undefined) d.categoryId = data.categoryId;
      if (data.sortOrder !== undefined) d.sortOrder = data.sortOrder;
      const item = await prisma.menuItem.update({ where: { id: data.id }, data: d });
      return NextResponse.json(item);
    }

    if (action === "delete-item") {
      await prisma.menuItem.delete({ where: { id: data.id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle-item") {
      const item = await prisma.menuItem.findUnique({ where: { id: data.id } });
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.menuItem.update({ where: { id: data.id }, data: { isActive: !item.isActive } });
      return NextResponse.json({ ok: true });
    }

    if (action === "create-category") {
      const cat = await prisma.category.create({ data: { name: data.name, icon: data.icon || "utensils", sortOrder: data.sortOrder || 0 } });
      return NextResponse.json(cat);
    }

    if (action === "update-category") {
      const cat = await prisma.category.update({ where: { id: data.id }, data: { name: data.name, icon: data.icon } });
      return NextResponse.json(cat);
    }

    if (action === "delete-category") {
      const cnt = await prisma.menuItem.count({ where: { categoryId: data.id } });
      if (cnt > 0) return NextResponse.json({ error: `มีเมนู ${cnt} รายการในหมวดนี้` }, { status: 400 });
      await prisma.category.delete({ where: { id: data.id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
