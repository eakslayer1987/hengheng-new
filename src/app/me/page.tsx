'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store'
import { useMyCodes } from '@/lib/hooks'
import { formatThaiDate } from '@/lib/utils'
import BottomNav from '@/components/layout/BottomNav'
import Image from 'next/image'

export default function MePage() {
  const router      = useRouter()
  const name        = useUserStore(s => s.lineDisplayName)
  const avatar      = useUserStore(s => s.lineAvatarUrl)
  const phone       = useUserStore(s => s.phone)
  const todaySc     = useUserStore(s => s.todayScans)
  const clearUser   = useUserStore(s => s.clearUser)
  const { data }    = useMyCodes(phone)
  const codes       = data?.codes ?? MOCK_CODES

  const handleLogout = () => { clearUser(); router.replace('/') }

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
        <h1 className="flex-1 text-lg font-bold text-gold-gradient">โปรไฟล์ฉัน</h1>
        <button onClick={handleLogout} className="text-xs text-[rgba(251,240,200,.35)] font-medium">
          ออกจากระบบ
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Profile hero */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    className="px-5 pt-6 pb-5 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-[#C9963A]
                          shadow-[0_0_20px_rgba(201,150,58,.4)] overflow-hidden
                          bg-gradient-to-br from-[#F7D37A] to-[#C9963A] flex items-center justify-center">
            {avatar
              ? <Image src={avatar} alt="avatar" width={80} height={80} className="object-cover"/>
              : <span className="text-4xl">😊</span>
            }
          </div>
          <p className="text-xl font-extrabold text-[#FDF5E6]">{name ?? 'ลูกค้าหมีปรุง'}</p>
          <p className="text-sm text-[rgba(251,240,200,.5)] mt-1">{phone ?? '–'}</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:.08 }}
                    className="flex gap-2.5 px-5 mb-5">
          {[
            { n: codes.length, l:'ฉลากทั้งหมด' },
            { n: todaySc,      l:'สแกนวันนี้'  },
            { n: codes.filter((c:any) => c.status === 'active').length, l:'ใช้ได้อยู่' },
          ].map(({ n, l }) => (
            <div key={l} className="flex-1 bg-black/25 border border-[rgba(201,150,58,.2)]
                                    rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-gold-gradient leading-none">{n}</p>
              <p className="text-[10px] text-[rgba(251,240,200,.4)] mt-1">{l}</p>
            </div>
          ))}
        </motion.div>

        {/* Codes list */}
        <div className="px-5">
          <p className="text-sm font-bold text-[#F7D37A] mb-3">ฉลากล่าสุด</p>
          <div className="rounded-2xl overflow-hidden border border-[rgba(201,150,58,.15)]
                          bg-black/20 relative card-shine">
            {codes.map((c: any, i: number) => (
              <motion.div key={c.code}
                          initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 px-4 py-3.5
                                     border-b border-[rgba(255,255,255,.04)] last:border-none">
                <p className="text-xl font-black text-gold-gradient min-w-[90px] tracking-widest">
                  {c.code}
                </p>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#FDF5E6]">{c.merchantName}</p>
                  <p className="text-[11px] text-[rgba(251,240,200,.4)] mt-0.5">
                    {formatThaiDate(c.claimedAt)}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full
                  ${c.status === 'active'
                    ? 'bg-[rgba(34,197,94,.15)] text-green-400 border border-[rgba(34,197,94,.25)]'
                    : 'bg-[rgba(255,255,255,.06)] text-[rgba(251,240,200,.4)]'}`}>
                  {c.status === 'active' ? 'ใช้งานได้' : 'แลกแล้ว'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div className="mx-5 mt-4 rounded-2xl overflow-hidden border border-[rgba(201,150,58,.15)]
                        bg-black/20 card-shine">
          {[
            { label:'ประวัติการสแกน', icon:'🕐', action: () => {} },
            { label:'แจ้งปัญหา',      icon:'💬', action: () => {} },
            { label:'เงื่อนไขการใช้งาน', icon:'📄', action: () => {} },
          ].map(({ label, icon, action }) => (
            <button key={label} onClick={action}
                    className="w-full flex items-center justify-between px-4 py-4
                               border-b border-[rgba(255,255,255,.04)] last:border-none
                               text-left active:bg-white/5 transition-colors">
              <span className="flex items-center gap-3 text-sm text-[#FDF5E6] font-medium">
                <span>{icon}</span>{label}
              </span>
              <svg className="w-4 h-4 text-[rgba(201,150,58,.4)]" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
        <div className="h-4" />
      </div>

      <BottomNav active="me" />
    </div>
  )
}

const MOCK_CODES = [
  { code:'A38291', merchantName:'ร้านทะเลสาบเมืองทองธานี', claimedAt: new Date().toISOString(), status:'active' },
  { code:'B72045', merchantName:'ร้านถนนบอนด์สตรีท',       claimedAt: new Date(Date.now()-86400000).toISOString(), status:'active' },
  { code:'C10984', merchantName:'ร้านทะเลสาบเมืองทองธานี', claimedAt: new Date(Date.now()-172800000).toISOString(), status:'used' },
]
