/**
 * /api/auth/line/route.ts
 * GET → redirect ไป LINE OAuth
 */
import { NextResponse } from 'next/server'

export async function GET() {
  const state = Math.random().toString(36).slice(2, 12)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.LINE_CHANNEL_ID!,
    redirect_uri:  process.env.LINE_CALLBACK_URL!,
    state,
    scope:         'profile openid',
    bot_prompt:    'normal',
  })

  return NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params}`
  )
}
