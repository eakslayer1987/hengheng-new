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
  const prizes = campaign?.prizes ?? MOCK_PRIZES

  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto overflow-hidden
                    bg-gradient-to-b from-[#8B001A] via-[#6B0010] to-[#4A000C] damask-bg">
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
        {/* Score strip */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    className="mx-5 mt-4 mb-3 flex items-center justify-between
                               bg-gradient-to-r from-[rgba(139,105,20,.25)] to-[rgba(201,150,58,.12)]
                               border border-[rgba(201,150,58,.4)] rounded-2xl px-4 py-3 relative card-shine">
          <span className="text-sm text-[#FBF0C8] font-semibold">คะแนนสะสมของคุณ</span>
          <span className="text-2xl font-black text-gold-gradient">
            {(codesData?.codes?.length ?? 0) * 40} <span className="text-base font-semibold">แต้ม</span>
          </span>
        </motion.div>

        {/* Prize list */}
        <div className="px-5 space-y-3">
          {prizes.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden
                                   bg-black/25 border border-[rgba(201,150,58,.18)] card-shine shadow-card">
              <div className="w-16 h-16 rounded-2xl flex-shrink-0 text-4xl
                              bg-gradient-to-br from-[rgba(139,105,20,.3)] to-[rgba(80,0,20,.5)]
                              flex items-center justify-center border border-[rgba(201,150,58,.15)]">
                {p.emoji}
              </div>
              <div className="flex-1">
                <p className="text-base font-extrabold text-[#FDF5E6]">{p.name}</p>
                <p className="text-xs text-[rgba(251,240,200,.5)] mt-0.5">{p.desc}</p>
                {/* Probability bar */}
                <div className="mt-2 h-1.5 rounded-full bg-black/30 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#F7D37A] to-[#C9963A]"
                       style={{ width: `${p.prob}%` }} />
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
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
                             text-[#3a1a00] font-extrabold text-lg shadow-gold
                             active:scale-[.97] transition-transform">
            📷 สแกน QR รับสิทธิ์เพิ่ม
          </button>
        </div>
        <div className="h-4" />
      </div>

      <BottomNav active="rewards" />
    </div>
  )
}

const MOCK_PRIZES = [
  { id:1, emoji:'🥇', name:'ทองคำ 10 บาท',      desc:'มูลค่า ~120,000 บาท · 1 รางวัล',         prob:0.1  },
  { id:2, emoji:'💰', name:'เงินสด 10,000 บาท',  desc:'10 รางวัล · ลุ้นรอบใหญ่',               prob:0.5  },
  { id:3, emoji:'🛍️', name:'บัตรส่วนลด 1,000 บ', desc:'ทุกการสแกน · ร้านร่วมรายการ',           prob:25   },
  { id:4, emoji:'🍜', name:'อาหารฟรี 1 มื้อ',    desc:'ร้านค้าร่วมรายการ',                      prob:20   },
  { id:5, emoji:'🎫', name:'ส่วนลด 100 บาท',     desc:'ฉลากทั่วไป · ใช้ได้ทันที',               prob:50   },
]
