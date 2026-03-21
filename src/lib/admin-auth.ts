// @ts-nocheck
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

/**
 * Verify admin JWT token from middleware-injected header.
 * Returns user payload or null.
 */
export function getAdminUser(req: NextRequest): { id: number; username: string; role: string } | null {
  const token =
    req.headers.get("x-admin-token") ||
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    null;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || typeof payload !== "object") return null;

  return payload as { id: number; username: string; role: string };
}

/**
 * Return 401 response if not authenticated.
 * Usage in API routes:
 *   const user = requireAdmin(req);
 *   if (user instanceof NextResponse) return user;
 */
export function requireAdmin(req: NextRequest) {
  const user = getAdminUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized - กรุณาเข้าสู่ระบบ" }, { status: 401 });
  return user;
}
