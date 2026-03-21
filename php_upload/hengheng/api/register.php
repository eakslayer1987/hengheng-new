<?php
/**
 * register.php
 * POST /hengheng/api/register.php
 * Body: { name, ownerName, address, lat, lng, phone, otpVerified }
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { json_err('Method not allowed', 405); }

$body      = json_decode(file_get_contents('php://input'), true) ?: [];
$name      = trim($body['name']      ?? '');
$ownerName = trim($body['ownerName'] ?? '');
$address   = trim($body['address']   ?? '');
$lat       = isset($body['lat']) ? (float)$body['lat'] : null;
$lng       = isset($body['lng']) ? (float)$body['lng'] : null;
$phone     = preg_replace('/\D/', '', $body['phone'] ?? '');
$otpVerified = !empty($body['otpVerified']);

// LINE auth (optional)
$lineUserId      = trim($body['lineUserId']      ?? '');
$lineDisplayName = trim($body['lineDisplayName'] ?? '');
$lineAvatarUrl   = trim($body['lineAvatarUrl']   ?? '');

if (!$name)      json_err('กรุณากรอกชื่อร้านค้า', 400);
if (!$ownerName) json_err('กรุณากรอกชื่อเจ้าของ', 400);
if (!$address)   json_err('กรุณากรอกที่อยู่ร้าน', 400);
if (!$lat || !$lng) json_err('กรุณาบันทึกตำแหน่ง GPS ก่อนสมัคร', 400);

// ต้องยืนยัน OTP หรือมี LINE
if (!$otpVerified && !$lineUserId) {
    json_err('กรุณายืนยัน OTP ก่อนสมัคร', 400);
}

// เช็คว่า phone ซ้ำไหม
if ($phone) {
    $existing = db_val("SELECT id FROM Merchant WHERE phone = ?", [$phone]);
    if ($existing) {
        // ถ้าซ้ำ → return ค่าเดิม (idempotent)
        $m = db_row("SELECT * FROM Merchant WHERE phone = ?", [$phone]);
        json_ok(['merchant' => $m]);
    }
}

// ตรวจ registration_open
$regOpen = get_config('registration_open');
if ($regOpen === 'false') {
    json_err('ขณะนี้ปิดรับสมัครร้านค้าชั่วคราว', 403);
}

db_run(
    "INSERT INTO Merchant (name, ownerName, phone, lineUserId, lineDisplayName, lineAvatarUrl,
                           address, lat, lng, status, isActive, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, NOW())",
    [
        substr($name, 0, 255),
        substr($ownerName, 0, 255),
        $phone ?: null,
        $lineUserId ?: null,
        $lineDisplayName ?: null,
        $lineAvatarUrl ?: null,
        substr($address, 0, 1000),
        $lat,
        $lng,
    ]
);

$merchant = db_row("SELECT * FROM Merchant WHERE id = ?", [last_id()]);
unset($merchant['lineUserId']); // ซ่อน sensitive data

json_ok(['merchant' => $merchant]);
