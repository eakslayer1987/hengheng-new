// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "taladpang-secret-2026";

// POST: Exchange LINE auth code for user profile + create/update customer
export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri } = await req.json();

    // Get LINE channel credentials from settings
    const channelId = await prisma.systemConfig.findUnique({ where: { key: "line_channel_id" } });
    const channelSecret = await prisma.systemConfig.findUnique({ where: { key: "line_channel_secret" } });

    if (!channelId?.value || !channelSecret?.value) {
      return NextResponse.json({ error: "LINE Login ยังไม่ได้ตั้งค่า" }, { status: 400 });
    }

    // Step 1: Exchange code for access token
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: channelId.value,
        client_secret: channelSecret.value,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "LINE authentication failed" }, { status: 401 });
    }

    // Step 2: Get user profile
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.userId) {
      return NextResponse.json({ error: "Cannot get LINE profile" }, { status: 401 });
    }

    // Step 3: Create or update customer
    let customer = await prisma.customer.findUnique({ where: { lineUserId: profile.userId } });

    if (customer) {
      customer = await prisma.customer.update({
        where: { lineUserId: profile.userId },
        data: {
          name: profile.displayName || customer.name,
          avatar: profile.pictureUrl || customer.avatar,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          lineUserId: profile.userId,
          name: profile.displayName || null,
          avatar: profile.pictureUrl || null,
        },
      });
    }

    // Step 4: Generate JWT for customer session
    const customerToken = jwt.sign(
      { id: customer.id, lineUserId: customer.lineUserId, name: customer.name, type: "customer" },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token: customerToken,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        avatar: customer.avatar,
        address: customer.address,
        totalOrders: customer.totalOrders,
      },
    });
  } catch (e: any) {
    console.error("LINE Login error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: Return LINE Login URL
export async function GET() {
  try {
    const channelId = await prisma.systemConfig.findUnique({ where: { key: "line_channel_id" } });
    if (!channelId?.value) {
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({
      enabled: true,
      channelId: channelId.value,
    });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
