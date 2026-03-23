/**
 * /api/auth/me/route.ts
 * GET → อ่าน JWT cookie แล้ว return profile
 */
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('session')?.value

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(session, secret)

    return NextResponse.json({
      user: {
        lineId:          payload.lineId,
        lineDisplayName: payload.displayName,
        lineAvatarUrl:   payload.pictureUrl,
      },
    })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
