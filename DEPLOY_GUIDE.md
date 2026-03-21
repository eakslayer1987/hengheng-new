# 🚀 DEPLOY GUIDE — ปังจัง Lucky Draw v20

## ══════════════════════════════════════════════
## STEP 1: อัปเดตไฟล์ในเครื่อง
## ══════════════════════════════════════════════

### 1.1 ไฟล์ที่เปลี่ยนแปลง (v20 — Banner System)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `prisma/schema.prisma` | เพิ่ม model `Banner` |
| `src/app/api/banners/route.ts` | **ใหม่** — Public GET + track API |
| `src/app/api/admin/banners/route.ts` | **ใหม่** — Admin CRUD |
| `src/components/BannerSlot.tsx` | **ใหม่** — Component ทุก type |
| `src/app/admin/page.tsx` | เพิ่ม tab "แบนเนอร์" + BannersTab |
| `src/app/page.tsx` | เพิ่ม BannerSlot import |
| `src/app/merchant/page.tsx` | เพิ่ม BannerSlot import |
| `src/app/api/admin/config/route.ts` | **ใหม่** — SystemConfig API |
| `src/app/api/merchant/otp/route.ts` | **ใหม่** — OTP SMS |
| `src/app/api/merchant/line-callback/route.ts` | **ใหม่** — LINE LIFF |
| `src/lib/config.ts` | **ใหม่** — getConfig helper |

### 1.2 วิธี copy ไฟล์ทั้งหมดเข้าโปรเจค

```bash
# สมมติ project อยู่ที่ D:\foods\food-delivery\

# Windows (PowerShell) — copy จาก zip ที่ download มา
Expand-Archive pangjang_v20_banner.zip -DestinationPath "D:\foods\food-delivery\" -Force
```

## ══════════════════════════════════════════════
## STEP 2: อัปเดต Database
## ══════════════════════════════════════════════

```bash
# เข้าโฟลเดอร์โปรเจค
cd D:\foods\food-delivery

# push schema ใหม่ (สร้าง Banner + OtpCode + SystemConfig tables)
npx prisma db push
```

**ตรวจสอบว่า push สำเร็จ:**
```
✓ Generated Prisma Client
✓ The database is now in sync with the Prisma schema
```

**ถ้าเจอ error:**
```sql
-- รัน SQL นี้ใน phpMyAdmin ก่อน แล้ว push ใหม่
ALTER TABLE SpinResult MODIFY COLUMN quotaId INT NULL;
```

## ══════════════════════════════════════════════
## STEP 3: ตั้งค่า Environment Variables
## ══════════════════════════════════════════════

### 3.1 สร้างไฟล์ .env.local ในเครื่อง (dev)

```env
DATABASE_URL="mysql://xnca_hengheng_merchant:BntaXSk96yAkGEUmhA9T@203.170.192.192:3306/xnca_hengheng_merchant"
JWT_SECRET="pangjang-lucky-secret-2026-CHANGE-ME"
ADMIN_SECRET_PATH="mg2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# LINE LIFF (ตั้งทีหลัง)
LINE_CHANNEL_ID=""
LINE_CHANNEL_SECRET=""
LINE_LIFF_ID=""
NEXT_PUBLIC_LINE_LIFF_ID=""

# SMSMKT (ตั้งทีหลัง)
SMSMKT_API_KEY=""
SMSMKT_SECRET_KEY=""
```

> ⚠️ ไม่มี SMSMKT_API_KEY → OTP จะแสดงบนหน้าเว็บ (Dev mode) ใช้ test ได้

## ══════════════════════════════════════════════
## STEP 4: ทดสอบ Local ก่อน Deploy
## ══════════════════════════════════════════════

```bash
npm run dev
# เปิด http://localhost:3000
# ทดสอบ:
# ✓ /mg2026 — admin login (admin/password)
# ✓ tab แบนเนอร์ → สร้าง banner ทดสอบ
# ✓ /merchant — สมัครร้านค้า
# ✓ / — หน้า user
```

## ══════════════════════════════════════════════
## STEP 5: Deploy ขึ้น Vercel
## ══════════════════════════════════════════════

### 5.1 ติดตั้ง Vercel CLI (ครั้งแรกครั้งเดียว)

```bash
npm i -g vercel
vercel login
# เลือก Continue with GitHub / Email
```

### 5.2 Link โปรเจค (ครั้งแรกครั้งเดียว)

```bash
cd D:\foods\food-delivery
vercel link
# ? Set up and deploy "food-delivery"? → Y
# ? Which scope? → เลือก account ของคุณ
# ? Link to existing project? → N (ถ้ายังไม่มี) หรือ Y แล้วพิมพ์ชื่อ
# ? What's your project's name? → pangjang-lucky
# ? In which directory is your code located? → ./
```

### 5.3 ตั้งค่า Environment Variables บน Vercel

```bash
# ตั้งทีละตัว (หรือใช้วิธี 5.3b)
vercel env add DATABASE_URL production
# พิมพ์: mysql://xnca_hengheng_merchant:BntaXSk96yAkGEUmhA9T@203.170.192.192:3306/xnca_hengheng_merchant

vercel env add JWT_SECRET production
# พิมพ์: pangjang-lucky-secret-2026-CHANGE-ME

vercel env add ADMIN_SECRET_PATH production
# พิมพ์: mg2026

vercel env add NEXT_PUBLIC_APP_URL production
# พิมพ์: https://YOUR-PROJECT.vercel.app
# (เปลี่ยนเป็น domain จริงหลัง deploy ครั้งแรก)
```

**หรือ 5.3b: ใช้ Vercel Dashboard (ง่ายกว่า)**
1. เปิด https://vercel.com/dashboard
2. เลือกโปรเจค → Settings → Environment Variables
3. เพิ่มทุกตัวจาก .env.local (ยกเว้น NEXT_PUBLIC_APP_URL ใช้ URL จริง)

### 5.4 Deploy Production

```bash
vercel --prod
```

**ผลที่ได้:**
```
✓ Linked to your-account/pangjang-lucky
✓ Inspect: https://vercel.com/your-account/pangjang-lucky/xxxx
✓ Production: https://pangjang-lucky-xxxx.vercel.app [3s]
```

### 5.5 อัปเดต NEXT_PUBLIC_APP_URL

หลัง deploy ครั้งแรกแล้ว ได้ URL จริง → อัปเดต env:

```bash
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL production
# พิมพ์ URL จริง เช่น: https://pangjang-lucky.vercel.app

# Deploy ใหม่เพื่อให้ค่า env มีผล
vercel --prod
```

## ══════════════════════════════════════════════
## STEP 6: หลัง Deploy — ตั้งค่าเริ่มต้น
## ══════════════════════════════════════════════

### 6.1 สร้าง Admin User ใน DB

```sql
-- รันใน phpMyAdmin หรือ MySQL client
-- รหัสผ่าน "password" hash ด้วย bcrypt
INSERT INTO AdminUser (username, password, createdAt)
VALUES ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHG', NOW())
ON DUPLICATE KEY UPDATE id=id;
```

### 6.2 สร้าง Campaign แรก

เข้า `https://your-domain.vercel.app/mg2026`  
→ ตั้งค่า → สร้างแคมเปญ → กรอกชื่อ + วันหมดเขต + QR/ถุง

### 6.3 ทดสอบ Banner

Admin → แบนเนอร์ → สร้าง banner:
- Position: `user_topbar`
- Type: `announcement`  
- หัวข้อ: `🎉 โปรโมชั่นพิเศษ`
- เปิดใช้งาน: ✅
→ เปิด https://your-domain.vercel.app → เห็น banner ทันที

### 6.4 เพิ่ม BannerSlot ใน User Page (manual)

เปิด `src/app/page.tsx` หา section ที่ต้องการใส่ banner แล้วเพิ่ม:

```tsx
// Top bar (ใต้สุดของ header หรือบนสุดของ content)
<BannerSlot position="user_topbar" />

// Hero (ก่อน tab content)
<BannerSlot position="user_hero" />

// In-feed (ระหว่าง content ใน scroll)
<BannerSlot position="user_infeed" />

// Popup (วางไว้ที่ไหนก็ได้ เพราะ position: fixed)
<BannerSlot position="user_popup" />

// Sticky bar bottom (วางที่ไหนก็ได้)
<BannerSlot position="user_sticky" />
```

### 6.5 เพิ่ม BannerSlot ใน Merchant Page

เปิด `src/app/merchant/page.tsx` ใน tab="home" section:
```tsx
// ก่อน quota card
<BannerSlot position="merchant_hero" />

// ระหว่าง receipts list
<BannerSlot position="merchant_card" />
```

## ══════════════════════════════════════════════
## STEP 7: Deploy ครั้งต่อไป (update)
## ══════════════════════════════════════════════

```bash
# ทุกครั้งที่แก้ code:
vercel --prod

# หรือ push ขึ้น GitHub แล้วให้ Vercel auto-deploy
git add .
git commit -m "update: banner system"
git push origin main
```

## ══════════════════════════════════════════════
## TROUBLESHOOTING
## ══════════════════════════════════════════════

### DB Connection Error
```
Error: Can't reach database server
```
→ Hostneverdie VPS อาจ block connection จาก Vercel IP  
→ แก้: ใช้ PlanetScale / Railway / Neon แทน หรือ whitelist Vercel IPs ใน firewall

### Build Error: Module not found
```bash
npm install  # ติดตั้ง dependencies ใหม่
```

### Prisma Client Error after deploy
```bash
# เพิ่มใน package.json scripts:
"postinstall": "prisma generate"
```

### BannerSlot ไม่ขึ้น
- ตรวจสอบว่า banner `isActive: true`
- ตรวจสอบ `startsAt` / `endsAt` ว่าไม่หมดอายุ
- เปิด DevTools → Network → `/api/banners?position=...` ต้องได้ 200

