'use client'
/**
 * /app/scan/page.tsx — QR Scan Flow
 * 1. Camera + jsQR  2. GPS check  3. Form  4. POST claim
 * FIX: Added BottomNav component
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import jsQR from 'jsqr'
import { useUserStore } from '@/store'
import { useClaim } from '@/lib/hooks'
import { getMerchantStatus } from '@/lib/api'
import { getUserLocation, haversineDistance } from '@/lib/utils'
import type { Merchant, ClaimResult } from '@/lib/api'
import BottomNav from '@/components/layout/BottomNav'

type Step = 'scanning' | 'confirm' | 'success' | 'error'

export default function ScanPage() {
  const router    = useRouter()
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>()

  const lineId    = useUserStore(s => s.lineId)
  const phone     = useUserStore(s => s.phone)
  const addCode   = useUserStore(s => s.addCode)
  const todaySc   = useUserStore(s => s.todayScans)

  const [step,      setStep]      = useState<Step>('scanning')
  const [merchant,  setMerchant]  = useState<Merchant | null>(null)
  const [gpsOk,     setGpsOk]     = useState(false)
  const [distance,  setDistance]  = useState<number | null>(null)
  const [formName,  setFormName]  = useState('')
  const [formPhone, setFormPhone] = useState(phone ?? '')
  const [result,    setResult]    = useState<ClaimResult | null>(null)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  const { trigger: doClaim } = useClaim()

  // Guard: not logged in
  useEffect(() => { if (!lineId) router.replace('/') }, [lineId, router])

  // Start camera
  useEffect(() => {
    let stream: MediaStream
    const startCam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          tick()
        }
      } catch { /* no cam in browser preview */ }
    }
    if (step === 'scanning') startCam()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      stream?.getTracks().forEach(t => t.stop())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const tick = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick); return
    }
    const ctx = canvas.getContext('2d')!
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (code?.data) handleQRFound(code.data)
    else rafRef.current = requestAnimationFrame(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleQRFound = async (data: string) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    try {
      const merchantPhone = data.trim()
      const [mer, coords] = await Promise.all([
        getMerchantStatus(merchantPhone),
        getUserLocation(),
      ])
      const dist = haversineDistance(
        coords.latitude, coords.longitude,
        mer.lat, mer.lng
      )
      setMerchant(mer)
      setDistance(Math.round(dist))
      setGpsOk(dist <= 20)
      setStep('confirm')
    } catch (e: any) {
      setError(e.message ?? 'เกิดข้อผิดพลาด')
      setStep('error')
    }
  }

  const handleClaim = async () => {
    if (!merchant || !formName || !formPhone) return
    setLoading(true)
    try {
      const coords = await getUserLocation()
      const res = await doClaim({
        merchantPhone: merchant.phone,
        customerName:  formName,
        customerPhone: formPhone,
        lat: coords.latitude,
        lng: coords.longitude,
      })
      setResult(res)
      addCode({
        code:         res.ticketCode,
        merchantName: merchant.name,
        claimedAt:    new Date().toISOString(),
        status:       'active',
      })
      setStep('success')
    } catch (e: any) {
      setError(e.message ?? 'ไม่สามารถรับสิทธิ์ได้')
      setStep('error')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto overflow-hidden
                    bg-gradient-to-b from-[#C41E3A] via-[#8B001A] to-[#3D0008] damask-bg">

      {/* Topbar */}
      <header className="flex items-center gap-3 px-5 h-14 flex-shrink-0
                         border-b border-[rgba(201,150,58,.15)] bg-[rgba(61,0,16,.9)]">
        <button onClick={() => router.back()}
                className="w-9 h-9 rounded-xl border border-[rgba(201,150,58,.2)]
                           bg-black/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#F7D37A]" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="flex-1 text-lg font-bold text-gold-gradient">
          สแกน QR เพื่อรับสิทธิ์
        </h1>
        {/* Step dots */}
        <div className="flex gap-1.5">
          {[1,2,3].map(n => (
            <div key={n} className={`w-2 h-2 rounded-full transition-colors
              ${step === 'scanning' && n===1 ? 'bg-[#F7D37A]' :
                step === 'confirm'  && n===2 ? 'bg-[#F7D37A]' :
                step === 'success'  && n===3 ? 'bg-green-400' :
                'bg-[rgba(201,150,58,.2)]'}`}/>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <AnimatePresence mode="wait">

          {/* ── SCANNING ── */}
          {step === 'scanning' && (
            <motion.div key="scan" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                        className="flex flex-col gap-4 p-5">
              {/* Camera */}
              <div className="relative rounded-3xl overflow-hidden bg-black aspect-square
                              shadow-[0_8px_32px_rgba(0,0,0,.6),0_0_0_1.5px_rgba(201,150,58,.3)]">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />

                {/* Gold ornate frame */}
                <div className="absolute inset-0 pointer-events-none">
                  <svg viewBox="0 0 320 320" className="w-full h-full">
                    <defs>
                      <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FBF0C8"/>
                        <stop offset="50%" stopColor="#C9963A"/>
                        <stop offset="100%" stopColor="#8B6914"/>
                      </linearGradient>
                    </defs>
                    <path d="M60 100 L60 60 L100 60" fill="none" stroke="url(#fg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="60" cy="60" r="5" fill="#F7D37A"/>
                    <path d="M220 60 L260 60 L260 100" fill="none" stroke="url(#fg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="260" cy="60" r="5" fill="#F7D37A"/>
                    <path d="M60 220 L60 260 L100 260" fill="none" stroke="url(#fg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="60" cy="260" r="5" fill="#F7D37A"/>
                    <path d="M220 260 L260 260 L260 220" fill="none" stroke="url(#fg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="260" cy="260" r="5" fill="#F7D37A"/>
                  </svg>
                </div>

                {/* Scan beam */}
                <div className="absolute left-[20%] right-[20%] h-0.5 scan-beam
                                bg-gradient-to-r from-transparent via-[rgba(255,200,80,1)] to-transparent
                                shadow-[0_0_8px_rgba(255,200,80,.7)]" />

                <p className="absolute bottom-4 left-0 right-0 text-center
                              text-xs text-[rgba(247,211,122,.6)] font-medium">
                  📍 กำลังตรวจสอบตำแหน่ง GPS...
                </p>
              </div>

              <p className="text-center text-sm font-bold text-gold-gradient">
                วางกล้องตรง QR Code ของร้านค้า
              </p>

              {/* Demo button */}
              <button onClick={() => handleQRFound('0812345678')}
                      className="relative w-full py-4 rounded-2xl overflow-hidden btn-shimmer
                                 bg-gradient-to-r from-[#FBF0C8] via-[#F7D37A] to-[#C9963A]
                                 text-[#3a1a00] font-extrabold text-lg
                                 shadow-gold active:scale-[.97] transition-transform">
                🎯 จำลองสแกน (Demo)
              </button>
            </motion.div>
          )}

          {/* ── CONFIRM ── */}
          {step === 'confirm' && merchant && (
            <motion.div key="confirm"
                        initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}}
                        className="flex flex-col gap-4 p-5">
              {/* Merchant card */}
              <div className="relative flex items-center gap-4 p-4 rounded-2xl overflow-hidden
                              bg-gradient-to-r from-[rgba(100,20,0,.8)] to-[rgba(60,0,10,.9)]
                              border border-[rgba(201,150,58,.3)] card-shine
                              shadow-card">
                <div className="w-14 h-14 rounded-2xl flex-shrink-0 text-3xl
                                bg-gradient-to-br from-[#F7D37A] to-[#C9963A]
                                flex items-center justify-center
                                shadow-[0_4px_12px_rgba(201,150,58,.4)]">
                  🏪
                </div>
                <div className="flex-1">
                  <p className="text-lg font-extrabold text-[#FDF5E6]">{merchant.name}</p>
                  <p className="text-xs text-[rgba(251,240,200,.5)] mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                            stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    ห่าง {distance ?? '–'} เมตร
                  </p>
                  {gpsOk ? (
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full
                                     bg-[rgba(34,197,94,.15)] border border-[rgba(34,197,94,.3)]
                                     text-green-400 text-xs font-bold">
                      ✓ อยู่ในระยะ 20m
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full
                                     bg-[rgba(239,68,68,.15)] border border-[rgba(239,68,68,.3)]
                                     text-red-400 text-xs font-bold">
                      ✗ ไกลเกินไป ({distance}m)
                    </span>
                  )}
                </div>
              </div>

              {/* Form */}
              <div className="bg-black/25 border border-[rgba(201,150,58,.2)]
                              rounded-2xl p-4 space-y-3">
                <p className="text-sm font-bold text-[#F7D37A]">กรอกข้อมูลเพื่อรับสิทธิ์</p>
                <div>
                  <label className="text-xs text-[rgba(251,240,200,.5)] font-medium block mb-1.5">
                    ชื่อ-นามสกุล
                  </label>
                  <input value={formName} onChange={e => setFormName(e.target.value)}
                         className="w-full px-4 py-3.5 rounded-xl
                                    bg-black/35 border border-[rgba(201,150,58,.2)]
                                    text-[#FDF5E6] font-medium text-base
                                    placeholder-[rgba(251,240,200,.25)]
                                    focus:outline-none focus:border-[rgba(201,150,58,.5)]
                                    transition-colors"
                         placeholder="กรอกชื่อ-นามสกุล"/>
                </div>
                <div>
                  <label className="text-xs text-[rgba(251,240,200,.5)] font-medium block mb-1.5">
                    เบอร์โทรศัพท์
                  </label>
                  <input value={formPhone} onChange={e => setFormPhone(e.target.value)}
                         type="tel" maxLength={10}
                         className="w-full px-4 py-3.5 rounded-xl
                                    bg-black/35 border border-[rgba(201,150,58,.2)]
                                    text-[#FDF5E6] font-medium text-base
                                    placeholder-[rgba(251,240,200,.25)]
                                    focus:outline-none focus:border-[rgba(201,150,58,.5)]
                                    transition-colors"
                         placeholder="085-123-XXXX"/>
                </div>
              </div>

              {/* Quota */}
              <div className="flex gap-2.5">
                {[
                  { n: todaySc,          l: 'สแกนไปแล้ว' },
                  { n: 3 - todaySc,      l: 'เหลือวันนี้' },
                  { n: 3,                l: 'จำกัด/วัน'  },
                ].map(({ n, l }) => (
                  <div key={l} className="flex-1 bg-black/25 border border-[rgba(201,150,58,.2)]
                                          rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-gold-gradient leading-none">{n}</p>
                    <p className="text-[10px] text-[rgba(251,240,200,.4)] mt-1">{l}</p>
                  </div>
                ))}
              </div>

              <button onClick={handleClaim}
                      disabled={!gpsOk || !formName || !formPhone || loading}
                      className="relative w-full py-4 rounded-2xl overflow-hidden btn-shimmer
                                 bg-gradient-to-r from-[#FBF0C8] via-[#F7D37A] to-[#C9963A]
                                 text-[#3a1a00] font-extrabold text-lg
                                 shadow-gold active:scale-[.97] transition-transform
                                 disabled:opacity-50 disabled:pointer-events-none">
                {loading ? '⏳ กำลังส่ง...' : '🎊 ยืนยันรับสิทธิ์!'}
              </button>

              <button onClick={() => setStep('scanning')}
                      className="w-full py-3 rounded-xl border border-[rgba(201,150,58,.2)]
                                 text-[rgba(251,240,200,.5)] text-sm font-medium bg-transparent">
                ยกเลิก / สแกนใหม่
              </button>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && result && (
            <motion.div key="success"
                        initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}}
                        className="flex flex-col items-center p-6 gap-5 text-center">
              <div className="text-7xl animate-glowPulse">🎉</div>
              <div>
                <h2 className="text-3xl font-black text-gold-gradient">ยินดีด้วย!</h2>
                <p className="text-sm text-[rgba(251,240,200,.6)] mt-1">
                  คุณได้รับฉลากดิจิทัล 1 ใบ
                </p>
              </div>

              {/* Ticket */}
              <div className="w-full bg-gradient-to-br from-[#FBF0C8] via-[#F7D37A] to-[#C9963A]
                              rounded-3xl p-6 shadow-gold-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1/2 h-full
                                bg-white/10 -skew-x-12 pointer-events-none"/>
                <p className="text-xs font-bold text-[rgba(58,26,0,.6)] uppercase tracking-widest mb-2">
                  รหัสฉลากของคุณ
                </p>
                <p className="text-5xl font-black text-[#3a1a00] tracking-[6px]
                              drop-shadow-[0_2px_4px_rgba(0,0,0,.1)]">
                  {result.ticketCode}
                </p>
                <p className="text-xs text-[rgba(58,26,0,.6)] font-semibold mt-3">
                  🏪 {merchant?.name} · {new Date().toLocaleDateString('th-TH')}
                </p>
              </div>

              {/* Summary */}
              <div className="w-full flex gap-3">
                {[
                  { n: result.todayUsed,       l: 'สแกนวันนี้'    },
                  { n: result.remainingToday,  l: 'เหลือวันนี้'   },
                  { n: result.todayUsed + 1,   l: 'ฉลากทั้งหมด'  },
                ].map(({ n, l }) => (
                  <div key={l} className="flex-1 bg-black/25 border border-[rgba(201,150,58,.2)]
                                          rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-gold-gradient leading-none">{n}</p>
                    <p className="text-[10px] text-[rgba(251,240,200,.4)] mt-1">{l}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push('/me')}
                      className="relative w-full py-4 rounded-2xl overflow-hidden btn-shimmer
                                 bg-gradient-to-r from-[#FBF0C8] via-[#F7D37A] to-[#C9963A]
                                 text-[#3a1a00] font-extrabold text-lg shadow-gold
                                 active:scale-[.97] transition-transform">
                🎫 ดูฉลากทั้งหมด
              </button>

              <button onClick={() => { setStep('scanning'); setMerchant(null) }}
                      className="w-full py-3 rounded-xl border border-[rgba(201,150,58,.2)]
                                 text-[rgba(251,240,200,.5)] text-sm font-medium bg-transparent">
                สแกนอีกครั้ง
              </button>
            </motion.div>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <motion.div key="error" initial={{opacity:0}} animate={{opacity:1}}
                        className="flex flex-col items-center p-8 gap-5 text-center">
              <div className="text-6xl">😢</div>
              <div>
                <h2 className="text-xl font-black text-red-400">เกิดข้อผิดพลาด</h2>
                <p className="text-sm text-[rgba(251,240,200,.55)] mt-2">{error}</p>
              </div>
              <button onClick={() => { setStep('scanning'); setError('') }}
                      className="relative w-full py-4 rounded-2xl overflow-hidden btn-shimmer
                                 bg-gradient-to-r from-[#FBF0C8] via-[#F7D37A] to-[#C9963A]
                                 text-[#3a1a00] font-extrabold text-lg shadow-gold
                                 active:scale-[.97] transition-transform">
                ลองใหม่อีกครั้ง
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <BottomNav active="scan" />
    </div>
  )
}
