/**
 * store/index.ts — Zustand global state
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Campaign, CodeEntry } from '@/lib/api'

// ── User Store ────────────────────────────────────────────────────────────
interface UserState {
  name: string | null
  phone: string | null
  lineId: string | null
  lineDisplayName: string | null
  lineAvatarUrl: string | null
  codes: CodeEntry[]
  todayScans: number
  setUser: (data: Partial<UserState>) => void
  addCode: (code: CodeEntry) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: null,
      phone: null,
      lineId: null,
      lineDisplayName: null,
      lineAvatarUrl: null,
      codes: [],
      todayScans: 0,
      setUser: (data) => set((s) => ({ ...s, ...data })),
      addCode: (code) => set((s) => ({ codes: [code, ...s.codes], todayScans: s.todayScans + 1 })),
      clearUser: () => set({ name: null, phone: null, lineId: null, codes: [], todayScans: 0 }),
    }),
    { name: 'pangchang-user' }
  )
)

// ── App Store ─────────────────────────────────────────────────────────────
interface AppState {
  campaign: Campaign | null
  userLat: number | null
  userLng: number | null
  setCampaign: (c: Campaign) => void
  setLocation: (lat: number, lng: number) => void
}

export const useAppStore = create<AppState>()((set) => ({
  campaign: null,
  userLat: null,
  userLng: null,
  setCampaign: (campaign) => set({ campaign }),
  setLocation: (lat, lng) => set({ userLat: lat, userLng: lng }),
}))
