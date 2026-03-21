export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secretPath = process.env.ADMIN_SECRET_PATH;

  // ── Admin API: inject token from cookie to header ──
  if (pathname.startsWith("/api/admin/")) {
    const token = req.cookies.get("pj_admin_token")?.value;
    const res = NextResponse.next();
    if (token) {
      const headers = new Headers(req.headers);
      headers.set("x-admin-token", token);
      return NextResponse.next({ request: { headers } });
    }
    return res;
  }

  // ── Secret path guard ──
  if (!secretPath) return NextResponse.next();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const referer = req.headers.get("referer") || "";
    const token = req.cookies.get("pj_admin_token")?.value;
    if (token || referer.includes(`/${secretPath}`)) return NextResponse.next();
    return new NextResponse("Not Found", { status: 404 });
  }

  if (pathname === `/${secretPath}`) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|icon|apple|manifest|uploads).*)"],
};
