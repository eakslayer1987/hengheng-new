'use client'
import { cn } from '@/lib/utils'

export default function StatCard({ label, value, color }: {
  label: string; value: number; color?: string
}) {
  return (
    <div className="flex-1 bg-black/25 border border-[rgba(201,150,58,.2)]
                    rounded-xl p-3 text-center">
      <p className={cn('text-2xl font-black leading-none',
                       color === 'green' ? 'text-green-400' : 'text-[#F7D37A]')}>
        {value}
      </p>
      <p className="text-[10px] text-[rgba(251,240,200,.4)] mt-1 font-medium">{label}</p>
    </div>
  )
}
