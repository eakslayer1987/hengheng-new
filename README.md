# เฮงเฮงปังจัง Lucky Draw — Project Documentation

## 📁 โครงสร้างไฟล์ที่แก้ใหม่

```
hengheng-clean/
├── package.json              ← dependencies ครบ (leaflet, bcryptjs, framer-motion ฯลฯ)
├── tsconfig.json             ← exclude prisma/seed.ts (ป้องกัน build error)
├── next.config.js            ← image domains config
├── .env.local                ← environment variables
│
├── src/
│   ├── lib/
│   │   └── php-api.ts        ← PHP API URL config
│   └── app/
│       ├── map/
│       │   ├── page.tsx      ← หน้าแผนที่ /map (5 tabs)
│       │   └── MapTab.tsx    ← Leaflet map component (client-only)
│       ├── gallery/
│       │   └── page.tsx      ← หน้า gallery + upload /gallery
│       ├── admin-map/
│       │   ├── page.tsx      ← Admin map + LINE login /admin-map
│       │   └── AdminMapLeaflet.tsx ← Admin map Leaflet component
│       └── admin/
│           └── banners/
│               └── page-fragment.tsx ← Banner management tab (สะอาด 100%)
│
├── php_upload/hengheng/
│   ├── api/
│   │   ├── merchants.php     ← GET: ร้านค้าทั้งหมด + QR stats
│   │   ├── merchant_status.php ← GET: ข้อมูลร้าน + receipts
│   │   ├── claim.php         ← POST: ลูกค้าสแกน QR รับฉลาก
│   │   ├── campaign.php      ← GET: แคมเปญปัจจุบัน + prizes
│   │   ├── mycodes.php       ← GET: โค้ดของลูกค้า (by phone)
│   │   ├── feed.php          ← GET: live feed สแกนล่าสุด
│   │   ├── gallery.php       ← GET/POST: คลังภาพร้านค้า
│   │   ├── otp.php           ← POST: send/verify OTP
│   │   ├── register.php      ← POST: สมัครร้านค้าใหม่
│   │   ├── receipts.php      ← GET/POST: ใบเสร็จ
│   │   ├── stats.php         ← GET: สถิติ merchant
│   │   ├── update.php        ← PATCH: อัปเดตข้อมูลร้าน
│   │   └── admin_map.php     ← POST: admin LINE login + map management
│   └── includes/
│       ├── db.php            ← (อยู่บน VPS แล้ว)
│       ├── auth.php          ← CORS headers + admin session
│       └── functions.php     ← haversine GPS, helpers
│
├── fix_systemconfig.sql      ← แก้ภาษามั่ว + reset ค่า default
└── create_gallery_admin_tables.sql ← สร้าง GalleryPhoto + AdminLineUser tables
```

---

## 🚀 วิธี Deploy

### ขั้น 1: วางไฟล์ Next.js

เอาโฟลเดอร์ `src/` และไฟล์ root ไปวางใน project บอส:
```
package.json      → root
tsconfig.json     → root
next.config.js    → root
.env.local        → root
src/lib/php-api.ts                        → เพิ่มใหม่
src/app/map/page.tsx                      → เพิ่มใหม่
src/app/map/MapTab.tsx                    → เพิ่มใหม่
src/app/gallery/page.tsx                  → เพิ่มใหม่
src/app/admin-map/page.tsx                → เพิ่มใหม่
src/app/admin-map/AdminMapLeaflet.tsx     → เพิ่มใหม่
src/app/admin/banners/page-fragment.tsx   → แทนอันเดิม
```

### ขั้น 2: Push ขึ้น Vercel
```bash
npm install
git add -A
git commit -m "feat: map, gallery, admin-map, clean banner fragment"
git push
```

### ขั้น 3: Vercel Environment Variables

ไปที่ Vercel → Project Settings → Environment Variables → Add:
```
NEXT_PUBLIC_PHP_API_URL = https://xn--72ca9ib1gc.xn--72cac8e8ec.com/hengheng/api
ADMIN_SECRET_PATH       = disabled_mg2026
```

### ขั้น 4: อัปโหลดไฟล์ PHP ขึ้น VPS

FileZilla → อัปโหลดโฟลเดอร์ `php_upload/hengheng/` ไปที่:
```
/var/www/html/hengheng/
```

แล้วรันบน VPS:
```bash
chown -R apache:apache /var/www/html/hengheng
systemctl restart httpd
```

### ขั้น 5: รัน SQL

```bash
# แก้ภาษามั่ว
mysql --default-character-set=utf8mb4 -u root -pNewRoot@2026\! xnca_hengheng_merchant \
  < fix_systemconfig.sql

# สร้าง tables ใหม่ (Gallery + AdminLineUser)
mysql --default-character-set=utf8mb4 -u root -pNewRoot@2026\! xnca_hengheng_merchant \
  < create_gallery_admin_tables.sql
```

---

## 🌐 URLs

| หน้า | URL |
|---|---|
| หน้าหลัก | https://xn--72ca9ib1gc.xn--72cac8e8ec.com |
| แผนที่ร้านค้า | /map |
| คลังภาพ | /gallery |
| Admin Map | /admin-map |
| Merchant Portal | /merchant |
| PHP Admin | /hengheng/admin/ |

---

## ⚠️ Build Errors ที่แก้แล้ว

| Error | สาเหตุ | แก้โดย |
|---|---|---|
| `Can't resolve 'leaflet'` | ไม่มีใน package.json | เพิ่ม leaflet + @types/leaflet |
| `Can't resolve 'bcryptjs'` | ไม่มีใน package.json | เพิ่ม bcryptjs + @types/bcryptjs |
| `Cannot find name 'BFORM0'` | ไม่ได้ declare | เพิ่ม const BFORM0 |
| `Cannot find name 'BTYPES'` | ไม่ได้ declare | เพิ่ม const BTYPES |
| `Cannot find name 'POSITIONS'` | ไม่ได้ declare | เพิ่ม const POSITIONS |
| `Cannot find name 'motion'` | ขาด framer-motion import | เพิ่ม import { motion } |
| `Cannot find name 'Loader2'` | ขาด lucide import | เพิ่ม import { Loader2 } |
| `Property 'blueLight' does not exist` | theme ไม่ครบ | เพิ่ม blueLight, redLight ฯลฯ |
| `Duplicate identifier 'useEffect'` | import ซ้ำ 2 ครั้ง | rebuild ไฟล์ใหม่จากศูนย์ |
| `export const DEFAULTS` is invalid | Next.js ไม่ allow | เปลี่ยนเป็น `const DEFAULTS` |
| `Type error: luckyCode` in seed.ts | schema ไม่มี model | exclude seed.ts ใน tsconfig.json |

---

## 📞 ข้อมูลสำคัญ

| Item | Value |
|---|---|
| VPS IP | 203.170.192.192 |
| SSH Port | 98 |
| PHP Admin URL | /hengheng/admin/ |
| Admin Login | admin / admin1234 |
| DB Name (PHP) | xnca_hengheng_merchant |
| DB Name (Next.js) | admin_xnca_fooddash |

---

## 🔧 LINE Admin Map Setup

1. สร้าง LINE Login Channel บน LINE Developers Console
2. เพิ่ม Callback URL: `https://xn--72ca9ib1gc.xn--72cac8e8ec.com/admin-map?callback=1`
3. ตั้งค่าใน SystemConfig:
```sql
UPDATE SystemConfig SET value='YOUR_LINE_CHANNEL_ID'     WHERE `key`='line_channel_id';
UPDATE SystemConfig SET value='YOUR_LINE_CHANNEL_SECRET' WHERE `key`='line_channel_secret';
UPDATE SystemConfig SET value='YOUR_LINE_USER_ID'        WHERE `key`='admin_line_ids';
```
