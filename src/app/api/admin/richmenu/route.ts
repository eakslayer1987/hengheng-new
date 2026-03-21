// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function getToken() {
  const s = await prisma.systemConfig.findUnique({ where: { key: "line_channel_access_token" } });
  return s?.value || null;
}

// GET: List rich menus
export async function GET(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "No access token" }, { status: 400 });

  const res = await fetch("https://api.line.me/v2/bot/richmenu/list", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  // Get default
  const defRes = await fetch("https://api.line.me/v2/bot/user/all/richmenu", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const defData = defRes.ok ? await defRes.json() : {};

  return NextResponse.json({ richmenus: data.richmenus || [], defaultRichMenuId: defData.richMenuId || null });
}

// POST: Create + upload + set default rich menu
export async function POST(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "No access token" }, { status: 400 });

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const layoutType = formData.get("layout") as string || "3col";

    // Shop URL
    const shopUrl = "https://xn--72czcz2c3de.com";

    // Layout configs
    const layouts: Record<string, any> = {
      "3col": {
        size: { width: 2500, height: 843 },
        areas: [
          { bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: "uri", uri: `${shopUrl}/` } },
          { bounds: { x: 833, y: 0, width: 834, height: 843 }, action: { type: "uri", uri: `${shopUrl}/track` } },
          { bounds: { x: 1667, y: 0, width: 833, height: 843 }, action: { type: "message", text: "โปรโมชั่น" } },
        ],
      },
      "2x3": {
        size: { width: 2500, height: 1686 },
        areas: [
          { bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: "uri", uri: `${shopUrl}/` } },
          { bounds: { x: 833, y: 0, width: 834, height: 843 }, action: { type: "uri", uri: `${shopUrl}/track` } },
          { bounds: { x: 1667, y: 0, width: 833, height: 843 }, action: { type: "message", text: "โปรโมชั่น" } },
          { bounds: { x: 0, y: 843, width: 833, height: 843 }, action: { type: "message", text: "เมนู" } },
          { bounds: { x: 833, y: 843, width: 834, height: 843 }, action: { type: "message", text: "ประวัติ" } },
          { bounds: { x: 1667, y: 843, width: 833, height: 843 }, action: { type: "uri", uri: "https://lin.ee/xxxxxx" } },
        ],
      },
    };

    const layout = layouts[layoutType] || layouts["3col"];

    const richMenu = {
      ...layout,
      selected: true,
      name: "ตลาดปัง Menu",
      chatBarText: "📋 เมนู",
    };

    // Step 1: Create rich menu
    const createRes = await fetch("https://api.line.me/v2/bot/richmenu", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(richMenu),
    });
    const createData = await createRes.json();
    if (!createData.richMenuId) return NextResponse.json({ error: "Failed to create", detail: createData }, { status: 500 });

    // Step 2: Upload image
    if (image) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${createData.richMenuId}/content`, {
        method: "POST",
        headers: { "Content-Type": image.type || "image/png", Authorization: `Bearer ${token}` },
        body: buffer,
      });
      if (!uploadRes.ok) return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
    }

    // Step 3: Set as default
    await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${createData.richMenuId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    return NextResponse.json({ ok: true, richMenuId: createData.richMenuId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Remove rich menu
export async function DELETE(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof NextResponse) return user;
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "No access token" }, { status: 400 });

  const { richMenuId } = await req.json();
  await fetch(`https://api.line.me/v2/bot/richmenu/${richMenuId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return NextResponse.json({ ok: true });
}
