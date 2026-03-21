// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { not: "cancelled" } },
      select: { custName: true, custPhone: true, custAddress: true, total: true, createdAt: true, status: true, orderNo: true },
      orderBy: { createdAt: "desc" },
    });

    const custMap: Record<string, { name: string; phone: string; address: string; orderCount: number; totalSpent: number; lastOrder: string; firstOrder: string; orders: { orderNo: string; total: number; date: string; status: string }[] }> = {};
    orders.forEach(o => {
      const key = (o as any).custPhone || "unknown";
      if (!custMap[key]) custMap[key] = { name: (o as any).custName || "-", phone: key, address: (o as any).custAddress || "-", orderCount: 0, totalSpent: 0, lastOrder: "", firstOrder: "", orders: [] };
      custMap[key].orderCount++;
      custMap[key].totalSpent += Number(o.total);
      const d = new Date(o.createdAt).toLocaleString("th-TH");
      if (!custMap[key].lastOrder) custMap[key].lastOrder = d;
      custMap[key].firstOrder = d;
      custMap[key].orders.push({ orderNo: o.orderNo, total: Number(o.total), date: d, status: o.status });
    });

    const customers = Object.values(custMap).sort((a, b) => b.totalSpent - a.totalSpent);
    return NextResponse.json({
      customers,
      summary: { total: customers.length, returning: customers.filter(c => c.orderCount > 1).length, avgSpend: customers.length > 0 ? customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length : 0 },
    });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
