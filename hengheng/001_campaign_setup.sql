-- ═══════════════════════════════════════════════════════════════
--  เฮงเฮง ปังจัง Lucky Draw — Campaign & Prize Setup
--  Run on: admin_xnca_fooddash (MariaDB)
--  VPS: 203.170.192.192
-- ═══════════════════════════════════════════════════════════════

-- ── Campaign Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    start_date      DATETIME NOT NULL,
    end_date        DATETIME NOT NULL,
    total_prize_value BIGINT NOT NULL DEFAULT 0,
    status          ENUM('draft','active','ended') NOT NULL DEFAULT 'draft',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Prizes Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prizes (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id     INT UNSIGNED NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    probability     DECIMAL(6,2) NOT NULL DEFAULT 0,     -- % chance
    quantity        INT NOT NULL DEFAULT 0,               -- จำนวนรางวัลทั้งหมด
    claimed         INT NOT NULL DEFAULT 0,               -- จำนวนที่แจกไปแล้ว
    value_per_unit  INT NOT NULL DEFAULT 0,               -- มูลค่าต่อชิ้น (บาท)
    required_points INT NOT NULL DEFAULT 0,
    image_url       VARCHAR(500),
    tier            ENUM('grand','gold','silver','bronze','common') NOT NULL DEFAULT 'common',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Banners Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type            ENUM('announcement','image','card','sticky','popup','interstitial') NOT NULL DEFAULT 'announcement',
    title           VARCHAR(200) NOT NULL,
    body            TEXT,
    image_url       VARCHAR(500),
    bg_color        VARCHAR(20) DEFAULT '#3a0010',
    link_url        VARCHAR(500),
    position        VARCHAR(30) NOT NULL DEFAULT 'user_hero',
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_position (position, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Users Table (LINE login) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    line_id         VARCHAR(64) UNIQUE,
    display_name    VARCHAR(200),
    picture_url     VARCHAR(500),
    phone           VARCHAR(20) UNIQUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_line_id (line_id),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Merchants Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchants (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    owner_name      VARCHAR(200),
    phone           VARCHAR(20) NOT NULL UNIQUE,
    address         TEXT,
    lat             DECIMAL(10,7),
    lng             DECIMAL(10,7),
    status          ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
    quota           INT NOT NULL DEFAULT 100,
    today_scans     INT NOT NULL DEFAULT 0,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Digital Tickets (ฉลากลุ้นโชค) ─────────────────────────────
CREATE TABLE IF NOT EXISTS digital_tickets (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(10) NOT NULL UNIQUE,
    merchant_id     INT UNSIGNED,
    customer_phone  VARCHAR(20),
    status          ENUM('unclaimed','activated','used','expired','winner') NOT NULL DEFAULT 'unclaimed',
    activated_at    DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_customer (customer_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Scan Logs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_logs (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    merchant_id     INT UNSIGNED,
    customer_phone  VARCHAR(20),
    ticket_id       INT UNSIGNED,
    lat             DECIMAL(10,7),
    lng             DECIMAL(10,7),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
    FOREIGN KEY (ticket_id) REFERENCES digital_tickets(id) ON DELETE SET NULL,
    INDEX idx_date (created_at),
    INDEX idx_merchant (merchant_id),
    INDEX idx_customer_date (customer_phone, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Receipts (ใบเสร็จอัปโหลด) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    merchant_id     INT UNSIGNED,
    phone           VARCHAR(20) NOT NULL,
    bag_count       INT NOT NULL DEFAULT 1,
    image_url       VARCHAR(500),
    status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    reviewed_at     DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Lucky Draw Results ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lucky_draw_results (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id     INT UNSIGNED NOT NULL,
    prize_id        INT UNSIGNED NOT NULL,
    ticket_code     VARCHAR(10) NOT NULL,
    customer_phone  VARCHAR(20),
    customer_name   VARCHAR(200),
    drawn_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed         TINYINT(1) NOT NULL DEFAULT 0,
    claimed_at      DATETIME,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (prize_id) REFERENCES prizes(id),
    INDEX idx_campaign (campaign_id),
    INDEX idx_ticket (ticket_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ═══════════════════════════════════════════════════════════════
--  SEED DATA — Campaign ตาม Poster หมีปรุง
-- ═══════════════════════════════════════════════════════════════

-- Campaign: ลูกค้าเฮง ร้านค้าเฮ หมีปรุงเปย์
INSERT INTO campaigns (name, description, start_date, end_date, total_prize_value, status)
VALUES (
    'ลูกค้าเฮง ร้านค้าเฮ หมีปรุงเปย์',
    'ลุ้นรวย แบบดับเบิ้ล — สแกน QR ที่ร้านค้าหมีปรุง ลุ้นรางวัลรวมมูลค่า 2,400,000 บาท',
    '2026-01-01 00:00:00',
    '2026-12-31 23:59:59',
    2400000,
    'active'
);

SET @campaign_id = LAST_INSERT_ID();

-- Prizes: ตาม Poster (ทอง + ซอสหมีปรุง + คูปอง + Lucky Ticket)
INSERT INTO prizes (campaign_id, name, description, probability, quantity, value_per_unit, tier, image_url) VALUES
(@campaign_id, 'ทองคำ 10 บาท',           'ทองคำแท่ง 10 บาท — รางวัลใหญ่สุด',                1.00,    1,  430000, 'grand',  NULL),
(@campaign_id, 'ทองคำ 5 บาท',            'ทองคำแท่ง 5 บาท',                                 2.00,    2,  215000, 'grand',  NULL),
(@campaign_id, 'ทองคำ 1 บาท',            'ทองคำแท่ง 1 บาท',                                 3.00,   10,   43000, 'gold',   NULL),
(@campaign_id, 'ทองคำ 1 สลึง',           'ทองคำแท่ง 1 สลึง',                                4.00,   20,   10750, 'gold',   NULL),
(@campaign_id, 'หมีปรุง เปย์แพคเค่จ์',     'เซ็ตซอสหมีปรุง ครบชุด 5 ขวด',                     10.00,  100,    500, 'silver', NULL),
(@campaign_id, 'คูปองส่วนลด 200 บาท',    'คูปองส่วนลดซื้อสินค้า ปังจัง.com',                  15.00,  500,    200, 'bronze', NULL),
(@campaign_id, 'คูปองส่วนลด 100 บาท',    'คูปองส่วนลดซื้อสินค้า ปังจัง.com',                  15.00, 1000,    100, 'bronze', NULL),
(@campaign_id, 'Lucky Ticket ลุ้นรอบใหญ่', 'ฉลากลุ้นโชค เข้ารอบจับรางวัลทองคำวันสุดท้าย',       50.00, 9999,      0, 'common', NULL);


-- Default banners
INSERT INTO banners (type, title, body, bg_color, position, sort_order, is_active) VALUES
('announcement', 'ลุ้นทองล้านบาท!',         'สแกน QR ครบ 5 ร้าน รับสิทธิ์ทันที',              '#4a1500', 'user_hero', 1, 1),
('announcement', 'Double Win!',              'ฉลากคู่ โอกาสชนะคูณสอง ทั้งลูกค้าและร้านค้า',     '#1a0040', 'user_hero', 2, 1),
('announcement', 'หมีปรุง เปย์แพคเค่จ์',     'ร้านเข้า ลูกค้าลุ้น ซอสหมีปรุงฟรี!',              '#002a1a', 'user_hero', 3, 1),
('announcement', 'ลูกค้าเฮง ร้านค้าเฮ',      'สะสมฉลากลุ้นโชค รวมมูลค่า 2,400,000 บาท',       '#3a0010', 'user_hero', 4, 1);


-- ═══════════════════════════════════════════════════════════════
--  VERIFICATION
-- ═══════════════════════════════════════════════════════════════
SELECT 'Campaigns:' as info, COUNT(*) as count FROM campaigns;
SELECT 'Prizes:' as info, COUNT(*) as count FROM prizes;
SELECT 'Banners:' as info, COUNT(*) as count FROM banners;
SELECT 'Total prize value check:' as info, SUM(quantity * value_per_unit) as calculated_total FROM prizes WHERE campaign_id = @campaign_id;
