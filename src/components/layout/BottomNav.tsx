// ─────────────────────────────────────────────────────────────────────────
// components/layout/BottomNav.tsx
// ─────────────────────────────────────────────────────────────────────────
'use client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const ITEMS = [
  { key:'home',    label:'หน้าหลัก', href:'/home',    icon: HomeIcon },
  { key:'rewards', label:'รางวัล',   href:'/rewards', icon: StarIcon },
  { key:'scan',    label:'สแกน',     href:'/scan',    icon: null     }, // FAB
  { key:'map',     label:'แผนที่',   href:'/map',     icon: MapIcon  },
  { key:'me',      label:'ฉันๆ',     href:'/me',      icon: UserIcon },
]

export default function BottomNav({ active }: { active: string }) {
  const router = useRouter()
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30
                    flex items-center pb-safe
                    bg-[rgba(40,0,10,.97)] border-t border-[rgba(201,150,58,.2)]
                    backdrop-blur-sm">
      {ITEMS.map(({ key, label, href, icon: Icon }) =>
        key === 'scan' ? (
          <button key="scan" onClick={() => router.push('/scan')}
                  className="flex-1 flex flex-col items-center gap-1 pb-1.5 bg-transparent border-none cursor-pointer">
            <div className="w-[52px] h-[52px] rounded-full -mt-4
                            bg-gradient-to-br from-[#FBF0C8] via-[#F7D37A] to-[#C9963A]
                            flex items-center justify-center
                            shadow-[0_4px_18px_rgba(201,150,58,.55),0_0_0_2.5px_rgba(201,150,58,.15)]
                            active:scale-[.93] transition-transform">
              <QRSmallIcon className="w-6 h-6 text-[#3a2000]" />
            </div>
            <span className="text-[10px] font-bold text-[#F7D37A]">{label}</span>
          </button>
        ) : (
          <button key={key} onClick={() => router.push(href)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 py-2.5 bg-transparent border-none cursor-pointer relative',
                    active === key && 'after:content-[""] after:absolute after:top-0 after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-0.5 after:rounded-b-sm after:bg-gradient-to-r after:from-[#F7D37A] after:to-[#C9963A]'
                  )}>
            <Icon className={cn('w-[22px] h-[22px] transition-colors',
                                active === key ? 'text-[#F7D37A]' : 'text-[rgba(251,240,200,.35)]')}/>
            <span className={cn('text-[10px] font-semibold transition-colors',
                                active === key ? 'text-[#F7D37A]' : 'text-[rgba(251,240,200,.35)]')}>
              {label}
            </span>
          </button>
        )
      )}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// components/cards/StatCard.tsx
// ─────────────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex-1 bg-black/25 border border-[rgba(201,150,58,.2)]
                    rounded-xl p-3 text-center">
      <p className={cn('text-2xl font-black leading-none',
                       color === 'green' ? 'text-green-400' : 'text-gold-gradient text-[#F7D37A]')}>
        {value}
      </p>
      <p className="text-[10px] text-[rgba(251,240,200,.4)] mt-1 font-medium">{label}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// components/cards/BannerCarousel.tsx
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useBanners } from '@/lib/hooks'

const FALLBACK_BANNERS = [
  { id:1, title:'ลุ้นทองล้านบาท!', body:'สแกน QR ครบ 5 ร้าน รับสิทธิ์ทันที', bgColor:'#4a1500' },
  { id:2, title:'March Means More', body:'เปลี่ยนคะแนนเป็นรางวัลสุดพิเศษ',    bgColor:'#002a1a' },
  { id:3, title:'Double Win!',       body:'ฉลากคู่ โอกาสชนะคูณสอง',            bgColor:'#1a0040' },
]

export function BannerCarousel({ position }: { position: string }) {
  const { data } = useBanners(position)
  const banners  = data?.banners ?? FALLBACK_BANNERS
  const [cur, setCur] = useState(0)
  const timer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    timer.current = setInterval(() => setCur(c => (c + 1) % banners.length), 3500)
    return () => clearInterval(timer.current)
  }, [banners.length])

  const b = banners[cur] as any
  return (
    <div className="mx-5 rounded-2xl overflow-hidden border border-[rgba(201,150,58,.25)]
                    shadow-card relative" style={{ background: b.bgColor ?? '#3a0010' }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(201,150,58,.2)_0%,transparent_70%)]"/>
      <div className="relative p-5">
        <p className="text-xl font-black text-gold-gradient leading-tight">{b.title}</p>
        <p className="text-xs text-[rgba(251,240,200,.6)] mt-1.5 leading-relaxed">{b.body}</p>
      </div>
      {/* Dots */}
      <div className="flex gap-1.5 justify-center pb-3">
        {banners.map((_,i) => (
          <button key={i} onClick={() => setCur(i)}
                  className={cn('rounded-full h-1.5 transition-all',
                                i === cur ? 'w-4 bg-[#F7D37A]' : 'w-1.5 bg-[rgba(201,150,58,.3)]')}/>
        ))}
      </div>
    </div>
  )
}

// ── Icon helpers ──────────────────────────────────────────────────────────
function HomeIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
function UserIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
}
function QRSmallIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="5" y="5" width="3" height="3" rx=".5" fill="currentColor"/>
    <rect x="16" y="5" width="3" height="3" rx=".5" fill="currentColor"/>
    <rect x="5" y="16" width="3" height="3" rx=".5" fill="currentColor"/>
    <path d="M14 14h2.5v2.5H14zm3.5 0H20v2.5h-2.5zm-3.5 3.5H16V20h-2.5zm3.5 0H20V20h-2.5z" fill="currentColor"/>
  </svg>
}
