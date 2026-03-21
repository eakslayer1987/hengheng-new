// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Try to load options separately (safe if tables don't exist yet)
    try {
      const groups = await prisma.optionGroup.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { items: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      });
      const groupMap = new Map<number, any[]>();
      for (const g of groups) {
        if (!groupMap.has(g.menuItemId)) groupMap.set(g.menuItemId, []);
        groupMap.get(g.menuItemId)!.push(g);
      }
      for (const cat of categories) {
        for (const item of (cat as any).items) {
          (item as any).optionGroups = groupMap.get(item.id) || [];
        }
      }
    } catch {}

    return NextResponse.json(categories);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
