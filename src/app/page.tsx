'use client'
/**
 * /app/page.tsx — Login Page (หน้าแรก)
 * Design: Red Gold Chinese Lucky Draw
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router  = useRouter()
  const lineId  = useUserStore(s => s.lineId)
  const setUser = useUserStore(s => s.setUser)

  // Check if already logged in (via JWT cookie)
  useEffect(() => {
    if (lineId) {
      router.replace('/home')
      return
    }
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser({
            lineId: d.user.lineId,
            lineDisplayName: d.user.lineDisplayName,
            lineAvatarUrl: d.user.lineAvatarUrl,
          })
          router.replace('/home')
        }
      })
      .catch(() => {})
  }, [lineId, setUser, router])

  const handleLineLogin = () => {
    window.location.href = '/api/auth/line'
  }

  return (
    <main className="relative flex flex-col items-center justify-center min-h-dvh overflow-hidden
                     bg-gradient-to-b from-[#7A0018] via-[#5A000E] to-[#3D0008] px-5 damask-bg">

      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="w-[340px] h-[340px] rounded-full mt-[-60px]
                        bg-[radial-gradient(circle,rgba(201,150,58,.2)_0%,transparent_70%)]
                        animate-glowPulse" />
      </div>

      {/* Floating coins */}
      {['🪙','🥇','💰','✨','🪙'].map((c, i) => (
        <span key={i} className="pointer-events-none absolute text-xl float-coin"
              style={{
                left: `${10 + i * 18}%`,
                top:  `${8 + (i % 3) * 15}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${2.8 + i * 0.3}s`,
              }}>
          {c}
        </span>
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: .95 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: .5, ease: [.16,1,.3,1] }}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden
                   bg-gradient-to-b from-[#830014] to-[#560010]
                   border border-[rgba(201,150,58,.3)]
                   shadow-[0_20px_60px_rgba(0,0,0,.5),0_0_40px_rgba(255,100,0,.1)]"
      >
        {/* Top shine */}
        <div className="absolute top-0 left-0 right-0 h-px
                        bg-gradient-to-r from-transparent via-[rgba(247,211,122,.5)] to-transparent" />

        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center">
          {/* Piggy icon */}
          <div className="text-7xl mb-3 animate-glowPulse inline-block
                          drop-shadow-[0_0_20px_rgba(201,150,58,.6)]">
            🐷
          </div>

          <h1 className="text-3xl font-black text-gold-gradient leading-tight">
            เฮงเฮง ปังจัง
          </h1>
          <p className="text-sm text-[rgba(251,240,200,.65)] mt-1">
            ลุ้นรวย แบบดับเบิ้ล
          </p>

          {/* Prize badge */}
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full
                          bg-gradient-to-r from-[#F7D37A] to-[#C9963A]
                          text-[#3a1a00] text-xs font-extrabold
                          shadow-[0_4px_14px_rgba(201,150,58,.4)]">
            🏆 รวมมูลค่า 2,400,000 บาท
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-6 bg-gradient-to-r from-transparent via-[rgba(201,150,58,.3)] to-transparent" />

        {/* Bottom */}
        <div className="px-6 py-6 space-y-4">
          <p className="text-center text-sm text-[rgba(251,240,200,.65)] leading-relaxed">
            เข้าสู่ระบบเพื่อสะสมฉลาก<br />และลุ้นรับรางวัลสุดพิเศษ
          </p>

          {/* Privacy note */}
          <div className="flex gap-3 items-start bg-black/20 border border-[rgba(201,150,58,.12)]
                          rounded-xl p-3">
            <span className="text-lg flex-shrink-0 mt-0.5">🔒</span>
            <span className="text-xs text-[rgba(251,240,200,.55)] leading-relaxed">
              ระบบใช้เฉพาะชื่อและรูปโปรไฟล์จาก LINE
              ไม่มีการโพสต์หรือส่งข้อความหาเพื่อน
            </span>
          </div>

          {/* LINE Login button */}
          <button
            onClick={handleLineLogin}
            className="relative w-full py-4 rounded-2xl overflow-hidden
                       bg-[#06C755] text-white font-extrabold text-lg
                       shadow-[0_6px_24px_rgba(6,199,85,.4)]
                       active:scale-[.97] transition-transform
                       flex items-center justify-center gap-3 btn-shimmer"
          >
            {/* LINE logo */}
            <svg width="28" height="28" viewBox="0 0 40 40" className="flex-shrink-0">
              <rect width="40" height="40" rx="8" fill="white" fillOpacity=".15"/>
              <path d="M20 4C11.16 4 4 10.27 4 18.03c0 7.27 6.45 13.35 15.16 14.49.59.12 1.39.38 1.59.89.18.45.12 1.17.06 1.64l-.26 1.58c-.08.45-.36 1.78 1.57.97 1.93-.82 10.42-6.14 14.22-10.51C38.56 24.19 36 21.22 36 18.03 36 10.27 28.84 4 20 4z" fill="white"/>
              <path d="M16.5 22.5h-3.3a.72.72 0 0 1-.72-.72v-7.26a.72.72 0 0 1 1.44 0v6.54h2.58a.72.72 0 0 1 0 1.44zm2.4-.72a.72.72 0 0 1-1.44 0v-7.26a.72.72 0 0 1 1.44 0v7.26zm7.26 0a.72.72 0 0 1-.7.72h-.02a.72.72 0 0 1-.6-.31L21.72 18v3.78a.72.72 0 0 1-1.44 0v-7.26a.72.72 0 0 1 .7-.72h.02a.72.72 0 0 1 .6.31l3.12 4.62v-4.21a.72.72 0 0 1 1.44 0v7.26zm4.68.72h-3.3a.72.72 0 0 1-.72-.72v-7.26a.72.72 0 0 1 .72-.72h3.3a.72.72 0 0 1 0 1.44H28.26v2.16h2.52a.72.72 0 0 1 0 1.44h-2.52v2.22h3.3a.72.72 0 0 1-.72 1.44z" fill="#06C755"/>
            </svg>
            เข้าสู่ระบบด้วย LINE
          </button>

          <p className="text-center text-[10px] text-[rgba(251,240,200,.3)] leading-relaxed">
            การเข้าสู่ระบบถือว่าคุณยอมรับ{' '}
            <a href="#" className="text-[rgba(247,211,122,.45)]">นโยบายความเป็นส่วนตัว</a>
            {' '}และ{' '}
            <a href="#" className="text-[rgba(247,211,122,.45)]">เงื่อนไขการใช้งาน</a>
          </p>
        </div>
      </motion.div>
    </main>
  )
}
