<?php
/**
 * config.php — Database & App Configuration
 * VPS: /hengheng/config.php
 * 
 * IMPORTANT: DB_HOST ต้องเป็น 'localhost' บน Hostneverdie ห้ามใช้ external IP
 */

// Database
define('DB_HOST', 'localhost');
define('DB_NAME', 'admin_xnca_fooddash'); // เดียวกับ Prisma DATABASE_URL
define('DB_USER', 'admin_xnca');          // แก้ตามจริง
define('DB_PASS', '');                     // แก้ตามจริง

// App
define('APP_NAME', 'เฮงเฮง ปังจัง');
define('APP_URL', 'https://xn--72ca9ib1gc.xn--72cac8e8ec.com');
define('ADMIN_PASSWORD_HASH', '$2y$10$xxxx'); // bcrypt hash

// Campaign defaults
define('DAILY_SCAN_LIMIT', 3);
define('GPS_RADIUS_METERS', 20);
define('CODES_PER_BAG', 30);
