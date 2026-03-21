/**
 * hooks.ts — SWR data-fetching hooks
 */

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import * as api from './api'

// ── Campaign ──────────────────────────────────────────────────────────────
export const useCampaign = () =>
  useSWR('campaign', api.getCampaign, { refreshInterval: 60_000 })

// ── Banners ───────────────────────────────────────────────────────────────
export const useBanners = (position: string) =>
  useSWR(['banners', position], () => api.getBanners(position as api.BannerPosition))

// ── Merchant status ───────────────────────────────────────────────────────
export const useMerchantStatus = (phone: string | null) =>
  useSWR(phone ? ['merchant', phone] : null, () => api.getMerchantStatus(phone!))

// ── All merchants (map) ───────────────────────────────────────────────────
export const useMerchants = () =>
  useSWR('merchants', api.getMerchants, { refreshInterval: 30_000 })

// ── My codes ──────────────────────────────────────────────────────────────
export const useMyCodes = (phone: string | null) =>
  useSWR(phone ? ['codes', phone] : null, () => api.getMyCodes(phone!))

// ── Live feed ─────────────────────────────────────────────────────────────
export const useFeed = (limit = 10) =>
  useSWR(['feed', limit], () => api.getFeed(limit), { refreshInterval: 5_000 })

// ── Stats ─────────────────────────────────────────────────────────────────
export const useStats = (phone: string | null) =>
  useSWR(phone ? ['stats', phone] : null, () => api.getStats(phone!))

// ── Receipts ──────────────────────────────────────────────────────────────
export const useReceipts = (phone: string | null) =>
  useSWR(phone ? ['receipts', phone] : null, () => api.getReceipts(phone!))

// ── Mutations ─────────────────────────────────────────────────────────────
export const useClaim = () =>
  useSWRMutation('claim', (_: string, { arg }: { arg: api.ClaimPayload }) =>
    api.claim(arg)
  )

export const useSendOTP = () =>
  useSWRMutation('otp-send', (_: string, { arg }: { arg: string }) =>
    api.sendOTP(arg)
  )

export const useVerifyOTP = () =>
  useSWRMutation('otp-verify', (_: string, { arg }: { arg: { phone: string; code: string } }) =>
    api.verifyOTP(arg.phone, arg.code)
  )

export const useRegisterMerchant = () =>
  useSWRMutation('register', (_: string, { arg }: { arg: api.RegisterPayload }) =>
    api.registerMerchant(arg)
  )
