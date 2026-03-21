'use client'
import { useEffect, useRef, useState } from 'react'
import { useBanners } from '@/lib/hooks'
import { cn } from '@/lib/utils'

const FALLBACK = [
  { id:1, title:'ลุ้นทองล้านบาท!',   body:'สแกน QR ครบ 5 ร้าน รับสิทธิ์ทันที', bgColor:'#4a1500' },
  { id:2, title:'March Means More',   body:'เปลี่ยนคะแนนเป็นรางวัลสุดพิเศษ',    bgColor:'#002a1a' },
  { id:3, title:'Double Win!',         body:'ฉลากคู่ โอกาสชนะคูณสอง',            bgColor:'#1a0040' },
]

export default function BannerCarousel({ position }: { position: string }) {
  const { data } = useBanners(position)
  const banners  = (data?.banners ?? FALLBACK) as any[]
  const [cur, setCur]   = useState(0)
  const timer = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    timer.current = setInterval(() => setCur(c => (c + 1) % banners.length), 3500)
    return () => clearInterval(timer.current)
  }, [banners.length])

  const b = banners[cur]
  return (
    <div className="mx-5 rounded-2xl overflow-hidden border border-[rgba(201,150,58,.25)]
                    shadow-[0_4px_24px_rgba(0,0,0,.4)] relative"
         style={{ background: b.bgColor ?? '#3a0010' }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(201,150,58,.2)_0%,transparent_70%)]"/>
      <div className="relative p-5">
        <p className="text-xl font-black text-[#F7D37A] leading-tight">{b.title}</p>
        <p className="text-xs text-[rgba(251,240,200,.6)] mt-1.5 leading-relaxed">{b.body}</p>
      </div>
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
