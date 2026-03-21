// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushTextMessage, pushFlexMessage } from "@/lib/line-messaging";

export const dynamic = "force-dynamic";

// LINE Webhook — รับ event จาก LINE OA
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const userId = event.source.userId;
        const text = event.message.text.trim();
        const replyToken = event.replyToken;

        // Handle keywords
        if (text === "เมนู" || text === "สั่งอาหาร" || text === "menu") {
          await replyMessage(replyToken, {
            type: "flex", altText: "🍽️ สั่งอาหารตลาดปัง",
            contents: {
              type: "bubble", size: "kilo",
              body: {
                type: "box", layout: "vertical", paddingAll: "20px", spacing: "md",
                contents: [
                  { type: "text", text: "🍽️ ตลาดปัง", weight: "bold", size: "xl", color: "#06C755" },
                  { type: "text", text: "กดปุ่มด้านล่างเพื่อสั่งอาหาร", size: "sm", color: "#888888", margin: "md" },
                ],
              },
              footer: {
                type: "box", layout: "vertical", paddingAll: "12px",
                contents: [{
                  type: "button", style: "primary", color: "#06C755", height: "sm",
                  action: { type: "uri", label: "🛒 สั่งอาหารเลย!", uri: "https://xn--72czcz2c3de.com/" },
                }],
              },
            },
          });
        } else if (text.startsWith("เช็ค") || text.startsWith("ติดตาม") || text.match(/^TP\d/i)) {
          // Extract order number
          const orderNo = text.replace(/^(เช็ค|ติดตาม|สถานะ)\s*/g, "").trim().toUpperCase();
          if (orderNo) {
            const order = await prisma.order.findUnique({
              where: { orderNo },
              include: { items: { include: { menuItem: true } } },
            });
            if (order) {
              const statusMap: Record<string, string> = {
                pending: "⏳ รอรับออเดอร์", cooking: "🍳 กำลังทำอาหาร",
                ready: "📦 พร้อมส่ง", delivering: "🏍️ กำลังจัดส่ง",
                delivered: "✅ ส่งถึงแล้ว", cancelled: "❌ ยกเลิก",
              };
              await replyText(replyToken, `📋 ออเดอร์ #${orderNo}\n${statusMap[order.status] || order.status}\n💰 ฿${Number(order.total).toLocaleString()}\n\n📍 ติดตามที่: https://xn--72czcz2c3de.com/track?no=${orderNo}`);
            } else {
              await replyText(replyToken, `❌ ไม่พบออเดอร์ ${orderNo}`);
            }
          }
        } else if (text === "โปรโมชั่น" || text === "คูปอง" || text === "promo") {
          const coupons = await prisma.coupon.findMany({
            where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
            take: 5,
          });
          if (coupons.length > 0) {
            const list = coupons.map(c => `🎫 ${c.code} — ${c.type === "percent" ? `ลด ${c.value}%` : c.type === "free_delivery" ? "ส่งฟรี" : `ลด ฿${c.value}`}`).join("\n");
            await replyText(replyToken, `🎉 โปรโมชั่นตอนนี้:\n\n${list}\n\n🛒 สั่งอาหาร: https://xn--72czcz2c3de.com/`);
          } else {
            await replyText(replyToken, "😢 ตอนนี้ยังไม่มีโปรโมชั่น\nแต่สั่งอาหารได้เลยที่ https://xn--72czcz2c3de.com/");
          }
        } else if (text === "ประวัติ" || text === "ออเดอร์ของฉัน") {
          const customer = await prisma.customer.findUnique({ where: { lineUserId: userId } });
          if (customer) {
            const orders = await prisma.order.findMany({
              where: { customerId: customer.id },
              orderBy: { createdAt: "desc" },
              take: 5,
            });
            if (orders.length > 0) {
              const list = orders.map(o => `📋 #${o.orderNo} — ฿${Number(o.total).toLocaleString()} (${o.status})`).join("\n");
              await replyText(replyToken, `📦 ออเดอร์ล่าสุดของคุณ:\n\n${list}`);
            } else {
              await replyText(replyToken, "📦 ยังไม่มีออเดอร์ สั่งอาหารได้เลย!\nhttps://xn--72czcz2c3de.com/");
            }
          } else {
            await replyText(replyToken, "กรุณาล็อกอินผ่านเว็บก่อนนะคะ\nhttps://xn--72czcz2c3de.com/");
          }
        } else {
          // Default reply
          await replyText(replyToken, `สวัสดีค่ะ! 🍽️ ตลาดปัง\n\nพิมพ์คำสั่ง:\n• "เมนู" — สั่งอาหาร\n• "เช็ค TP0304-0001" — เช็คสถานะ\n• "โปรโมชั่น" — ดูคูปอง\n• "ประวัติ" — ออเดอร์ของฉัน`);
        }
      }

      // Follow event — ส่งข้อความต้อนรับเมื่อ add friend
      if (event.type === "follow") {
        const userId = event.source.userId;
        await replyMessage(event.replyToken, {
          type: "flex", altText: "ยินดีต้อนรับสู่ตลาดปัง! 🍽️",
          contents: {
            type: "bubble", size: "kilo",
            header: {
              type: "box", layout: "vertical", backgroundColor: "#06C755", paddingAll: "20px",
              contents: [
                { type: "text", text: "🍽️ ตลาดปัง", size: "xl", weight: "bold", color: "#ffffff", align: "center" },
                { type: "text", text: "สั่งง่าย ส่งไว 🚀", size: "sm", color: "#ffffffcc", align: "center", margin: "sm" },
              ],
            },
            body: {
              type: "box", layout: "vertical", paddingAll: "20px", spacing: "md",
              contents: [
                { type: "text", text: "ยินดีต้อนรับ! 👋", size: "lg", weight: "bold", color: "#333333" },
                { type: "text", text: "สั่งอาหารออนไลน์ ส่งตรงถึงบ้าน\nกดปุ่มด้านล่างเลย!", size: "sm", color: "#666666", wrap: true },
              ],
            },
            footer: {
              type: "box", layout: "vertical", paddingAll: "12px", spacing: "sm",
              contents: [
                { type: "button", style: "primary", color: "#06C755", height: "sm",
                  action: { type: "uri", label: "🛒 สั่งอาหาร", uri: "https://xn--72czcz2c3de.com/" } },
                { type: "button", style: "secondary", height: "sm",
                  action: { type: "message", label: "📋 ดูเมนูทั้งหมด", text: "เมนู" } },
              ],
            },
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[Webhook]", e);
    return NextResponse.json({ ok: true }); // Always return 200 for LINE
  }
}

// Reply helpers
async function getReplyToken() {
  const setting = await prisma.systemConfig.findUnique({ where: { key: "line_channel_access_token" } });
  return setting?.value || null;
}

async function replyText(replyToken: string, text: string) {
  const token = await getReplyToken();
  if (!token) return;
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
  });
}

async function replyMessage(replyToken: string, message: any) {
  const token = await getReplyToken();
  if (!token) return;
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [message] }),
  });
}
