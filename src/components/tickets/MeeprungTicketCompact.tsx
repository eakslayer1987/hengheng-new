'use client'
/**
 * MeeprungTicketCompact.tsx — ฉลากแบบย่อ สำหรับ list view
 * ใช้ในหน้า "ฉลากของฉัน" (me/page.tsx)
 */
import { motion } from 'framer-motion'
import type { TicketStatus } from './MeeprungTicket'

interface CompactTicketProps {
  code: string
  shopName: string
  date: string
  status: TicketStatus
  index?: number
  onClick?: () => void
}

const STATUS = {
  active:  { label: '✓', color: '#15803d' },
  used:    { label: '✗ แลกแล้ว', color: '#999' },
  expired: { label: 'หมดอายุ', color: '#991b1b' },
  winner:  { label: '🏆', color: '#B8860B' },
}

export default function MeeprungTicketCompact({
  code, shopName, date, status = 'active', index = 0, onClick,
}: CompactTicketProps) {
  const st = STATUS[status]
  const isActive = status === 'active' || status === 'winner'

  return (
    <motion.button
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', height: 72,
        borderRadius: 10, overflow: 'hidden',
        border: `1.5px solid ${isActive ? '#C9963A' : 'rgba(201,150,58,0.3)'}`,
        background: '#FFFEF5',
        opacity: isActive ? 1 : 0.55,
        cursor: onClick ? 'pointer' : 'default',
        padding: 0, textAlign: 'left',
        fontFamily: "'Kanit', sans-serif",
        position: 'relative',
        transition: 'transform 0.15s',
      }}
    >
      {/* Guilloche subtle */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none' }}
           viewBox="0 0 400 80" preserveAspectRatio="none">
        <path d="M0 40 Q100 20 200 40 T400 40" fill="none" stroke="#8B6914" strokeWidth="1" />
        <path d="M0 50 Q100 30 200 50 T400 50" fill="none" stroke="#8B6914" strokeWidth="0.5" />
      </svg>

      {/* Left red strip */}
      <div style={{
        width: 40,
        background: isActive ? 'linear-gradient(180deg, #D42B2B, #8B001A)' : 'linear-gradient(180deg, #888, #666)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{
          margin: 0, fontSize: 18, fontWeight: 900,
          color: isActive ? '#FBF0C8' : 'rgba(255,255,255,0.7)',
          writingMode: 'vertical-lr', letterSpacing: 3,
          fontFamily: "'Courier New', monospace",
        }}>{code}</p>
      </div>

      {/* Perforation */}
      <div style={{
        width: 3,
        backgroundImage: `radial-gradient(circle, ${isActive ? 'rgba(184,134,11,0.2)' : 'rgba(150,150,150,0.15)'} 1px, transparent 1px)`,
        backgroundSize: '5px 5px',
      }} />

      {/* Body */}
      <div style={{ flex: 1, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <p style={{
            margin: 0, fontSize: 28, fontWeight: 900, lineHeight: 1,
            color: isActive ? '#3D0008' : '#888',
            letterSpacing: 8, fontFamily: "'Courier New', monospace",
          }}>{code}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
            <span style={{ fontSize: 9, color: isActive ? '#8B6914' : '#999' }}>🏪 {shopName}</span>
            <span style={{ fontSize: 9, color: isActive ? '#8B6914' : '#999' }}>{date}</span>
            <span style={{ fontSize: 9, color: st.color, fontWeight: 600 }}>{st.label}</span>
          </div>
        </div>

        {/* QR mini */}
        {isActive && (
          <div style={{
            width: 32, height: 32, borderRadius: 4,
            background: 'white', border: '1px solid #ddd',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 40 40">
              <rect x="4" y="4" width="12" height="12" rx="1" fill="#3D0008" />
              <rect x="24" y="4" width="12" height="12" rx="1" fill="#3D0008" />
              <rect x="4" y="24" width="12" height="12" rx="1" fill="#3D0008" />
              <rect x="6" y="6" width="8" height="8" rx=".5" fill="white" /><rect x="8" y="8" width="4" height="4" fill="#3D0008" />
              <rect x="26" y="6" width="8" height="8" rx=".5" fill="white" /><rect x="28" y="8" width="4" height="4" fill="#3D0008" />
              <rect x="6" y="26" width="8" height="8" rx=".5" fill="white" /><rect x="8" y="28" width="4" height="4" fill="#3D0008" />
            </svg>
          </div>
        )}
      </div>
    </motion.button>
  )
}
