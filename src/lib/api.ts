/**
 * ═══════════════════════════════════════════════════════
 *  lib/api.ts  —  FULL CONNECTION MAP
 *  อ้างอิงจาก System Architecture v20-03
 * ═══════════════════════════════════════════════════════
 *
 *  ┌──────────────────────────────────────────────────────┐
 *  │  PHP API (VPS)                                       │
 *  │  BASE = NEXT_PUBLIC_PHP_API_URL                      │
 *  │  = https://xn--72ca9ib1gc.xn--72cac8e8ec.com        │
 *  │    /hengheng/api                                     │
 *  └──────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────┐
 *  │  Prisma / MySQL (DB1)                                │
 *  │  DATABASE_URL → admin_xnca_fooddash                  │
 *  │  ใช้เฉพาะ: Admin Next.js routes (/api/admin/*)       │
 *  └──────────────────────────────────────────────────────┘
 */

export const PHP_API = process.env.NEXT_PUBLIC_PHP_API_URL!
// = https://xn--72ca9ib1gc.xn--72cac8e8ec.com/hengheng/api

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
// = https://xn--72ca9ib1gc.xn--72cac8e8ec.com

// ─────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────

export interface SystemContent {
  appName:  string
  slides:   { title: string; body: string; imageUrl?: string }[]
  howTo:    { step: number; text: string }[]
  navItems: { label: string; icon: string; tab: string }[]
}

export interface Campaign {
  id:              number
  name:            string
  description:     string
  prizes:          Prize[]
  endDate:         string
  totalPrizeValue: number
}

export interface Prize {
  id:             number
  name:           string
  description:    string
  probability:    number
  imageUrl?:      string
  requiredPoints: number
}

// 9 ตำแหน่ง banner ทั้งหมดในระบบ
export type BannerPosition =
  | 'user_topbar'      // แถบบนสุดหน้าลูกค้า
  | 'user_hero'        // Hero carousel หน้าหลัก
  | 'user_infeed'      // Card กลางหน้า
  | 'user_popup'       // Popup modal
  | 'user_sticky'      // Sticky bar ล่างหน้า
  | 'merchant_hero'    // Hero merchant portal
  | 'merchant_card'    // Card merchant portal
  | 'merchant_popup'   // Popup merchant portal
  | 'admin_alert'      // Alert bar admin

export interface Banner {
  id:        number
  type:      'announcement' | 'image' | 'card' | 'sticky' | 'popup' | 'interstitial'
  title:     string
  body?:     string
  imageUrl?: string
  bgColor?:  string
  linkUrl?:  string
  position:  BannerPosition
}

export interface Merchant {
  id:         number
  name:       string
  ownerName:  string
  phone:      string
  address:    string
  lat:        number
  lng:        number
  status:     'approved' | 'pending' | 'rejected'
  quota:      number
  todayScans: number
}

export interface ClaimPayload {
  merchantPhone: string
  customerName:  string
  customerPhone: string
  lat:           number
  lng:           number
}

export interface ClaimResult {
  ticketCode:     string   // 6 หลัก (DigitalTicket)
  merchantName:   string
  todayUsed:      number
  dailyLimit:     number   // default 3 ครั้ง/วัน
  remainingToday: number
}

export interface CodeEntry {
  code:         string
  merchantName: string
  claimedAt:    string
  status:       'active' | 'used' | 'expired'
}

export interface FeedItem {
  id:           number
  customerName: string
  merchantName: string
  createdAt:    string
  ticketCode:   string
}

export interface Receipt {
  id:        number
  phone:     string
  bagCount:  number
  imageUrl:  string
  status:    'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface StatsData {
  dailyChart:  { date: string; count: number }[]  // 7 วัน จ-อา
  recentScans: { customerPhone: string; createdAt: string }[]
  totalToday:  number
  totalAll:    number
}

export interface RegisterPayload {
  name:      string
  ownerName: string
  address:   string
  lat:       number
  lng:       number
  phone:     string
}

// ─────────────────────────────────────────────────────────
//  HELPERS (PHP API)
// ─────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${PHP_API}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`[PHP API] GET ${path} → ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${PHP_API}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`[PHP API] POST ${path} → ${res.status}`)
  return res.json()
}

async function patch<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${PHP_API}${path}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`[PHP API] PATCH ${path} → ${res.status}`)
  return res.json()
}


// ═══════════════════════════════════════════════════════
//  USER FLOW — page.tsx (5 Tabs)
// ═══════════════════════════════════════════════════════

/** [Home Tab] ชื่อแอป, slides, how-to, nav items */
export const getContent = (): Promise<SystemContent> =>
  get('/content.php')

/** [Home Tab] แคมเปญปัจจุบัน + prizes */
export const getCampaign = (): Promise<Campaign> =>
  get('/campaign.php')

/** [ทุกหน้า] Banner ตาม position (9 แบบ) */
export const getBanners = (pos: BannerPosition): Promise<{ banners: Banner[] }> =>
  get(`/banners.php?position=${pos}`)

/** [Scan Tab - Step 2] verify QR → Merchant info
 *  QR Code เก็บ phone ของร้านค้า */
export const getMerchantStatus = (phone: string): Promise<Merchant> =>
  get(`/merchant_status.php?phone=${encodeURIComponent(phone)}`)

/** [Scan Tab - Step 5] POST claim หลัง GPS ผ่าน
 *  PHP Logic:
 *   1. GPS radius ≤ 20m
 *   2. daily limit ≤ 3 ครั้ง/วัน
 *   3. ไม่เคยสแกนร้านนี้วันนี้
 *   4. ดึง DigitalTicket unclaimed (FIFO)
 *   5. set status → "activated" */
export const claim = (p: ClaimPayload): Promise<ClaimResult> =>
  post('/claim.php', p)

/** [Check Tab] โค้ดที่ลูกค้าสะสม ค้นด้วยเบอร์ */
export const getMyCodes = (phone: string): Promise<{ codes: CodeEntry[]; todayCount: number }> =>
  get(`/mycodes.php?phone=${encodeURIComponent(phone)}`)

/** [Map Tab] ร้านค้าทั้งหมด พร้อม lat/lng */
export const getMerchants = (): Promise<Merchant[]> =>
  get('/merchants.php')

/** [Map Tab] Live feed ← refresh ทุก 5 วิ */
export const getFeed = (limit = 10): Promise<FeedItem[]> =>
  get(`/feed.php?limit=${limit}`)

/** [Gallery Page] */
export const getGallery = (page = 1, filter?: string) =>
  get(`/gallery.php?page=${page}${filter ? `&filter=${filter}` : ''}`)

export const uploadGallery = (formData: FormData) =>
  fetch(`${PHP_API}/gallery.php`, { method: 'POST', body: formData }).then(r => r.json())


// ═══════════════════════════════════════════════════════
//  MERCHANT FLOW — /merchant/page.tsx (5 Tabs)
// ═══════════════════════════════════════════════════════

/** [Login] → approved|pending|rejected|not_found */
// ใช้ getMerchantStatus เดิม

/** [Register - Step 1] ส่ง OTP SMS (SMSMKT) */
export const sendOTP = (phone: string) =>
  post('/otp.php', { action: 'send', phone })

/** [Register - Step 2] verify OTP 6 หลัก */
export const verifyOTP = (phone: string, code: string) =>
  post('/otp.php', { action: 'verify', phone, code })

/** [Register - Step 4] สมัครร้านค้า */
export const registerMerchant = (p: RegisterPayload) =>
  post('/register.php', p)

/** [Merchant Home Tab] สถิติ 7 วัน */
export const getStats = (phone: string): Promise<StatsData> =>
  get(`/stats.php?phone=${encodeURIComponent(phone)}`)

/** [Merchant Receipt Tab] รายการใบเสร็จ */
export const getReceipts = (phone: string): Promise<{ receipts: Receipt[] }> =>
  get(`/receipts.php?phone=${encodeURIComponent(phone)}`)

/** [Merchant Receipt Tab] อัปโหลดใบเสร็จ
 *  multipart: phone, bagCount, image */
export const uploadReceipt = (fd: FormData) =>
  fetch(`${PHP_API}/receipts.php`, { method: 'POST', body: fd }).then(r => r.json())

/** [Merchant Profile Tab] แก้ข้อมูล + GPS */
export const updateMerchant = (data: Partial<Merchant>) =>
  patch('/update.php', data)


// ═══════════════════════════════════════════════════════
//  ADMIN MAP FLOW — /admin-map/page.tsx
//  ใช้ LINE Login (JWT เก็บใน localStorage)
// ═══════════════════════════════════════════════════════

/** [Login] ขอ LINE OAuth URL */
export const getAdminLineUrl = () =>
  post('/admin_map.php', { action: 'get_line_url' })

/** [LINE Callback] ?code=xxx → JWT */
export const verifyAdminLine = (code: string) =>
  post('/admin_map.php', { action: 'line_verify', code })

/** [Map Tab] ดึงร้านทั้งหมด + status */
export const getAdminOverview = (token: string) =>
  post('/admin_map.php', { action: 'get_overview', token })

/** [Map Tab - pin click] toggle active/inactive */
export const toggleMerchantActive = (token: string, merchantId: number) =>
  post('/admin_map.php', { action: 'toggle_active', token, merchantId })

/** [Map Tab] ตั้งสถานะร้าน */
export const setMerchantStatus = (token: string, merchantId: number, status: string) =>
  post('/admin_map.php', { action: 'set_status', token, merchantId, status })

/** [Map Tab] เพิ่ม quota ร้าน */
export const addMerchantQuota = (token: string, merchantId: number, amount: number) =>
  post('/admin_map.php', { action: 'add_quota', token, merchantId, amount })


// ═══════════════════════════════════════════════════════
//  ADMIN PANEL — Next.js API Routes → Prisma → DB1
//  หน้า: /admin/page.tsx
//  ทุก call ใช้ session cookie (httpOnly)
// ═══════════════════════════════════════════════════════

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`[Admin API] ${path} → ${res.status}`)
  return res.json()
}

// Auth
export const adminLogin  = (password: string) =>
  adminFetch('/auth', { method: 'POST', body: JSON.stringify({ password }) })
export const adminLogout = () => adminFetch('/auth', { method: 'DELETE' })
export const adminVerify = () => adminFetch('/auth')

// Banners (Prisma → DB1.Banner)
export const adminGetBanners   = () => adminFetch('/banners')
export const adminCreateBanner = (b: Partial<Banner>) =>
  adminFetch('/banners', { method: 'POST', body: JSON.stringify(b) })
export const adminUpdateBanner = (id: number, b: Partial<Banner>) =>
  adminFetch('/banners', { method: 'PATCH', body: JSON.stringify({ id, ...b }) })
export const adminDeleteBanner = (id: number) =>
  adminFetch('/banners', { method: 'DELETE', body: JSON.stringify({ id }) })

// Campaign (Prisma → DB1.Campaign + Prize)
export const adminGetCampaign    = () => adminFetch('/campaign')
export const adminUpdateCampaign = (data: Partial<Campaign>) =>
  adminFetch('/campaign', { method: 'PATCH', body: JSON.stringify(data) })

// Merchants (Prisma → DB1.Merchant)
export const adminGetMerchants          = () => adminFetch('/merchants')
export const adminUpdateMerchantStatus  = (id: number, status: string) =>
  adminFetch('/merchants', { method: 'PATCH', body: JSON.stringify({ id, status }) })

// Receipts (Prisma → DB1.Receipt)
export const adminGetReceipts    = (status?: string) =>
  adminFetch(`/receipts${status ? `?status=${status}` : ''}`)
export const adminApproveReceipt = (id: number) =>
  adminFetch('/receipts', { method: 'PATCH', body: JSON.stringify({ id, action: 'approve' }) })
export const adminRejectReceipt  = (id: number) =>
  adminFetch('/receipts', { method: 'PATCH', body: JSON.stringify({ id, action: 'reject' }) })

// KPI Stats (Prisma)
export const adminGetStats = () => adminFetch('/stats')

// Lucky Draw — Fisher-Yates (Prisma → DB1.CollectedCode)
export const adminRunLuckyDraw = (prizeId: number) =>
  adminFetch('/lucky-draw', { method: 'POST', body: JSON.stringify({ prizeId }) })

// Smart QR Rules (Prisma → DB1.QrRule)
// Types: time | day_of_week | scan_count | geo
export const adminGetQrRules   = () => adminFetch('/qr-rules')
export const adminCreateQrRule = (rule: object) =>
  adminFetch('/qr-rules', { method: 'POST', body: JSON.stringify(rule) })
export const adminUpdateQrRule = (id: number, rule: object) =>
  adminFetch('/qr-rules', { method: 'PATCH', body: JSON.stringify({ id, ...rule }) })
export const adminDeleteQrRule = (id: number) =>
  adminFetch('/qr-rules', { method: 'DELETE', body: JSON.stringify({ id }) })

// System Config (Prisma → DB1.SystemConfig key-value)
export const adminGetConfig = () => adminFetch('/system-config')
export const adminSetConfig = (key: string, value: string) =>
  adminFetch('/system-config', { method: 'PATCH', body: JSON.stringify({ key, value }) })

// Digital Tickets — Phase 3 Double Win (Prisma → DB1 + DB2)
export const adminGetTickets   = (filters?: object) =>
  adminFetch(`/tickets${filters ? '?' + new URLSearchParams(filters as any) : ''}`)
export const adminVerifyTicket = (code: string) =>
  adminFetch('/tickets', { method: 'PATCH', body: JSON.stringify({ code, action: 'verify' }) })
export const adminSetWinner    = (code: string) =>
  adminFetch('/tickets', { method: 'PATCH', body: JSON.stringify({ code, action: 'set_winner' }) })
