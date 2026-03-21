-- ================================================================
-- fix_systemconfig.sql
-- แก้ภาษามั่วใน SystemConfig + reset ค่า default ทั้งหมด
-- ใช้งาน:
--   mysql --default-character-set=utf8mb4 -u root -pNewRoot@2026\! xnca_hengheng_merchant < fix_systemconfig.sql
-- ================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection = utf8mb4;

-- ── ตรวจสอบ charset ของ table ──
ALTER TABLE SystemConfig CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── Reset ค่าทั้งหมดให้ถูกต้อง ──
INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('app_name',           'ปังจัง Lucky Draw',                                    'ชื่อแอป')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('app_subtitle',       'ชิงโชคมูลค่ากว่า 1 ล้านบาท',                           'คำโปรยแอป')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('daily_collect_limit','3',                                                    'สิทธิ์สะสม/วัน/คน')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('gps_radius_m',       '20',                                                   'รัศมี GPS (เมตร)')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('otp_expire_min',     '5',                                                    'OTP หมดอายุ (นาที)')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('otp_cooldown_sec',   '60',                                                   'OTP cooldown (วินาที)')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('tickets_per_bag',    '20',                                                   'ฉลากดิจิทัลต่อถุง')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('registration_open',  'true',                                                 'เปิดรับสมัครร้านค้า')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('daily_limit_title',  'เก็บโค้ดได้ 3 ครั้ง/วัน',                             'หัวข้อ daily limit')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('daily_limit_sub',    'สะสมได้จากร้านค้าพาร์ทเนอร์ต่างๆ รวมกัน ไม่เกิน 3 ครั้งต่อวัน', 'คำอธิบาย daily limit')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('scan_btn_text',      'สแกน QR รับโค้ดลุ้นโชค',                              'ข้อความปุ่ม scan')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('prize_section_title','🏆 รางวัลโชคใหญ่',                                     'หัวข้อส่วนรางวัล')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('nav_home',           'หน้าหลัก',                                             'เมนู: หน้าหลัก')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('nav_prizes',         'รางวัล',                                               'เมนู: รางวัล')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('nav_scan',           'รหัสชิง',                                              'เมนู: สแกน')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('nav_check',          'ตรวจสอบ',                                              'เมนู: ตรวจสอบ')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('nav_more',           'อื่นๆ',                                                'เมนู: อื่นๆ')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('hero_slides', '[{"emoji":"🎰","title":"ชิงโชคมูลค่า 2.4 ล้านบาท","sub":"สแกน QR ที่ร้านพาร์ทเนอร์"},{"emoji":"🏪","title":"ร้านค้าพาร์ทเนอร์","sub":"ยิ่งขายซอสหมีปรุง ยิ่งได้ QR"},{"emoji":"🎫","title":"สะสมโค้ด ลุ้นโชคใหญ่","sub":"เก็บโค้ดได้สูงสุด 3 ร้าน/วัน"}]', 'Hero slides (JSON)')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
('how_to_steps', '[{"n":1,"e":"🍽️","t":"ซื้อซอสหมีปรุงที่ร้านพาร์ทเนอร์","d":"ร้านที่มีป้าย Smart QR ปังจัง"},{"n":2,"e":"📍","t":"สแกน QR ในระยะ 20 เมตร","d":"ต้องอยู่ในร้านเท่านั้น เพื่อยืนยันตัวตน"},{"n":3,"e":"📝","t":"กรอกชื่อ+เบอร์ → รับโค้ดทันที","d":"1 ร้านได้ 1 โค้ด/วัน สูงสุด 3 ร้าน/วัน"},{"n":4,"e":"🎟️","t":"สะสมโค้ด → ลุ้นโชคใหญ่","d":"ยิ่งมีโค้ดมาก ยิ่งมีสิทธิ์มาก"}]', 'How-to steps (JSON)')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `label` = VALUES(`label`);

-- ── ตรวจสอบผล ──
SELECT `key`, LEFT(`value`, 60) AS value_preview FROM SystemConfig ORDER BY `key`;
