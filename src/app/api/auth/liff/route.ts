// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "taladpang-secret-2026";

// POST: Exchange LIFF access token for customer session
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 400 });
    }

    // Verify token + get profile from LINE
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const profile = await profileRes.json();

    if (!profile.userId) {
      return NextResponse.json({ error: "Cannot get LINE profile" }, { status: 401 });
    }

    // Create or update customer
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

    // Generate JWT
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
    console.error("LIFF Login error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
