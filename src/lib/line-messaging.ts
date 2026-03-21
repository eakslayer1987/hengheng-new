// @ts-nocheck
export const dynamic = "force-dynamic";
/**
 * LINE Messaging API Helper
 * ส่ง Push Message ถึงลูกค้าโดยตรงผ่าน lineUserId
 */

import { prisma } from "./prisma";

// Get Channel Access Token from DB settings
async function getAccessToken(): Promise<string | null> {
  const setting = await prisma.systemConfig.findUnique({ where: { key: "line_channel_access_token" } });
  return setting?.value || null;
}

// ─── Push Text Message ───
export async function pushTextMessage(lineUserId: string, text: string) {
  const token = await getAccessToken();
  if (!token) { console.log("[LINE MSG] No access token:", text); return; }
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text }] }),
    });
    if (!res.ok) console.error("[LINE MSG] Push failed:", await res.text());
  } catch (e) { console.error("[LINE MSG] Error:", e); }
}

// ─── Push Flex Message (สวยกว่า) ───
export async function pushFlexMessage(lineUserId: string, altText: string, contents: any) {
  const token = await getAccessToken();
  if (!token) { console.log("[LINE MSG] No access token:", altText); return; }
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "flex", altText, contents }],
      }),
    });
    if (!res.ok) console.error("[LINE MSG] Flex failed:", await res.text());
  } catch (e) { console.error("[LINE MSG] Error:", e); }
}

// ─── Order Status Flex Message ───
export async function sendOrderStatusToCustomer(
  lineUserId: string,
  orderNo: string,
  status: string,
  items: { name: string; qty: number }[],
  total: number,
  riderName?: string
) {
  const statusConfig: Record<string, { emoji: string; label: string; color: string }> = {
    confirmed: { emoji: "✅", label: "ร้านรับออเดอร์แล้ว", color: "#06C755" },
    cooking: { emoji: "🍳", label: "กำลังทำอาหาร", color: "#FF8C00" },
    ready: { emoji: "📦", label: "อาหารพร้อมแล้ว", color: "#1E90FF" },
    delivering: { emoji: "🏍️", label: "กำลังจัดส่ง", color: "#9B59B6" },
    delivered: { emoji: "🎉", label: "ส่งถึงแล้ว!", color: "#06C755" },
    cancelled: { emoji: "❌", label: "ออเดอร์ถูกยกเลิก", color: "#E74C3C" },
  };

  const cfg = statusConfig[status];
  if (!cfg) return;

  const itemsText = items.map(i => `${i.name} x${i.qty}`).join("\n");

  // Build Flex Message
  const flexContents = {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: cfg.color,
      paddingAll: "16px",
      contents: [
        { type: "text", text: `${cfg.emoji} ${cfg.label}`, color: "#ffffff", weight: "bold", size: "lg" },
        { type: "text", text: `ออเดอร์ #${orderNo}`, color: "#ffffffcc", size: "xs", margin: "sm" },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      spacing: "md",
      contents: [
        {
          type: "box", layout: "vertical", spacing: "sm",
          contents: items.map(i => ({
            type: "box", layout: "horizontal",
            contents: [
              { type: "text", text: i.name, size: "sm", color: "#333333", flex: 4 },
              { type: "text", text: `x${i.qty}`, size: "sm", color: "#888888", flex: 1, align: "end" },
            ],
          })),
        },
        { type: "separator", color: "#eeeeee" },
        {
          type: "box", layout: "horizontal",
          contents: [
            { type: "text", text: "รวม", size: "md", weight: "bold", color: "#333333" },
            { type: "text", text: `฿${total.toLocaleString()}`, size: "md", weight: "bold", color: cfg.color, align: "end" },
          ],
        },
        ...(riderName && status === "delivering" ? [{
          type: "box" as const, layout: "horizontal" as const, margin: "md" as const,
          contents: [
            { type: "text" as const, text: `🏍️ คนขับ: ${riderName}`, size: "sm" as const, color: "#666666" },
          ],
        }] : []),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "12px",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "📍 ติดตามออเดอร์", uri: `https://xn--72czcz2c3de.com/track?no=${orderNo}` },
          style: "primary",
          color: cfg.color,
          height: "sm",
        },
      ],
    },
  };

  await pushFlexMessage(lineUserId, `${cfg.emoji} ${cfg.label} - #${orderNo}`, flexContents);
}

// ─── Welcome Message (หลัง Login ครั้งแรก) ───
export async function sendWelcomeMessage(lineUserId: string, name: string) {
  const flex = {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "box", layout: "vertical", backgroundColor: "#06C755", paddingAll: "24px",
      justifyContent: "center", alignItems: "center",
      contents: [
        { type: "text", text: "🍽️ ตลาดปัง", size: "xl", weight: "bold", color: "#ffffff" },
        { type: "text", text: "สั่งง่าย ส่งไว", size: "sm", color: "#ffffffcc", margin: "sm" },
      ],
    },
    body: {
      type: "box", layout: "vertical", paddingAll: "20px", spacing: "md",
      contents: [
        { type: "text", text: `สวัสดี ${name}! 👋`, size: "lg", weight: "bold", color: "#333333" },
        { type: "text", text: "ยินดีต้อนรับสู่ตลาดปัง\nสั่งอาหารออนไลน์ ส่งตรงถึงบ้าน", size: "sm", color: "#666666", wrap: true },
      ],
    },
    footer: {
      type: "box", layout: "vertical", paddingAll: "12px", spacing: "sm",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "🛒 สั่งอาหารเลย!", uri: "https://xn--72czcz2c3de.com/" },
          style: "primary", color: "#06C755", height: "sm",
        },
      ],
    },
  };
  await pushFlexMessage(lineUserId, `สวัสดี ${name}! ยินดีต้อนรับสู่ตลาดปัง`, flex);
}

// ─── Rich Menu Setup Helper ───
export async function createRichMenu() {
  const token = await getAccessToken();
  if (!token) return { error: "No access token" };

  const richMenu = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: "ตลาดปัง Main Menu",
    chatBarText: "📋 เมนู",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: "uri", uri: "https://xn--72czcz2c3de.com/" },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "uri", uri: "https://xn--72czcz2c3de.com/track" },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "message", text: "โปรโมชั่น" },
      },
    ],
  };

  try {
    // Step 1: Create rich menu
    const res = await fetch("https://api.line.me/v2/bot/richmenu", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(richMenu),
    });
    const data = await res.json();
    return data;
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─── Upload Rich Menu Image + Set Default ───
export async function uploadRichMenuImage(richMenuId: string, imageBuffer: Buffer) {
  const token = await getAccessToken();
  if (!token) return { error: "No access token" };

  try {
    // Upload image
    const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: "POST",
      headers: { "Content-Type": "image/png", Authorization: `Bearer ${token}` },
      body: imageBuffer,
    });

    if (!uploadRes.ok) return { error: "Upload failed" };

    // Set as default
    const defaultRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    return { ok: true, richMenuId };
  } catch (e: any) {
    return { error: e.message };
  }
}
