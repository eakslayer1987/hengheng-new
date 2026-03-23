'use client'
/**
 * /app/map/page.tsx — แผนที่ร้านค้า
 * Theme: Red Gold matching poster
 * FIX: BottomNav + working Leaflet + red-gold theme
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useMerchants, useFeed } from '@/lib/hooks'
import { formatThaiDate } from '@/lib/utils'
import BottomNav from '@/components/layout/BottomNav'
import dynamicImport from 'next/dynamic'

export const dynamic = 'force-dynamic'

// Dynamic import LeafletMap (SSR off — Leaflet needs window)
const LeafletMap = dynamicImport(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center flex-col gap-3
                    bg-gradient-to-b from-[rgba(139,0,26,.3)] to-[rgba(61,0,8,.3)]">
      <span className="text-4xl animate-glowPulse">🗺️</span>
      <p className="text-sm text-[rgba(251,240,200,.4)]">กำลังโหลดแผนที่...</p>
    </div>
  ),
})

type Tab = 'map' | 'feed' | 'list'

// ── Mock merchants (ใช้ตอน API ยังไม่พร้อม) ──────────────────
const MOCK_MERCHANTS = [
  { id: 1, name: 'ร้านทะเลสาบเมืองทองธานี', ownerName: 'พี่อ้อย', phone: '0812345678', address: 'เมืองทองธานี ปากเกร็ด', lat: 13.9120, lng: 100.5450, status: 'approved', quota: 100, todayScans: 12, qrRemaining: 88, winners: 2 },
  { id: 2, name: 'ร้านข้าวแกงพี่อ้อย', ownerName: 'พี่อ้อย', phone: '0823456789', address: 'งามวงศ์วาน ลาดยาว', lat: 13.8530, lng: 100.5680, status: 'approved', quota: 50, todayScans: 8, qrRemaining: 42, winners: 0 },
  { id: 3, name: 'ร้านส้มตำแม่มณี', ownerName: 'แม่มณี', phone: '0834567890', address: 'ติวานนท์ ปากเกร็ด', lat: 13.8920, lng: 100.5280, status: 'approved', quota: 30, todayScans: 30, qrRemaining: 0, winners: 1 },
  { id: 4, name: 'ร้านก๋วยเตี๋ยวเจ้าเก่า', ownerName: 'ลุงสมชาย', phone: '0845678901', address: 'แจ้งวัฒนะ หลักสี่', lat: 13.8750, lng: 100.5720, status: 'approved', quota: 80, todayScans: 5, qrRemaining: 75, winners: 0 },
  { id: 5, name: 'ร้านอาหารตามสั่งบ้านพี่เจ', ownerName: 'พี่เจ', phone: '0856789012', address: 'รัตนาธิเบศร์ นนทบุรี', lat: 13.8650, lng: 100.5050, status: 'approved', quota: 60, todayScans: 15, qrRemaining: 45, winners: 3 },
] as any[]

export default function MapPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('map')
  const [selected, setSelected] = useState<any | null>(null)
  const [filter, setFilter] = useState<'all' | 'hasQr' | 'noQr'>('all')

  const { data: merchantData } = useMerchants()
  const { data: feedData } = useFeed(20)

  // ใช้ data จาก API ถ้ามี ไม่งั้นใช้ mock
  const merchants = (merchantData && (merchantData as any[]).length > 0)
    ? merchantData as any[]
    : MOCK_MERCHANTS
  const feed = (feedData ?? []) as any[]

  const filtered = merchants.filter(m => {
    if (filter === 'hasQr') return (m.qrRemaining ?? m.quota - m.todayScans) > 0
    if (filter === 'noQr') return (m.qrRemaining ?? m.quota - m.todayScans) <= 0
    return true
  })

  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto overflow-hidden
                    bg-gradient-to-b from-[#C41E3A] via-[#8B001A] to-[#3D0008]">

      {/* Damask pattern */}
      <div className="damask-bg absolute inset-0 pointer-events-none" />

      {/* Header */}
      <header className="relative flex-shrink-0 px-4 pt-3 pb-2
                         border-b border-[rgba(201,150,58,.2)]
                         bg-[rgba(61,0,8,.9)] backdrop-blur-sm z-20">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => router.back()}
                  className="w-9 h-9 rounded-xl border border-[rgba(201,150,58,.2)]
                             bg-black/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#F7D37A]" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-base font-black text-gold-gradient">
            แผนที่ร้านค้า
          </h1>
          <span className="text-xs text-[rgba(251,240,200,.5)]
                           bg-black/20 px-2.5 py-1 rounded-full
                           border border-[rgba(201,150,58,.15)]">
            {filtered.length} ร้าน
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([
            { key: 'map',  label: '🗺️ แผนที่' },
            { key: 'feed', label: '⚡ Live' },
            { key: 'list', label: '📋 รายการ' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      tab === t.key
                        ? 'bg-gradient-to-r from-[#F7D37A] to-[#C9963A] text-[#3a1a00] shadow-[0_2px_8px_rgba(201,150,58,.3)]'
                        : 'bg-black/20 text-[rgba(251,240,200,.5)] border border-[rgba(201,150,58,.1)]'
                    }`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Filter chips (map & list tabs) */}
      {tab !== 'feed' && (
        <div className="relative flex-shrink-0 flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar
                        bg-[rgba(61,0,8,.7)] border-b border-[rgba(201,150,58,.1)] z-10">
          {[
            { key: 'all',   label: 'ทั้งหมด' },
            { key: 'hasQr', label: '🟢 มี QR' },
            { key: 'noQr',  label: '🔴 QR หมด' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      filter === f.key
                        ? 'bg-[rgba(247,211,122,.15)] border border-[rgba(247,211,122,.4)] text-[#F7D37A]'
                        : 'bg-black/15 border border-[rgba(201,150,58,.1)] text-[rgba(251,240,200,.45)]'
                    }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative flex-1 overflow-hidden flex flex-col pb-20">

        {/* ── MAP TAB ── */}
        {tab === 'map' && (
          <>
            <LeafletMap merchants={filtered} onSelect={setSelected} />
            <AnimatePresence>
              {selected && (
                <MerchantSheet
                  merchant={selected}
                  onClose={() => setSelected(null)}
                  onScan={() => router.push('/scan')}
                />
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── FEED TAB ── */}
        {tab === 'feed' && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-2 px-4 py-3
                            border-b border-[rgba(201,150,58,.1)]">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse
                               shadow-[0_0_6px_rgba(74,222,128,.6)]" />
              <span className="text-sm font-bold text-[#F7D37A]">สแกนล่าสุด</span>
            </div>
            {(feed.length > 0 ? feed : MOCK_FEED).map((item: any, i: number) => (
              <motion.div key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 px-4 py-3
                                     border-b border-[rgba(255,255,255,.04)]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F7D37A] to-[#C9963A]
                                flex items-center justify-center text-base flex-shrink-0">
                  😊
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#FDF5E6] truncate">
                    <span className="text-[#F7D37A]">{item.customerName}</span>
                    {' '}สแกนที่ {item.merchantName}
                  </p>
                  <p className="text-[10px] text-[rgba(251,240,200,.35)] mt-0.5">
                    {formatThaiDate(item.createdAt)}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-green-400
                                 bg-[rgba(74,222,128,.1)] px-2 py-0.5 rounded-full flex-shrink-0
                                 border border-[rgba(74,222,128,.2)]">
                  ✓ รับสิทธิ์
                </span>
              </motion.div>
            ))}
            {feed.length === 0 && MOCK_FEED.length === 0 && (
              <div className="flex flex-col items-center py-16 text-[rgba(251,240,200,.3)]">
                <span className="text-4xl mb-2">⚡</span>
                <p className="text-sm">ยังไม่มีกิจกรรม</p>
              </div>
            )}
          </div>
        )}

        {/* ── LIST TAB ── */}
        {tab === 'list' && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filtered.map((m: any, i: number) => (
              <motion.button key={m.id}
                             initial={{ opacity: 0, y: 8 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: i * 0.03 }}
                             onClick={() => { setSelected(m); setTab('map') }}
                             className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                                        border-b border-[rgba(255,255,255,.04)]
                                        active:bg-white/5 transition-colors">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  (m.qrRemaining ?? m.quota - m.todayScans) > 0
                    ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,.5)]'
                    : 'bg-red-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#FDF5E6] truncate">{m.name}</p>
                  <p className="text-[10px] text-[rgba(251,240,200,.4)] truncate mt-0.5">
                    📍 {m.address || '—'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-[#F7D37A]">
                    {m.qrRemaining ?? m.quota - m.todayScans}
                  </p>
                  <p className="text-[9px] text-[rgba(251,240,200,.4)]">QR เหลือ</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* BottomNav — z-30 เหนือทุก layer */}
      <BottomNav active="map" />
    </div>
  )
}

// ── Mock feed ─────────────────────────────────────────────────
const MOCK_FEED = [
  { customerName: 'กุ้ง', merchantName: 'ร้านทะเลสาบเมืองทองธานี', createdAt: new Date().toISOString() },
  { customerName: 'ปุ้ย', merchantName: 'ร้านข้าวแกงพี่อ้อย', createdAt: new Date(Date.now() - 60000).toISOString() },
  { customerName: 'มิ้น', merchantName: 'ร้านส้มตำแม่มณี', createdAt: new Date(Date.now() - 120000).toISOString() },
  { customerName: 'โอ๊ต', merchantName: 'ร้านก๋วยเตี๋ยวเจ้าเก่า', createdAt: new Date(Date.now() - 180000).toISOString() },
  { customerName: 'แพร', merchantName: 'ร้านอาหารตามสั่งบ้านพี่เจ', createdAt: new Date(Date.now() - 240000).toISOString() },
]

// ── Merchant Bottom Sheet ─────────────────────────────────────
function MerchantSheet({ merchant: m, onClose, onScan }: {
  merchant: any; onClose: () => void; onScan: () => void
}) {
  const qrLeft = m.qrRemaining ?? m.quota - m.todayScans
  return (
    <motion.div
      initial={{ y: '105%' }}
      animate={{ y: 0 }}
      exit={{ y: '105%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="absolute bottom-0 left-0 right-0 z-40
                 bg-[rgba(61,0,8,.98)] border-t border-[rgba(201,150,58,.3)]
                 rounded-t-2xl px-5 py-4 pb-24 backdrop-blur-sm"
    >
      <div className="w-8 h-1 bg-[rgba(201,150,58,.2)] rounded-full mx-auto mb-4" />

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-base font-black text-[#FDF5E6] truncate">{m.name}</p>
          <p className="text-xs text-[rgba(251,240,200,.5)] mt-0.5 truncate">
            📍 {m.address || '—'}
          </p>
        </div>
        <button onClick={onClose}
                className="text-[rgba(251,240,200,.4)] text-sm
                           border border-[rgba(201,150,58,.2)]
                           rounded-lg px-2.5 py-1 ml-3 flex-shrink-0">
          ✕
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-[rgba(74,222,128,.08)] border border-[rgba(74,222,128,.2)]
                        rounded-xl p-3 text-center">
          <p className="text-xl font-black text-green-400">{qrLeft}</p>
          <p className="text-[10px] text-[rgba(251,240,200,.4)] mt-0.5">QR เหลือ</p>
        </div>
        <div className="flex-1 bg-[rgba(247,211,122,.08)] border border-[rgba(247,211,122,.2)]
                        rounded-xl p-3 text-center">
          <p className="text-xl font-black text-[#F7D37A]">{m.todayScans ?? 0}</p>
          <p className="text-[10px] text-[rgba(251,240,200,.4)] mt-0.5">สแกนวันนี้</p>
        </div>
        {(m.winners ?? 0) > 0 && (
          <div className="flex-1 bg-[rgba(201,150,58,.08)] border border-[rgba(201,150,58,.2)]
                          rounded-xl p-3 text-center">
            <p className="text-xl font-black text-[#C9963A]">{m.winners}</p>
            <p className="text-[10px] text-[rgba(251,240,200,.4)] mt-0.5">ผู้โชคดี</p>
          </div>
        )}
      </div>

      <button onClick={onScan}
              className="relative w-full py-3.5 rounded-2xl font-extrabold text-base overflow-hidden
                         bg-gradient-to-r from-[#FBF0C8] via-[#F7D37A] to-[#C9963A]
                         text-[#3a1a00] shadow-[0_4px_16px_rgba(201,150,58,.3)]
                         active:scale-[.97] transition-transform btn-shimmer">
        📷 สแกน QR ที่ร้านนี้
      </button>
    </motion.div>
  )
}
