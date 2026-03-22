'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useMerchants, useFeed } from '@/lib/hooks'
import { useAppStore } from '@/store'
import { fmt, formatThaiDate } from '@/lib/utils'
import BottomNav from '@/components/layout/BottomNav'
import type { Merchant } from '@/lib/api'
import dynamicImport from 'next/dynamic'

export const dynamic = 'force-dynamic'

const LeafletMap = dynamicImport(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center flex-col gap-3">
      <span className="text-4xl animate-pulse">🗺️</span>
      <p className="text-sm text-[rgba(251,240,200,.4)]">กำลังโหลดแผนที่...</p>
    </div>
  )
})

type Tab = 'map' | 'feed' | 'list'

export default function MapPage() {
  const router = useRouter()
  const [tab, setTab]           = useState<Tab>('map')
  const [selected, setSelected] = useState<Merchant | null>(null)
  const [filter, setFilter]     = useState<'all' | 'hasQr' | 'noQr'>('all')

  const { data: merchantData } = useMerchants()
  const { data: feedData }     = useFeed(20)
  const merchants = (merchantData ?? []) as any[]
  const feed      = (feedData ?? []) as any[]

  const filtered = merchants.filter(m => {
    if (filter === 'hasQr') return m.qrRemaining > 0
    if (filter === 'noQr')  return m.qrRemaining <= 0
    return true
  })

  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto overflow-hidden
                    bg-[#0d1117] text-[#e6edf3]" style={{ fontFamily: "'Kanit',sans-serif" }}>

      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-[rgba(255,255,255,.06)]
                         bg-[rgba(13,17,23,.97)]">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => router.back()}
                  className="w-8 h-8 rounded-lg border border-[rgba(255,255,255,.08)]
                             flex items-center justify-center text-[rgba(200,220,255,.5)]">
            ←
          </button>
          <h1 className="text-base font-black">
            แผนที่<span className="text-[#E8B820]">ร้านค้า</span>
          </h1>
          <span className="text-xs text-[rgba(200,220,255,.4)] bg-[rgba(255,255,255,.05)]
                           px-2 py-0.5 rounded-full">
            {filtered.length} ร้าน
          </span>
        </div>
        {/* Tabs */}
        <div className="flex gap-2">
          {(['map','feed','list'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all
                      ${tab === t
                        ? 'bg-[#E8B820] text-[#3d1f00]'
                        : 'bg-[rgba(255,255,255,.05)] text-[rgba(200,220,255,.5)]'}`}>
              {t === 'map' ? '🗺️ แผนที่' : t === 'feed' ? '⚡ Live' : '📋 รายการ'}
            </button>
          ))}
        </div>
      </header>

      {/* Filter chips */}
      {tab !== 'feed' && (
        <div className="flex-shrink-0 flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar
                        bg-[rgba(13,17,23,.95)] border-b border-[rgba(255,255,255,.04)]">
          {[
            { key:'all',   label:'ทั้งหมด' },
            { key:'hasQr', label:'🟢 มี QR' },
            { key:'noQr',  label:'🔴 QR หมด' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all
                      ${filter === f.key
                        ? 'bg-[rgba(232,184,32,.15)] border border-[rgba(232,184,32,.4)] text-[#E8B820]'
                        : 'bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.06)] text-[rgba(200,220,255,.5)]'}`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* MAP */}
        {tab === 'map' && (
          <>
            <LeafletMap merchants={filtered} onSelect={setSelected} />
            <AnimatePresence>
              {selected && (
                <MerchantSheet merchant={selected} onClose={() => setSelected(null)}
                               onScan={() => router.push('/scan')} />
              )}
            </AnimatePresence>
          </>
        )}

        {/* FEED */}
        {tab === 'feed' && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,.04)]">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse
                               shadow-[0_0_6px_rgba(74,222,128,.6)]" />
              <span className="text-sm font-bold text-[#E8B820]">สแกนล่าสุด</span>
            </div>
            {feed.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3
                                      border-b border-[rgba(255,255,255,.04)]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8B820] to-[#A67208]
                                flex items-center justify-center text-base flex-shrink-0">
                  😊
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    <span className="text-[#E8B820]">{item.customerName}</span>
                    {' '}สแกนที่ {item.merchantName}
                  </p>
                  <p className="text-[10px] text-[rgba(200,220,255,.35)] mt-0.5">
                    {formatThaiDate(item.createdAt)}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[rgba(63,185,80,.8)]
                                 bg-[rgba(63,185,80,.1)] px-2 py-0.5 rounded-full flex-shrink-0">
                  ✓ รับสิทธิ์
                </span>
              </div>
            ))}
            {feed.length === 0 && (
              <div className="flex flex-col items-center py-16 text-[rgba(200,220,255,.3)]">
                <span className="text-4xl mb-2">⚡</span>
                <p className="text-sm">ยังไม่มีกิจกรรม</p>
              </div>
            )}
          </div>
        )}

        {/* LIST */}
        {tab === 'list' && (
          <div className="flex-1 overflow-y-auto">
            {filtered.map((m: any) => (
              <button key={m.id} onClick={() => { setSelected(m); setTab('map') }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left
                                 border-b border-[rgba(255,255,255,.04)]
                                 active:bg-[rgba(255,255,255,.04)]">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${m.qrRemaining > 0
                  ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,.5)]'
                  : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{m.name}</p>
                  <p className="text-[10px] text-[rgba(200,220,255,.4)] truncate mt-0.5">
                    📍 {m.address || '—'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-[#E8B820]">{m.qrRemaining}</p>
                  <p className="text-[9px] text-[rgba(200,220,255,.4)]">QR เหลือ</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="map" />
    </div>
  )
}

// ── Merchant Bottom Sheet ──────────────────────────────────────────────────
function MerchantSheet({ merchant: m, onClose, onScan }: {
  merchant: any; onClose: () => void; onScan: () => void
}) {
  return (
    <motion.div initial={{ y: '105%' }} animate={{ y: 0 }} exit={{ y: '105%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="absolute bottom-16 left-0 right-0 z-50
                           bg-[rgba(22,27,34,.98)] border-t border-[rgba(232,184,32,.3)]
                           rounded-t-2xl px-5 py-4 pb-6">
      <div className="w-8 h-1 bg-[rgba(255,255,255,.1)] rounded-full mx-auto mb-4" />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-base font-black">{m.name}</p>
          <p className="text-xs text-[rgba(200,220,255,.5)] mt-0.5">
            📍 {m.address || '—'}
          </p>
        </div>
        <button onClick={onClose} className="text-[rgba(200,220,255,.4)] text-sm
                                              border border-[rgba(255,255,255,.08)]
                                              rounded-lg px-2.5 py-1">
          ✕
        </button>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-[rgba(63,185,80,.1)] border border-[rgba(63,185,80,.25)]
                        rounded-xl p-3 text-center">
          <p className="text-xl font-black text-green-400">{m.qrRemaining}</p>
          <p className="text-[10px] text-[rgba(200,220,255,.4)] mt-0.5">QR เหลือ</p>
        </div>
        <div className="flex-1 bg-[rgba(88,166,255,.08)] border border-[rgba(88,166,255,.2)]
                        rounded-xl p-3 text-center">
          <p className="text-xl font-black text-blue-400">{m.todayScans ?? 0}</p>
          <p className="text-[10px] text-[rgba(200,220,255,.4)] mt-0.5">สแกนวันนี้</p>
        </div>
        {m.winners > 0 && (
          <div className="flex-1 bg-[rgba(232,184,32,.08)] border border-[rgba(232,184,32,.25)]
                          rounded-xl p-3 text-center">
            <p className="text-xl font-black text-[#E8B820]">{m.winners}</p>
            <p className="text-[10px] text-[rgba(200,220,255,.4)] mt-0.5">ผู้โชคดี</p>
          </div>
        )}
      </div>
      <button onClick={onScan}
              className="w-full h-12 rounded-2xl font-black text-sm
                         bg-gradient-to-r from-[#FD1803] to-[#a00000] text-white
                         active:scale-[.98] transition-transform">
        📷 สแกน QR ที่ร้านนี้
      </button>
    </motion.div>
  )
}
