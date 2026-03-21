/**
 * /api/auth/line-callback/route.ts
 * LINE OAuth 2.0 callback — แลก code → token → profile → session
 */

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const {
  LINE_CHANNEL_ID,
  LINE_CHANNEL_SECRET,
  LINE_CALLBACK_URL,
  JWT_SECRET,
  NEXT_PUBLIC_APP_URL,
} = process.env

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/?error=no_code`)
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
    if (!tokenData.access_token) throw new Error('No access token')

    // 2. Get profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json()

    // 3. Create JWT session
    const secret = new TextEncoder().encode(JWT_SECRET!)
    const token = await new SignJWT({
      lineId:          profile.userId,
      displayName:     profile.displayName,
      pictureUrl:      profile.pictureUrl,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    // 4. Redirect to home with cookie
    const response = NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/home`)
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[LINE callback error]', err)
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/?error=auth_failed`)
  }
}
