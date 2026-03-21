// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLineNotify } from "@/lib/line-notify";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Sanitize string input
function sanitize(str: any, maxLen: number = 500): string | null {
  if (!str) return null;
  return String(str).replace(/<[^>]*>/g, "").trim().substring(0, maxLen) || null;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 5 orders per minute per IP
    const ip = req.headers.get("x-client-ip") || req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`order:${ip}`, 5, 60000)) {
      return NextResponse.json({ error: "คุณสั่งบ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
    }

    const body = await req.json();
    const { custName, custPhone, custAddress, custLat, custLng, note, items, couponCode, discount, deliveryFee, customerToken } = body;

    // Resolve customer from JWT token if provided
    let customerId: number | null = null;
    if (customerToken) {
      try {
        const { verifyToken } = await import("@/lib/auth");
        const payload = verifyToken(customerToken) as any;
        if (payload?.id && payload?.type === "customer") customerId = payload.id;
      } catch {}
    }

    // Validate required fields
    if (!custPhone || !items?.length) {
      return NextResponse.json({ error: "กรุณากรอกเบอร์โทรและเลือกเมนู" }, { status: 400 });
    }

    const subtotal = items.reduce((s: number, i: any) => s + i.price * i.qty, 0);
    const finalDiscount = Math.max(0, Number(discount) || 0);
    const finalDeliveryFee = Math.max(0, Number(deliveryFee) || 0);

    // Validate items against actual menu prices (prevent price manipulation)
    const menuItemIds = items.map((i: any) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds }, isActive: true } });
    const menuMap = new Map(menuItems.map(m => [m.id, m]));

    let verifiedTotal = 0;
    const verifiedItems: { menuItemId: number; qty: number; price: number; selectedOptions?: any[] }[] = [];
    for (const item of items) {
      const menu = menuMap.get(item.menuItemId);
      if (!menu) continue;
      const qty = Math.max(1, Math.min(99, Math.round(Number(item.qty) || 1)));
      let itemPrice = Number(menu.price);

      // Verify option prices server-side
      let selectedOptions: { optionItemId: number; name: string; price: number }[] = [];
      if (item.options && Array.isArray(item.options) && item.options.length > 0) {
        const optionIds = item.options.map((o: any) => Number(o.optionItemId)).filter(Boolean);
        if (optionIds.length > 0) {
          const dbOptions = await prisma.optionItem.findMany({ where: { id: { in: optionIds }, isActive: true } });
          for (const dbOpt of dbOptions) {
            const optPrice = Number(dbOpt.price);
            itemPrice += optPrice;
            selectedOptions.push({ optionItemId: dbOpt.id, name: dbOpt.name, price: optPrice });
          }
        }
      }

      verifiedTotal += itemPrice * qty;
      verifiedItems.push({ menuItemId: menu.id, qty, price: itemPrice, selectedOptions });
    }

    if (verifiedItems.length === 0) {
      return NextResponse.json({ error: "ไม่มีเมนูที่ถูกต้อง" }, { status: 400 });
    }

    const total = Math.max(0, verifiedTotal + finalDeliveryFee - finalDiscount);

    const now = new Date();
    const orderNo = `TP${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Build create data
    const createData: any = {
      orderNo,
      customerId: customerId || null,
      custName: sanitize(custName, 100),
      custPhone: sanitize(custPhone, 20)!,
      custAddress: sanitize(custAddress, 1000),
      custLat: custLat ? Number(custLat) : null,
      custLng: custLng ? Number(custLng) : null,
      note: sanitize(note, 500),
      total,
      status: "pending",
      kitchenStatus: "waiting",
      items: {
        create: verifiedItems.map(i => ({
          menuItemId: i.menuItemId,
          qty: i.qty,
          price: i.price,
          ...(i.selectedOptions && i.selectedOptions.length > 0 ? {
            options: {
              create: i.selectedOptions.map(o => ({
                optionItemId: o.optionItemId,
                name: o.name,
                price: o.price,
              })),
            },
          } : {}),
        })),
      },
      timeline: {
        create: { status: "order_placed", label: "สั่งอาหารแล้ว" },
      },
    };

    const order = await prisma.order.create({
      data: createData,
      include: { items: { include: { menuItem: true } } },
    });

    // Update coupon usage if applied
    if (couponCode && finalDiscount > 0) {
      try {
        await prisma.coupon.updateMany({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      } catch {}
    }

    // Update customer stats + save address/phone for next time
    if (customerId) {
      try {
        const updateData: any = {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
          lastOrderAt: new Date(),
        };
        // Save phone/address if provided (so next order auto-fills)
        if (custPhone) updateData.phone = sanitize(custPhone, 20);
        if (custAddress) updateData.address = sanitize(custAddress, 1000);
        if (custLat) updateData.lat = Number(custLat);
        if (custLng) updateData.lng = Number(custLng);
        await prisma.customer.update({ where: { id: customerId }, data: updateData });
      } catch {}
    }

    // LINE Notify
    const itemLines = order.items.map(i => `  • ${i.menuItem.name} x${i.qty} = ฿${Number(i.price) * i.qty}`).join("\n");
    let msg = `\n🔔 ออเดอร์ใหม่! #${orderNo}\n👤 ${custName || "-"}\n📞 ${custPhone}\n📍 ${custAddress || "-"}\n📝 ${note || "-"}\n\n${itemLines}\n`;
    if (finalDeliveryFee > 0) msg += `\n🛵 ค่าส่ง ฿${finalDeliveryFee}`;
    if (finalDiscount > 0) msg += `\n🎫 ส่วนลด -฿${finalDiscount}${couponCode ? ` (${couponCode})` : ""}`;
    msg += `\n\n💰 รวม ฿${total}`;
    await sendLineNotify(msg);

    return NextResponse.json({ orderNo, total });
  } catch (e: any) {
    console.error("Order create error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
