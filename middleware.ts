import { NextRequest, NextResponse } from "next/server";

const ADMIN_PROTECTED = [
  "/api/admin/orders",
  "/api/admin/menu",
  "/api/admin/settings",
  "/api/admin/stats",
  "/api/admin/reports",
  "/api/admin/customers",
  "/api/admin/coupons",
  "/api/admin/riders",
  "/api/admin/upload",
  "/api/admin/richmenu",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin API Protection ──
  if (ADMIN_PROTECTED.some(p => pathname.startsWith(p))) {
    // Allow GET /api/admin/settings without auth (public settings for ordering page)
    if (pathname === "/api/admin/settings" && req.method === "GET") {
      return NextResponse.next();
    }

    // Check token: cookie → Authorization header → query
    const token =
      req.cookies.get("tp_admin_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Forward token to API route
    const headers = new Headers(req.headers);
    headers.set("x-admin-token", token);
    return NextResponse.next({ request: { headers } });
  }

  // ── Rate limit metadata for orders ──
  if (pathname === "/api/orders" && req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const headers = new Headers(req.headers);
    headers.set("x-client-ip", ip);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

// ONLY match API routes - do NOT match page routes
export const config = {
  matcher: ["/api/:path*"],
};
