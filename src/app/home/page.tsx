'use client'
/**
 * /app/home/page.tsx — Home Page
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore, useAppStore } from '@/store'
import { useCampaign, useFeed, useMyCodes } from '@/lib/hooks'
import { fmt, formatThaiDate } from '@/lib/utils'
import BottomNav from '@/components/layout/BottomNav'
import BannerCarousel from '@/components/cards/BannerCarousel'
import StatCard from '@/components/cards/StatCard'

// Quick action items
const QUICK_ACTIONS = [
  { label: 'สแกน',    href: '/scan',    icon: QRIcon },
  { label: 'รางวัล',  href: '/rewards', icon: StarIcon },
  { label: 'แผนที่',  href: '/map',     icon: MapIcon },
  { label: 'อัปโหลด', href: '/merchant/receipts', icon: UploadIcon },
]

export default function HomePage() {
  const router   = useRouter()
  const lineId   = useUserStore(s => s.lineId)
  const name     = useUserStore(s => s.lineDisplayName)
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

  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto overflow-hidden
                    bg-gradient-to-b from-[#8B001A] via-[#6B0010] to-[#4A000C] damask-bg">

      {/* Topbar */}
      <header className="flex items-center justify-between px-5 py-3 flex-shrink-0
                         bg-[rgba(61,0,16,.9)] border-b border-[rgba(201,150,58,.2)]
                         backdrop-blur-sm">
        <button className="w-9 h-9 rounded-xl border border-[rgba(201,150,58,.2)]
                           bg-black/20 flex items-center justify-center">
          <MenuIcon className="w-5 h-5 text-[#F7D37A]" />
        </button>
        <h1 className="text-lg font-black text-gold-gradient tracking-wide">ปังจัง</h1>
        <button className="w-9 h-9 rounded-xl border border-[rgba(201,150,58,.2)]
                           bg-black/20 flex items-center justify-center"
                onClick={() => router.push('/me')}>
          <BellIcon className="w-5 h-5 text-[#F7D37A]" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                    transition={{ duration:.4 }}
                    className="px-5 pt-4 pb-5 text-center relative">
          <div className="text-8xl mb-1 inline-block drop-shadow-[0_8px_24px_rgba(201,150,58,.5)]
                          animate-glowPulse">🐷</div>
          <h2 className="text-3xl font-black text-gold-gradient leading-tight">
            สะสมแด้น ลุ้นโชคใหญ่!
          </h2>
          {campaign && (
            <p className="text-xs text-[rgba(251,240,200,.6)] mt-1">
              รวมมูลค่า {fmt(campaign.totalPrizeValue)} บาท
            </p>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:.08, duration:.35 }}
                    className="flex gap-3 px-5 mb-4 justify-around">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
            <button key={label}
                    onClick={() => router.push(href)}
                    className="flex flex-col items-center gap-2 flex-1 group">
              <div className="w-14 h-14 rounded-full border border-[rgba(201,150,58,.25)]
                              bg-[rgba(0,0,0,.25)] flex items-center justify-center
                              shadow-card transition-transform active:scale-90
                              group-hover:border-[rgba(201,150,58,.5)]">
                <Icon className="w-6 h-6 text-[#F7D37A]" />
              </div>
              <span className="text-[11px] font-semibold text-[rgba(247,211,122,.8)]">{label}</span>
            </button>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:.14, duration:.35 }}
                    className="flex gap-2.5 px-5 mb-4">
          <StatCard label="ฉลากของฉัน" value={codesData?.codes?.length ?? 0} />
          <StatCard label="สแกนวันนี้"  value={todaySc} color="green" />
          <StatCard label="เหลือวันนี้"  value={Math.max(0, 3 - todaySc)} />
        </motion.div>

        {/* Progress pill */}
        <motion.button initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                       transition={{ delay:.2, duration:.35 }}
                       onClick={() => router.push('/rewards')}
                       className="mx-5 mb-4 w-[calc(100%-40px)] flex items-center justify-between
                                  bg-gradient-to-r from-[rgba(139,105,20,.25)] to-[rgba(201,150,58,.12)]
                                  border border-[rgba(201,150,58,.4)] rounded-2xl px-4 py-3
                                  relative overflow-hidden card-shine">
          <span className="text-sm text-[#FBF0C8] font-semibold">
            วันนี้คุณสแกนแล้ว{' '}
            <span className="text-[#F7D37A] font-extrabold text-base">{todaySc}</span>
            {' '}จาก{' '}
            <span className="text-[#F7D37A] font-extrabold text-base">3</span>
            {' '}ครั้ง
          </span>
          <ChevronIcon className="w-4 h-4 text-[#C9963A]" />
        </motion.button>

        {/* Banner Carousel */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:.26, duration:.35 }}>
          <BannerCarousel position="user_hero" />
        </motion.div>

        {/* Live Feed */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:.32, duration:.35 }}
                    className="px-5 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-400
                             shadow-[0_0_6px_rgba(74,222,128,.6)] animate-pulse" />
            <span className="text-sm font-bold text-[#F7D37A]">สแกนล่าสุด</span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[rgba(201,150,58,.15)]
                          bg-black/20 relative card-shine">
            {(feed ?? MOCK_FEED).slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3
                                      border-b border-[rgba(255,255,255,.04)] last:border-none">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F7D37A] to-[#C9963A]
                                flex items-center justify-center text-base flex-shrink-0">
                  😊
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#FDF5E6] leading-tight">
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

        <div className="h-4" />
      </div>

      <BottomNav active="home" />
    </div>
  )
}

// ── Mock feed while API loads ─────────────────────────────────────────────
const MOCK_FEED = [
  { customerName:'กุ้ง', merchantName:'ร้านทะเลสาบเมืองทองธานี', createdAt: new Date().toISOString(), ticketCode:'A00001' },
  { customerName:'ปุ้ย', merchantName:'ร้านถนนบอนด์สตรีท',       createdAt: new Date().toISOString(), ticketCode:'A00002' },
  { customerName:'มิ้น', merchantName:'ร้านทะเลสาบเมืองทองธานี', createdAt: new Date().toISOString(), ticketCode:'A00003' },
]

// ── Inline SVG icons ──────────────────────────────────────────────────────
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
function MenuIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
