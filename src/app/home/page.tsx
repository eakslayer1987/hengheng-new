'use client'
/**
 * /app/home/page.tsx — Home Page
 * Design: Red Gold Chinese Lucky Draw — ตาม Poster หมีปรุง
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore, useAppStore } from '@/store'
import { useCampaign, useFeed, useMyCodes } from '@/lib/hooks'
import { fmt, formatThaiDate } from '@/lib/utils'
import BottomNav from '@/components/layout/BottomNav'
import BannerCarousel from '@/components/cards/BannerCarousel'

// Quick action items
const QUICK_ACTIONS = [
  { label: 'สแกน',    href: '/scan',    icon: QRIcon,     emoji: '📱' },
  { label: 'รางวัล',  href: '/rewards', icon: StarIcon,   emoji: '🏆' },
  { label: 'แผนที่',  href: '/map',     icon: MapIcon,    emoji: '📍' },
  { label: 'อัปโหลด', href: '/merchant/receipts', icon: UploadIcon, emoji: '📤' },
]

export default function HomePage() {
  const router   = useRouter()
  const lineId   = useUserStore(s => s.lineId)
  const name     = useUserStore(s => s.lineDisplayName)
  const avatar   = useUserStore(s => s.lineAvatarUrl)
  const phone    = useUserStore(s => s.phone)
  const todaySc  = useUserStore(s => s.todayScans)
  const setUser  = useUserStore(s => s.setUser)
  const setCamp  = useAppStore(s => s.setCampaign)

  const { data: campaign } = useCampaign()
  const { data: feed }     = useFeed(8)
  const { data: codesData }= useMyCodes(phone)

  // Hydrate store from JWT session
  useEffect(() => {
    if (!lineId) {
      fetch('/api/auth/me')
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setUser({
              lineId: d.user.lineId,
              lineDisplayName: d.user.lineDisplayName,
              lineAvatarUrl: d.user.lineAvatarUrl,
            })
          } else {
            router.replace('/')
          }
        })
        .catch(() => router.replace('/'))
    }
  }, [lineId, setUser, router])

  useEffect(() => { if (campaign) setCamp(campaign) }, [campaign, setCamp])

  const myCodesCount = codesData?.codes?.length ?? 0
  const remainToday = Math.max(0, 3 - todaySc)

  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto overflow-hidden
                    bg-gradient-to-b from-[#C41E3A] via-[#8B001A] to-[#3D0008]">

      {/* Chinese damask pattern overlay */}
      <div className="damask-bg absolute inset-0 pointer-events-none" />

      {/* Topbar */}
      <header className="relative flex items-center justify-between px-4 py-3 flex-shrink-0
                         bg-[rgba(61,0,8,.85)] border-b border-[rgba(201,150,58,.2)]
                         backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt="" className="w-9 h-9 rounded-full border-2 border-[rgba(201,150,58,.4)]
                                                 object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F7D37A] to-[#C9963A]
                           flex items-center justify-center text-base">🐻</div>
          )}
          <div>
            <p className="text-sm font-bold text-[#FBF0C8] leading-tight">
              {name ? `สวัสดี ${name}` : 'สวัสดี!'}
            </p>
            <p className="text-[10px] text-[rgba(251,240,200,.45)]">เฮงเฮง ปังจัง</p>
          </div>
        </div>
        <button className="w-9 h-9 rounded-xl border border-[rgba(201,150,58,.2)]
                           bg-black/20 flex items-center justify-center"
                onClick={() => router.push('/me')}>
          <BellIcon className="w-5 h-5 text-[#F7D37A]" />
        </button>
      </header>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto no-scrollbar pb-24">

        {/* Hero section — gold burst like poster */}
        <div className="relative overflow-hidden">
          {/* Gold radial glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2
                         w-[150%] h-[300px]
                         bg-[radial-gradient(ellipse_at_center,rgba(247,211,122,.2)_0%,transparent_60%)]
                         pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative px-5 pt-5 pb-4 text-center"
          >
            {/* Meeprung bear icon */}
            <div className="inline-block mb-2">
              <div className="w-16 h-16 mx-auto rounded-full
                             bg-gradient-to-br from-[#FBF0C8] via-[#F7D37A] to-[#C9963A]
                             flex items-center justify-center text-3xl
                             shadow-[0_8px_32px_rgba(201,150,58,.5),0_0_0_3px_rgba(201,150,58,.15)]
                             animate-glowPulse">
                🐻
              </div>
            </div>

            <h2 className="text-2xl font-black text-gold-gradient leading-tight">
              ลูกค้าเฮง ร้านค้าเฮ
            </h2>
            <p className="text-lg font-black text-gold-gradient">
              หมีปรุงเปย์!
            </p>

            {/* Prize banner */}
            {campaign && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mt-3 px-5 py-2 rounded-full
                           bg-gradient-to-r from-[#F7D37A] via-[#FFE88C] to-[#C9963A]
                           shadow-[0_4px_16px_rgba(201,150,58,.5)]"
              >
                <span className="text-base">🏆</span>
                <span className="text-xs font-black text-[#3a1a00]">
                  รวมมูลค่า {fmt(campaign.totalPrizeValue)} บาท
                </span>
                <span className="text-base">🏆</span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2.5 px-5 mb-4"
        >
          <StatPill icon="🎫" label="ฉลากของฉัน" value={myCodesCount} />
          <StatPill icon="📱" label="สแกนวันนี้" value={todaySc} color="green" />
          <StatPill icon="⏳" label="เหลือวันนี้" value={remainToday} />
        </motion.div>

        {/* Progress bar */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => router.push('/rewards')}
          className="mx-5 mb-4 w-[calc(100%-40px)] relative overflow-hidden
                     bg-gradient-to-r from-[rgba(139,105,20,.3)] to-[rgba(201,150,58,.1)]
                     border border-[rgba(201,150,58,.35)] rounded-2xl px-4 py-3"
        >
          <div className="flex items-center justify-between relative z-10">
            <span className="text-sm text-[#FBF0C8] font-semibold">
              สแกนแล้ว{' '}
              <span className="text-[#F7D37A] font-extrabold text-base">{todaySc}</span>
              {' '}/ <span className="text-[#F7D37A] font-extrabold text-base">3</span> ครั้ง
            </span>
            <ChevronIcon className="w-4 h-4 text-[#C9963A]" />
          </div>
          {/* Progress fill */}
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#F7D37A] to-[#C9963A] rounded-b-2xl transition-all"
               style={{ width: `${Math.min(100, (todaySc / 3) * 100)}%` }} />
          <div className="absolute inset-0 card-shine rounded-2xl" />
        </motion.button>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 px-5 mb-4 justify-around"
        >
          {QUICK_ACTIONS.map(({ label, href, icon: Icon }, i) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              onClick={() => router.push(href)}
              className="flex flex-col items-center gap-2 flex-1 group"
            >
              <div className="w-14 h-14 rounded-2xl
                             bg-gradient-to-b from-[rgba(247,211,122,.15)] to-[rgba(201,150,58,.05)]
                             border border-[rgba(201,150,58,.25)]
                             flex items-center justify-center
                             shadow-[0_2px_12px_rgba(0,0,0,.2)]
                             transition-all active:scale-90
                             group-hover:border-[rgba(201,150,58,.5)]
                             group-hover:shadow-[0_4px_20px_rgba(201,150,58,.2)]">
                <Icon className="w-6 h-6 text-[#F7D37A]" />
              </div>
              <span className="text-[11px] font-semibold text-[rgba(247,211,122,.8)]">{label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* เฮง เฮ เปย์ — Three pillars section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-5 mb-4 rounded-2xl overflow-hidden
                     bg-gradient-to-b from-[rgba(139,0,26,.6)] to-[rgba(61,0,8,.6)]
                     border border-[rgba(201,150,58,.2)]"
        >
          <div className="flex">
            {[
              { label: 'เฮง', icon: '🎰', desc: 'กินร้านนี้แล้ว\nวับไชค เฮง', bg: 'from-[#C41E3A]/20 to-transparent' },
              { label: 'เฮ',  icon: '🎊', desc: 'ร้าน ลุ้นรวย\nเตรียม เฮ',  bg: 'from-[#B8860B]/20 to-transparent' },
              { label: 'เปย์', icon: '💰', desc: 'ร้านเข้า ลูกค้า\nลุ้นเปย์แพคเค่จ์',  bg: 'from-[#C41E3A]/20 to-transparent' },
            ].map((item, i) => (
              <div key={item.label}
                   className={`flex-1 text-center py-4 px-2 ${i < 2 ? 'border-r border-[rgba(201,150,58,.1)]' : ''}`}>
                <span className="text-2xl block mb-1">{item.icon}</span>
                <p className="text-lg font-black text-[#F7D37A]">{item.label}</p>
                <p className="text-[9px] text-[rgba(251,240,200,.45)] leading-tight whitespace-pre-line mt-1">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Banner Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <BannerCarousel position="user_hero" />
        </motion.div>

        {/* Live Feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-5 mt-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-400
                             shadow-[0_0_6px_rgba(74,222,128,.6)] animate-pulse" />
            <span className="text-sm font-bold text-[#F7D37A]">สแกนล่าสุด</span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[rgba(201,150,58,.15)]
                          bg-black/20 relative">
            <div className="absolute inset-0 card-shine pointer-events-none" />
            {(feed ?? MOCK_FEED).slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3
                                      border-b border-[rgba(255,255,255,.04)] last:border-none relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F7D37A] to-[#C9963A]
                                flex items-center justify-center text-base flex-shrink-0">
                  😊
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#FDF5E6] leading-tight truncate">
                    <span className="text-[#F7D37A]">{item.customerName}</span>
                    {' '}รับสิทธิ์จาก {item.merchantName}
                  </p>
                  <p className="text-[10px] text-[rgba(251,240,200,.4)] mt-0.5">
                    {formatThaiDate(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="h-6" />
      </div>

      <BottomNav active="home" />
    </div>
  )
}

// ── Stat Pill Component ──────────────────────────────────────────────────
function StatPill({ icon, label, value, color }: {
  icon: string; label: string; value: number; color?: string
}) {
  return (
    <div className="flex-1 bg-black/20 border border-[rgba(201,150,58,.15)]
                    rounded-xl px-3 py-2.5 text-center relative overflow-hidden">
      <div className="absolute inset-0 card-shine pointer-events-none" />
      <div className="relative">
        <span className="text-lg block">{icon}</span>
        <p className={`text-xl font-black leading-tight mt-0.5 ${
          color === 'green' ? 'text-green-400' : 'text-[#F7D37A]'
        }`}>
          {value}
        </p>
        <p className="text-[10px] text-[rgba(251,240,200,.45)] mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Mock feed while API loads ────────────────────────────────────────────
const MOCK_FEED = [
  { customerName:'กุ้ง', merchantName:'ร้านทะเลสาบเมืองทองธานี', createdAt: new Date().toISOString(), ticketCode:'A00001' },
  { customerName:'ปุ้ย', merchantName:'ร้านถนนบอนด์สตรีท',       createdAt: new Date().toISOString(), ticketCode:'A00002' },
  { customerName:'มิ้น', merchantName:'ร้านทะเลสาบเมืองทองธานี', createdAt: new Date().toISOString(), ticketCode:'A00003' },
]

// ── Inline SVG icons ────────────────────────────────────────────────────
function QRIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="5" y="5" width="3" height="3" rx=".5" fill="currentColor"/>
    <rect x="16" y="5" width="3" height="3" rx=".5" fill="currentColor"/>
    <rect x="5" y="16" width="3" height="3" rx=".5" fill="currentColor"/>
    <path d="M14 14h2.5v2.5H14zm3.5 0H20v2.5h-2.5zm-3.5 3.5H16V20h-2.5zm3.5 0H20V20h-2.5z" fill="currentColor"/>
  </svg>
}
function StarIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M12 2l2.4 4.86 5.36.78-3.88 3.78.92 5.35L12 14.27l-4.8 2.5.92-5.35L4.24 7.64l5.36-.78L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
}
function MapIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
}
function UploadIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M12 16V4m-4 4 4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
}
function BellIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
}
function ChevronIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
