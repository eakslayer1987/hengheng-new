-- ================================================================
-- create_gallery_admin_tables.sql
-- เพิ่ม table GalleryPhoto และ AdminLineUser
-- mysql --default-character-set=utf8mb4 -u root -pNewRoot@2026\! xnca_hengheng_merchant < create_gallery_admin_tables.sql
-- ================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ── GalleryPhoto ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS GalleryPhoto (
  id           INT          NOT NULL AUTO_INCREMENT,
  merchantId   INT          NOT NULL,
  imageUrl     VARCHAR(500) NOT NULL,
  qrStatus     ENUM('available','empty') NOT NULL DEFAULT 'available',
  hasWinner    TINYINT(1)   NOT NULL DEFAULT 0,
  caption      VARCHAR(200) NULL,
  reporterName VARCHAR(60)  NOT NULL DEFAULT 'ผู้ใช้',
  createdAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_merchant (merchantId),
  INDEX idx_created  (createdAt),
  INDEX idx_status   (qrStatus),
  CONSTRAINT fk_gallery_merchant FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── AdminLineUser ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS AdminLineUser (
  id          INT          NOT NULL AUTO_INCREMENT,
  lineUserId  VARCHAR(100) NOT NULL UNIQUE,
  displayName VARCHAR(255) NOT NULL,
  avatarUrl   VARCHAR(500) NULL,
  role        ENUM('superadmin','admin','viewer') NOT NULL DEFAULT 'admin',
  isActive    TINYINT(1)   NOT NULL DEFAULT 1,
  createdAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastLoginAt DATETIME     NULL,
  PRIMARY KEY (id),
  INDEX idx_line (lineUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── SystemConfig สำหรับ admin map ──
INSERT INTO SystemConfig (`key`, `value`, `label`) VALUES
  ('line_channel_id',     '',             'LINE Channel ID สำหรับ admin'),
  ('line_channel_secret', '',             'LINE Channel Secret สำหรับ admin'),
  ('admin_jwt_secret',    'hengheng-admin-secret-2026-change-this!', 'JWT Secret สำหรับ admin session'),
  ('admin_line_ids',      '',             'LINE User IDs ที่เป็น admin (คั่นด้วย , )'),
  ('app_url',             'https://xn--72ca9ib1gc.xn--72cac8e8ec.com', 'URL หลักของแอป')
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`);

SELECT 'Tables created!' AS result;
SELECT table_name FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN ('GalleryPhoto','AdminLineUser');
