/**
 * /api/auth/line-callback/route.ts
 * LINE OAuth 2.0 callback — แลก code → token → profile → session cookie
 * 
 * FIX: ใช้ NextResponse.redirect ด้วย req.nextUrl แทน NEXT_PUBLIC_APP_URL
 *      เพื่อหลีกเลี่ยง Vercel Security Checkpoint ที่เกิดจาก cross-origin redirect
 */

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const {
  LINE_CHANNEL_ID,
  LINE_CHANNEL_SECRET,
  LINE_CALLBACK_URL,
  JWT_SECRET,
} = process.env

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  // User denied or LINE error
  if (error || !code) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = `?error=${error || 'no_code'}`
    return NextResponse.redirect(url)
  }

  try {
    // 1. Exchange code → access_token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  LINE_CALLBACK_URL!,
        client_id:     LINE_CHANNEL_ID!,
        client_secret: LINE_CHANNEL_SECRET!,
      }),
    })
    const tokenData = await tokenRes.json()
    
    if (!tokenData.access_token) {
      console.error('[LINE token error]', tokenData)
      throw new Error(`No access token: ${tokenData.error_description || 'unknown'}`)
    }

    // 2. Get profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json()

    if (!profile.userId) {
      throw new Error('No profile userId')
    }

    // 3. Create JWT session
    const secret = new TextEncoder().encode(JWT_SECRET!)
    const token = await new SignJWT({
      lineId:      profile.userId,
      displayName: profile.displayName,
      pictureUrl:  profile.pictureUrl || null,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    // 4. Redirect to /home using same-origin URL (avoids Vercel Security Checkpoint)
    const homeUrl = req.nextUrl.clone()
    homeUrl.pathname = '/home'
    homeUrl.search = ''

    const response = NextResponse.redirect(homeUrl)
    response.cookies.set('session', token, {
      httpOnly: true,
      secure:   true,
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     '/',
    })

    return response
  } catch (err) {
    console.error('[LINE callback error]', err)
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = '?error=auth_failed'
    return NextResponse.redirect(url)
  }
}
