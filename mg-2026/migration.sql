-- ─── migration.sql ───────────────────────────────────────────────
-- รัน SQL นี้บน Hostneverdie phpMyAdmin หลังจากสร้าง DB แล้ว
-- ใช้สำหรับสร้าง tables ที่จำเป็น (ถ้า import dump มาแล้วข้ามได้)

-- Admin user (password: admin1234)
INSERT IGNORE INTO AdminUser (username, password, createdAt)
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW());
-- หมายเหตุ: password hash ด้านบนคือ "password" สำหรับ Laravel
-- ให้สร้าง hash ใหม่โดยรัน PHP นี้แล้วนำผลมาแทน:
-- <?php echo password_hash('admin1234', PASSWORD_BCRYPT); ?>

-- SystemConfig defaults
INSERT IGNORE INTO SystemConfig (`key`, value, label, updatedAt) VALUES
('daily_collect_limit', '3',     'สิทธิ์สะสม/วัน/คน',    NOW()),
('gps_radius_m',        '20',    'รัศมี GPS (เมตร)',       NOW()),
('registration_open',   'true',  'เปิดรับสมัครร้านค้าใหม่', NOW()),
('otp_expire_min',      '5',     'OTP หมดอายุ (นาที)',     NOW()),
('otp_cooldown_sec',    '60',    'OTP Cooldown (วินาที)',  NOW()),
('tickets_per_bag',     '20',    'ฉลากดิจิทัลต่อถุง',     NOW()),
('app_name',            'ปังจัง Lucky Draw', 'ชื่อแอป', NOW()),
('app_subtitle',        'ชิงโชคมูลค่ากว่า 1 ล้านบาท', 'คำโปรย', NOW()),
('scan_btn_text',       'สแกน QR รับโค้ดลุ้นโชค', 'ปุ่มสแกน', NOW()),
('nav_home',            'หน้าหลัก', 'เมนูหน้าหลัก', NOW()),
('nav_prizes',          'รางวัล',   'เมนูรางวัล',   NOW()),
('nav_scan',            'รหัสชิง',  'เมนูสแกน',     NOW()),
('nav_check',           'ตรวจสอบ',  'เมนูตรวจสอบ',  NOW()),
('nav_more',            'อื่นๆ',    'เมนูอื่นๆ',    NOW());
