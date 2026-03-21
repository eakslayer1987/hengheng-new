import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/', '/api/auth/line', '/api/auth/line-callback']
const PROTECTED    = ['/home', '/scan', '/rewards', '/map', '/me', '/merchant', '/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith('/api/auth'))) {
    return NextResponse.next()
  }

  // Check if route needs protection
  const needsAuth = PROTECTED.some(p => pathname.startsWith(p))
  if (!needsAuth) return NextResponse.next()

  const session = req.cookies.get('session')?.value

  if (!session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    await jwtVerify(session, secret)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/', req.url))
    res.cookies.delete('session')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
}
