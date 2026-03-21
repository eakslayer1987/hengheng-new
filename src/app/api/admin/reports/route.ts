// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "week"; // today, week, month, custom
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    
    const now = new Date();
    let dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let dateTo = new Date(dateFrom); dateTo.setDate(dateTo.getDate() + 1);
    
    if (range === "week") { dateFrom.setDate(dateFrom.getDate() - 7); }
    else if (range === "month") { dateFrom.setDate(dateFrom.getDate() - 30); }
    else if (range === "3month") { dateFrom.setDate(dateFrom.getDate() - 90); }
    else if (range === "custom" && from && to) { dateFrom = new Date(from); dateTo = new Date(to); dateTo.setDate(dateTo.getDate() + 1); }

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: dateFrom, lt: dateTo }, status: { not: "cancelled" } },
      include: { items: { include: { menuItem: true } }, rider: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalDiscount = orders.reduce((s, o) => s + Number((o as any).discount || 0), 0);
    const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
    const deliveredCount = orders.filter(o => o.status === "delivered").length;

    // Daily breakdown
    const dailyMap: Record<string, { date: string; orders: number; revenue: number; delivered: number }> = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
      if (!dailyMap[d]) dailyMap[d] = { date: d, orders: 0, revenue: 0, delivered: 0 };
      dailyMap[d].orders++;
      dailyMap[d].revenue += Number(o.total);
      if (o.status === "delivered") dailyMap[d].delivered++;
    });
    const dailyData = Object.values(dailyMap).reverse();

    // Hourly distribution
    const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0, revenue: 0 }));
    orders.forEach(o => { const h = new Date(o.createdAt).getHours(); hourly[h].orders++; hourly[h].revenue += Number(o.total); });

    // Top menu items
    const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    orders.forEach(o => o.items.forEach((i: any) => {
      const n = i.menuItem.name;
      if (!itemMap[n]) itemMap[n] = { name: n, qty: 0, revenue: 0 };
      itemMap[n].qty += i.qty;
      itemMap[n].revenue += Number(i.price) * i.qty;
    }));
    const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Payment/status breakdown
    const statusBreakdown = { pending: 0, cooking: 0, ready: 0, delivering: 0, delivered: 0 };
    orders.forEach(o => { if ((statusBreakdown as any)[o.status] !== undefined) (statusBreakdown as any)[o.status]++; });

    // Rider stats
    const riderMap: Record<number, { name: string; delivered: number; revenue: number; trips: any[] }> = {};
    orders.filter(o => o.rider && o.status === "delivered").forEach(o => {
      const r = o.rider!;
      if (!riderMap[r.id]) riderMap[r.id] = { name: r.name, delivered: 0, revenue: 0, trips: [] };
      riderMap[r.id].delivered++;
      riderMap[r.id].revenue += Number(o.total);
    });
    const riderStats = Object.values(riderMap).sort((a, b) => b.delivered - a.delivered);

    // Export data (flat)
    const exportData = orders.map(o => ({
      orderNo: o.orderNo, date: new Date(o.createdAt).toLocaleString("th-TH"),
      customer: (o as any).custName || "-", phone: (o as any).custPhone || "-",
      items: o.items.map((i: any) => `${i.menuItem.name}x${i.qty}`).join(", "),
      total: Number(o.total), discount: Number((o as any).discount || 0), status: o.status,
      rider: o.rider?.name || "-",
    }));

    return NextResponse.json({
      summary: { totalOrders: orders.length, totalRevenue, totalDiscount, avgOrder, deliveredCount },
      dailyData, hourly, topItems, statusBreakdown, riderStats, exportData,
    });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
