'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useCampaign, useMyCodes } from '@/lib/hooks'
import { useUserStore } from '@/store'
import { fmt } from '@/lib/utils'
import BottomNav from '@/components/layout/BottomNav'

export default function RewardsPage() {
  const router = useRouter()
  const phone  = useUserStore(s => s.phone)
  const { data: campaign } = useCampaign()
  const { data: codesData } = useMyCodes(phone)

  // Map API prizes to display format, or use poster-based defaults
  const prizes = campaign?.prizes?.map((p: any) => ({
    id: p.id,
    emoji: getPrizeEmoji(p.name),
    name: p.name,
    desc: p.description,
    prob: p.probability,
  })) ?? POSTER_PRIZES

  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto overflow-hidden
                    bg-gradient-to-b from-[#C41E3A] via-[#8B001A] to-[#3D0008] damask-bg">
      <header className="flex items-center gap-3 px-5 h-14 flex-shrink-0
                         border-b border-[rgba(201,150,58,.15)] bg-[rgba(61,0,16,.9)]">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl border border-[rgba(201,150,58,.2)]
                   bg-black/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#F7D37A]" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="flex-1 text-lg font-bold text-gold-gradient">ของรางวัล</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Campaign banner */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    className="mx-5 mt-4 mb-4 rounded-2xl overflow-hidden
                               bg-gradient-to-r from-[rgba(139,105,20,.3)] to-[rgba(201,150,58,.1)]
                               border border-[rgba(201,150,58,.35)] relative">
          <div className="absolute inset-0 card-shine pointer-events-none" />
          <div className="relative p-4 text-center">
            <p className="text-lg font-black text-gold-gradient">
              {campaign?.name ?? 'ลูกค้าเฮง ร้านค้าเฮ หมีปรุงเปย์'}
            </p>
            <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full
                           bg-gradient-to-r from-[#F7D37A] to-[#C9963A]
                           shadow-[0_2px_12px_rgba(201,150,58,.4)]">
              <span className="text-sm">🏆</span>
              <span className="text-xs font-black text-[#3a1a00]">
                รวมมูลค่า {fmt(campaign?.totalPrizeValue ?? 2400000)} บาท
              </span>
            </div>
          </div>
        </motion.div>

        {/* Score strip */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay: 0.05 }}
                    className="mx-5 mb-4 flex items-center justify-between
                               bg-black/25 border border-[rgba(201,150,58,.2)]
                               rounded-2xl px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-0 card-shine pointer-events-none" />
          <span className="relative text-sm text-[#FBF0C8] font-semibold">ฉลากสะสม</span>
          <span className="relative text-2xl font-black text-gold-gradient">
            {codesData?.codes?.length ?? 0}
            <span className="text-sm font-semibold ml-1">ใบ</span>
          </span>
        </motion.div>

        {/* Prize list */}
        <div className="px-5 space-y-3">
          {prizes.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                        transition={{ delay: 0.08 + i * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden
                                   bg-black/25 border border-[rgba(201,150,58,.18)] shadow-card">
              <div className="absolute inset-0 card-shine pointer-events-none" />
              <div className="relative w-14 h-14 rounded-2xl flex-shrink-0 text-3xl
                              bg-gradient-to-br from-[rgba(139,105,20,.3)] to-[rgba(80,0,20,.5)]
                              flex items-center justify-center border border-[rgba(201,150,58,.15)]">
                {p.emoji}
              </div>
              <div className="relative flex-1">
                <p className="text-sm font-extrabold text-[#FDF5E6]">{p.name}</p>
                <p className="text-xs text-[rgba(251,240,200,.5)] mt-0.5">{p.desc}</p>
                {/* Probability bar */}
                <div className="mt-2 h-1.5 rounded-full bg-black/30 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#F7D37A] to-[#C9963A]"
                       style={{ width: `${Math.min(100, p.prob * 2)}%` }} />
                </div>
              </div>
              <div className="relative flex-shrink-0 text-right">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full
                                 bg-[rgba(201,150,58,.12)] text-[#F7D37A] border border-[rgba(201,150,58,.2)]">
                  {p.prob}%
                </span>
                <p className="text-[10px] text-[rgba(251,240,200,.35)] mt-1">โอกาส</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Redeem CTA */}
        <div className="px-5 mt-5">
          <button onClick={() => router.push('/scan')}
                  className="relative w-full py-4 rounded-2xl overflow-hidden btn-shimmer
                             bg-gradient-to-r from-[#FBF0C8] via-[#F7D37A] to-[#C9963A]
                             text-[#3a1a00] font-extrabold text-lg
                             active:scale-[.97] transition-transform
                             shadow-[0_4px_20px_rgba(201,150,58,.4)]">
            📷 สแกน QR รับสิทธิ์เพิ่ม
          </button>
        </div>
        <div className="h-4" />
      </div>

      <BottomNav active="rewards" />
    </div>
  )
}

function getPrizeEmoji(name: string): string {
  if (name.includes('10 บาท')) return '👑'
  if (name.includes('5 บาท'))  return '🥇'
  if (name.includes('1 บาท'))  return '🥇'
  if (name.includes('สลึง'))   return '🥈'
  if (name.includes('เปย์') || name.includes('หมีปรุง')) return '🐻'
  if (name.includes('200'))    return '🎫'
  if (name.includes('100'))    return '🎟️'
  if (name.includes('Lucky') || name.includes('ลุ้น')) return '🎰'
  return '🎁'
}

// Poster-accurate prizes (fallback when API not ready)
const POSTER_PRIZES = [
  { id:1, emoji:'👑', name:'ทองคำ 10 บาท',            desc:'ทองคำแท่ง 10 บาท — รางวัลใหญ่สุด 1 รางวัล',           prob: 1   },
  { id:2, emoji:'🥇', name:'ทองคำ 5 บาท',             desc:'ทองคำแท่ง 5 บาท — 2 รางวัล',                          prob: 2   },
  { id:3, emoji:'🥇', name:'ทองคำ 1 บาท',             desc:'ทองคำแท่ง 1 บาท — 10 รางวัล',                         prob: 3   },
  { id:4, emoji:'🥈', name:'ทองคำ 1 สลึง',            desc:'ทองคำแท่ง 1 สลึง — 20 รางวัล',                        prob: 4   },
  { id:5, emoji:'🐻', name:'หมีปรุง เปย์แพคเค่จ์',      desc:'เซ็ตซอสหมีปรุง ครบชุด — 100 รางวัล',                   prob: 10  },
  { id:6, emoji:'🎫', name:'คูปองส่วนลด 200 บาท',     desc:'คูปองซื้อสินค้า ปังจัง.com — 500 รางวัล',               prob: 15  },
  { id:7, emoji:'🎟️', name:'คูปองส่วนลด 100 บาท',     desc:'คูปองซื้อสินค้า ปังจัง.com — 1,000 รางวัล',             prob: 15  },
  { id:8, emoji:'🎰', name:'Lucky Ticket ลุ้นรอบใหญ่',  desc:'ฉลากลุ้นโชค เข้ารอบจับรางวัลทองคำวันสุดท้าย',           prob: 50  },
]
