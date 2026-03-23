'use client'
/**
 * ════════════════════════════════════════════════════════════
 *  MeeprungTicket.tsx — ฉลากดิจิทัล เฮงเฮง ปังจัง Lucky Draw
 *  Premium Gold Edition — ตัวเลข 6 หลัก
 * 
 *  Usage:
 *    <MeeprungTicket code="382910" shopName="ร้านทะเลสาบฯ" />
 * ════════════════════════════════════════════════════════════
 */
import { useState, useEffect, type CSSProperties } from 'react'
import { motion } from 'framer-motion'

// ── Types ─────────────────────────────────────────────────────
export type TicketStatus = 'active' | 'used' | 'expired' | 'winner'

export interface MeeprungTicketProps {
  /** ตัวเลข 6 หลัก เช่น "382910" */
  code: string
  /** ชื่อร้านค้า */
  shopName?: string
  /** วันที่รับสิทธิ์ */
  date?: string
  /** เวลา */
  time?: string
  /** งวดที่ */
  round?: string
  /** Serial number */
  serial?: string
  /** สถานะฉลาก */
  status?: TicketStatus
  /** ชุดที่ */
  setNo?: string
  /** Auto-reveal flip animation on mount */
  autoReveal?: boolean
  /** Callback เมื่อ flip animation เสร็จ */
  onRevealComplete?: () => void
}

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; border: string }> = {
  active:  { label: '✓ ใช้งานได้',     color: '#15803d', bg: 'rgba(21,128,61,0.08)',  border: 'rgba(21,128,61,0.2)'  },
  used:    { label: 'แลกแล้ว',        color: '#8B6914', bg: 'rgba(139,105,20,0.08)', border: 'rgba(139,105,20,0.2)' },
  expired: { label: 'หมดอายุ',        color: '#991b1b', bg: 'rgba(153,27,27,0.08)',  border: 'rgba(153,27,27,0.2)'  },
  winner:  { label: '🏆 ถูกรางวัล!',  color: '#B8860B', bg: 'rgba(184,134,11,0.15)', border: 'rgba(184,134,11,0.4)' },
}

// ── Bear SVG (reusable) ───────────────────────────────────────
function BearIcon({ size = 16, fill = 'rgba(251,240,200,0.85)' }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30">
      <circle cx="15" cy="12" r="6" fill={fill} />
      <ellipse cx="15" cy="21" rx="8" ry="5" fill={fill} />
      <circle cx="12" cy="10.5" r="1" fill="#3D0008" />
      <circle cx="18" cy="10.5" r="1" fill="#3D0008" />
    </svg>
  )
}

// ── Guilloche Pattern ─────────────────────────────────────────
function GuillochePattern() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}
      viewBox="0 0 500 250" preserveAspectRatio="none"
    >
      {Array.from({ length: 14 }, (_, i) => {
        const y = 15 + i * 17
        return (
          <path key={`h${i}`}
            d={`M0 ${y} Q62 ${y - 18 + (i % 2) * 36} 125 ${y} T250 ${y} T375 ${y} T500 ${y}`}
            fill="none" stroke="#8B6914" strokeWidth={i % 4 === 0 ? 1.2 : 0.5}
          />
        )
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const x = 50 + i * 55
        return (
          <path key={`v${i}`}
            d={`M${x} 0 Q${x + 12} 62 ${x} 125 T${x} 250`}
            fill="none" stroke="#8B6914" strokeWidth={0.35}
          />
        )
      })}
    </svg>
  )
}

// ── Bear Watermark ────────────────────────────────────────────
function BearWatermark() {
  return (
    <svg
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
               width: 150, height: 150, opacity: 0.03, pointerEvents: 'none' }}
      viewBox="0 0 100 100"
    >
      <circle cx="35" cy="22" r="11" fill="#8B6914" />
      <circle cx="65" cy="22" r="11" fill="#8B6914" />
      <circle cx="50" cy="45" r="24" fill="#8B6914" />
      <ellipse cx="50" cy="74" rx="28" ry="16" fill="#8B6914" />
      <circle cx="42" cy="41" r="3.5" fill="#FFFEF5" />
      <circle cx="58" cy="41" r="3.5" fill="#FFFEF5" />
      <circle cx="42" cy="41" r="1.5" fill="#8B6914" />
      <circle cx="58" cy="41" r="1.5" fill="#8B6914" />
      <ellipse cx="50" cy="50" rx="5" ry="3" fill="#FFFEF5" />
    </svg>
  )
}

// ── Rosette Corner ────────────────────────────────────────────
function RosetteCorner({ style }: { style: CSSProperties }) {
  return (
    <svg style={{ position: 'absolute', ...style, width: 22, height: 22, opacity: 0.06, pointerEvents: 'none' }}
         viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="none" stroke="#8B6914" strokeWidth="0.7" />
      <circle cx="11" cy="11" r="6" fill="none" stroke="#8B6914" strokeWidth="0.5" />
      <circle cx="11" cy="11" r="3" fill="none" stroke="#8B6914" strokeWidth="0.4" />
      <circle cx="11" cy="11" r="1.5" fill="#8B6914" />
    </svg>
  )
}

// ── Red Side Strip ────────────────────────────────────────────
function RedStrip({ code, setNo, direction }: { code: string; setNo: string; direction: 'left' | 'right' }) {
  const deg = direction === 'left' ? 45 : -45
  return (
    <div style={{
      width: 54, background: 'linear-gradient(180deg, #D42B2B, #8B001A)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '8px 4px', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.07,
        backgroundImage: `repeating-linear-gradient(${deg}deg, transparent, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 4px)`,
      }} />
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        border: '1.5px solid rgba(251,240,200,0.3)', background: 'rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5,
      }}>
        <BearIcon />
      </div>
      <p style={{ margin: 0, fontSize: 9, color: 'rgba(251,240,200,0.5)', writingMode: 'vertical-lr', letterSpacing: 1 }}>
        {setNo}
      </p>
      <p style={{
        margin: '4px 0 0', fontSize: 23, fontWeight: 900,
        color: '#FBF0C8', writingMode: 'vertical-lr',
        letterSpacing: 5, fontFamily: "'Courier New', monospace",
        textShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}>
        {code}
      </p>
    </div>
  )
}

// ── Perforation ───────────────────────────────────────────────
function Perforation() {
  return (
    <div style={{
      width: 4, position: 'relative',
      backgroundImage: 'radial-gradient(circle, rgba(184,134,11,0.3) 2px, transparent 2px)',
      backgroundSize: '6px 8px',
    }} />
  )
}

// ── Barcode SVG ───────────────────────────────────────────────
function BarcodeSVG() {
  const bars = [0,2.5,5,8,10.5,13,16,18.5,21,24,26.5,29,31.5,34.5,37,39.5,42,45,47.5,50,53,55.5,58,60.5,63.5,66,68.5,71,73.5,76,79,82]
  return (
    <svg width="85" height="11" viewBox="0 0 85 11">
      {bars.map((x, i) => (
        <rect key={i} x={x} y={0} width={i % 3 === 0 ? 1.8 : 0.9} height={11}
              fill="rgba(251,240,200,0.22)" rx={0.2} />
      ))}
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function MeeprungTicket({
  code = '382910',
  shopName = 'ร้านทะเลสาบเมืองทองธานี',
  date = '23 มี.ค. 2569',
  time = '14:32 น.',
  round = 'งวดที่ 1/2569',
  serial = 'HH-2569-0100001',
  status = 'active',
  setNo = 'ชุดที่ 01',
  autoReveal = true,
  onRevealComplete,
}: MeeprungTicketProps) {
  const [revealed, setRevealed] = useState(!autoReveal)
  const [shimmer, setShimmer] = useState(false)
  const st = STATUS_CONFIG[status]
  const digits = code.padStart(6, '0').split('')

  useEffect(() => {
    if (autoReveal) {
      const t = setTimeout(() => setRevealed(true), 500)
      return () => clearTimeout(t)
    }
  }, [autoReveal])

  useEffect(() => {
    if (revealed) {
      const t = setTimeout(() => {
        setShimmer(true)
        onRevealComplete?.()
      }, 700)
      return () => clearTimeout(t)
    }
  }, [revealed, onRevealComplete])

  return (
    <div style={{ padding: '8px 4px', fontFamily: "'Kanit', 'Noto Sans Thai', sans-serif" }}>
      {/* ── Gold outer frame (triple gradient) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, rotateX: autoReveal ? 80 : 0 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          perspective: '1200px', borderRadius: 10, padding: 4,
          background: 'linear-gradient(135deg, #FBF0C8 0%, #E8C84A 12%, #F7D37A 25%, #FFFAEB 38%, #F7D37A 50%, #C9963A 65%, #F7D37A 78%, #E8C84A 90%, #FBF0C8 100%)',
          boxShadow: '0 10px 40px rgba(139,105,20,0.3), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.7)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Shimmer sweep */}
        {shimmer && (
          <motion.div
            initial={{ x: '-120%' }}
            animate={{ x: '280%' }}
            transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3.5 }}
            style={{
              position: 'absolute', top: 0, left: 0, width: '35%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              zIndex: 10, pointerEvents: 'none',
            }}
          />
        )}

        {/* Dark inner border */}
        <div style={{
          borderRadius: 7, padding: 2,
          background: 'linear-gradient(135deg, #A07920 0%, #3D0008 30%, #5A000E 70%, #A07920 100%)',
        }}>
          {/* Cream ticket body */}
          <div style={{ borderRadius: 5, overflow: 'hidden', background: '#FFFEF5', position: 'relative' }}>

            {/* Background layers */}
            <GuillochePattern />
            <BearWatermark />
            <RosetteCorner style={{ top: 6, left: 60 }} />
            <RosetteCorner style={{ top: 6, right: 60 }} />
            <RosetteCorner style={{ bottom: 30, left: 60 }} />
            <RosetteCorner style={{ bottom: 30, right: 60 }} />

            {/* Main layout */}
            <div style={{ display: 'flex', minHeight: 186 }}>

              <RedStrip code={code} setNo={setNo} direction="left" />
              <Perforation />

              {/* ── Center body ── */}
              <div style={{
                flex: 1, padding: '11px 15px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative',
              }}>
                {/* Header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D42B2B, #8B001A)',
                      border: '2px solid #C9963A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(139,105,20,0.2)',
                    }}>
                      <BearIcon size={18} fill="#FBF0C8" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#3D0008', lineHeight: 1.2 }}>
                        เฮงเฮง ปังจัง Lucky Draw
                      </p>
                      <p style={{ margin: 0, fontSize: 7.5, color: '#8B6914', letterSpacing: 0.8 }}>
                        HENGHENG PANGCHANG LUCKY DRAW 2569
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 7, marginTop: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 9, color: '#8B001A',
                      background: 'rgba(196,30,58,0.06)', padding: '2px 7px',
                      borderRadius: 3, border: '0.5px solid rgba(196,30,58,0.12)',
                    }}>{round}</span>
                    <span style={{ fontSize: 9, color: '#8B6914' }}>🏪 {shopName}</span>
                  </div>
                </div>

                {/* ── Big 6-digit number ── */}
                <div style={{ textAlign: 'center', padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 3 }}>
                    <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, transparent, #C9963A)' }} />
                    <span style={{ fontSize: 8.5, color: '#8B6914', letterSpacing: 3.5, fontWeight: 500 }}>
                      TICKET NO.
                    </span>
                    <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, #C9963A, transparent)' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                    {digits.map((d, i) => (
                      <motion.span
                        key={`${code}-${i}`}
                        initial={autoReveal ? { opacity: 0, y: 28, rotateX: -90 } : {}}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{
                          delay: revealed ? 0.12 + i * 0.07 : 10,
                          duration: 0.5,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                          display: 'inline-block',
                          fontSize: 54, fontWeight: 900, color: '#3D0008',
                          letterSpacing: i < digits.length - 1 ? 4 : 0,
                          fontFamily: "'Courier New', monospace",
                          lineHeight: 1,
                          textShadow: '1px 2px 0 rgba(184,134,11,0.1)',
                        }}
                      >
                        {d}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {[
                      { label: 'วันที่รับสิทธิ์', value: date,     textColor: '#3D0008', bg: 'rgba(184,134,11,0.06)', border: 'rgba(184,134,11,0.12)' },
                      { label: 'เวลา',          value: time,     textColor: '#3D0008', bg: 'rgba(184,134,11,0.06)', border: 'rgba(184,134,11,0.12)' },
                      { label: 'สถานะ',         value: st.label, textColor: st.color,   bg: st.bg,                    border: st.border },
                    ].map(({ label, value, textColor, bg, border }) => (
                      <div key={label} style={{ padding: '3px 9px', background: bg, borderRadius: 4, border: `0.5px solid ${border}` }}>
                        <p style={{ margin: 0, fontSize: 7, color: label === 'สถานะ' ? textColor : '#8B6914' }}>{label}</p>
                        <p style={{ margin: 0, fontSize: 11, color: textColor, fontWeight: 700 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {/* QR placeholder */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 5,
                    background: 'white', border: '1.5px solid #C9963A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="28" height="28" viewBox="0 0 40 40">
                      <rect x="4" y="4" width="12" height="12" rx="1" fill="#3D0008" />
                      <rect x="24" y="4" width="12" height="12" rx="1" fill="#3D0008" />
                      <rect x="4" y="24" width="12" height="12" rx="1" fill="#3D0008" />
                      <rect x="6" y="6" width="8" height="8" rx=".5" fill="white" /><rect x="8" y="8" width="4" height="4" fill="#3D0008" />
                      <rect x="26" y="6" width="8" height="8" rx=".5" fill="white" /><rect x="28" y="8" width="4" height="4" fill="#3D0008" />
                      <rect x="6" y="26" width="8" height="8" rx=".5" fill="white" /><rect x="8" y="28" width="4" height="4" fill="#3D0008" />
                      <rect x="24" y="24" width="5" height="5" fill="#3D0008" /><rect x="31" y="24" width="5" height="5" fill="#3D0008" />
                      <rect x="24" y="31" width="5" height="5" fill="#3D0008" /><rect x="31" y="31" width="5" height="5" fill="#3D0008" />
                    </svg>
                  </div>
                </div>
              </div>

              <Perforation />
              <RedStrip code={code} setNo={setNo} direction="right" />
            </div>

            {/* ── Bottom barcode strip ── */}
            <div style={{
              background: 'linear-gradient(90deg, #8B001A, #5A000E)',
              padding: '5px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 7.5, color: 'rgba(251,240,200,0.35)', letterSpacing: 0.3 }}>
                SN: {serial}
              </span>
              <BarcodeSVG />
              <span style={{ fontSize: 7.5, color: 'rgba(251,240,200,0.35)' }}>
                MEEPRUNG BRAND
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
