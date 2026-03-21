# 🐷 ปังจัง Super App v2.0

> Stack: **Next.js 14** + **Tailwind CSS** + **Prisma** + **PHP API**
> Design: Red Gold / Chinese Lucky Draw Theme

---

## 📦 Setup

```bash
# 1. Install
npm install

# 2. Copy env
cp .env.example .env.local
# แก้ค่าใน .env.local

# 3. Dev
npm run dev

# 4. Build
npm run build && npm start
```

---

## 🗂 Structure

```
src/
├── app/
│   ├── page.tsx              # Login (LINE OAuth)
│   ├── home/page.tsx         # Home — feed, stats, banners
│   ├── scan/page.tsx         # QR Scan → GPS → Claim
│   ├── rewards/page.tsx      # Prizes list
│   ├── map/page.tsx          # Merchant map (Leaflet)
│   ├── me/page.tsx           # Profile + my codes
│   ├── merchant/             # Merchant portal
│   │   ├── dashboard/
│   │   ├── qr/
│   │   ├── receipts/
│   │   └── profile/
│   ├── admin/page.tsx        # Admin panel
│   └── api/
│       ├── auth/line/        # → redirect LINE OAuth
│       └── auth/line-callback/ # ← receive code, set session
│
├── components/
│   ├── layout/BottomNav.tsx
│   ├── cards/BannerCarousel.tsx
│   ├── cards/StatCard.tsx
│   └── scanner/QRScanner.tsx (ใช้ jsQR)
│
├── lib/
│   ├── api.ts    # PHP API calls
│   ├── hooks.ts  # SWR hooks
│   └── utils.ts  # GPS, date, format
│
└── store/index.ts  # Zustand (user + app state)
```

---

## 🔌 PHP API Endpoints

| Endpoint | Method | หน้าที่ |
|---|---|---|
| `/campaign.php` | GET | ดึงแคมเปญปัจจุบัน |
| `/banners.php?position=xxx` | GET | ดึงแบนเนอร์ |
| `/claim.php` | POST | สแกน QR รับฉลาก |
| `/merchant_status.php?phone=` | GET | ข้อมูลร้านค้า |
| `/mycodes.php?phone=` | GET | ฉลากของลูกค้า |
| `/feed.php` | GET | Live feed |
| `/merchants.php` | GET | ร้านค้าทั้งหมด (map) |
| `/otp.php` | POST | send / verify OTP |
| `/register.php` | POST | สมัครร้านค้า |
| `/receipts.php` | GET/POST | ใบเสร็จร้านค้า |
| `/stats.php?phone=` | GET | สถิติ |

---

## 🎨 Design Tokens

```
bg:        #3D0008  (deep crimson)
card:      #6B0010  (card red)
gold.pale: #FBF0C8  (champagne)
gold.lt:   #F7D37A  (warm gold)
gold.mid:  #C9963A  (true gold)
gold.dk:   #8B6914  (antique gold)
```

---

## 🚀 Deploy (Vercel)

```bash
vercel --prod
```

ENV ที่ต้องตั้งใน Vercel Dashboard:
- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `LINE_CALLBACK_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_PHP_API_URL`
- `DATABASE_URL`

---

## 📋 TODO (หน้าที่เหลือ)

- [ ] `/rewards/page.tsx`
- [ ] `/map/page.tsx` (Leaflet + clustering)
- [ ] `/me/page.tsx`
- [ ] `/merchant/dashboard/page.tsx`
- [ ] `/merchant/qr/page.tsx`
- [ ] `/merchant/receipts/page.tsx`
- [ ] `/admin/page.tsx`
- [ ] `middleware.ts` (JWT guard)
- [ ] PWA manifest + service worker
