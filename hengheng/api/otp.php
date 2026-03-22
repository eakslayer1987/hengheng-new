<?php
/**
 * otp.php
 * POST /hengheng/api/otp.php
 * Body: { action: "send"|"verify", phone, code? }
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { json_err('Method not allowed', 405); }

$body   = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $body['action'] ?? '';
$phone  = preg_replace('/\D/', '', $body['phone'] ?? '');
$code   = trim($body['code'] ?? '');

if (!$phone) json_err('กรุณากรอกเบอร์โทร', 400);

$expireMin  = (int)(get_config('otp_expire_min')    ?: 5);
$cooldownSec= (int)(get_config('otp_cooldown_sec')  ?: 60);

// ── SEND ──
if ($action === 'send') {
    // เช็ค cooldown
    $last = db_row(
        "SELECT * FROM OtpCode WHERE phone = ? ORDER BY createdAt DESC LIMIT 1",
        [$phone]
    );
    if ($last) {
        $secondsAgo = time() - strtotime($last['createdAt']);
        if ($secondsAgo < $cooldownSec) {
            json_err("กรุณารอ " . ($cooldownSec - $secondsAgo) . " วินาทีก่อนขอ OTP ใหม่", 429);
        }
    }

    $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', time() + $expireMin * 60);

    // ลบ OTP เก่า
    db_run("DELETE FROM OtpCode WHERE phone = ?", [$phone]);

    db_run(
        "INSERT INTO OtpCode (phone, code, purpose, verified, expiresAt, createdAt)
         VALUES (?, ?, 'register', 0, ?, NOW())",
        [$phone, $otpCode, $expiresAt]
    );

    // ── ส่ง SMS ผ่าน SMSMKT ──
    $apiKey    = get_config('smsmkt_api_key')    ?: '';
    $apiSecret = get_config('smsmkt_api_secret') ?: '';
    $devMode   = !$apiKey; // dev mode ถ้าไม่มี key

    if (!$devMode) {
        $msg = "รหัส OTP ปังจัง Lucky Draw: {$otpCode} (หมดอายุใน {$expireMin} นาที)";
        $url = "https://portal.smsmkt.com/api/send-message";
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode([
                'api_key'    => $apiKey,
                'api_secret' => $apiSecret,
                'phone'      => $phone,
                'message'    => $msg,
                'sender_name'=> 'PangJang',
            ]),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 10,
        ]);
        curl_exec($ch);
        curl_close($ch);
    }

    $resp = ['sent' => true];
    if ($devMode) $resp['devOtp'] = $otpCode; // แสดงใน dev mode

    json_ok($resp);
}

// ── VERIFY ──
if ($action === 'verify') {
    if (strlen($code) !== 6) json_err('OTP ต้อง 6 หลัก', 400);

    $row = db_row(
        "SELECT * FROM OtpCode WHERE phone = ? AND code = ? AND verified = 0 ORDER BY createdAt DESC LIMIT 1",
        [$phone, $code]
    );

    if (!$row) json_err('OTP ไม่ถูกต้อง', 400);
    if (strtotime($row['expiresAt']) < time()) json_err('OTP หมดอายุ', 400);

    db_run("UPDATE OtpCode SET verified = 1 WHERE id = ?", [$row['id']]);
    json_ok(['verified' => true]);
}

json_err('action ไม่ถูกต้อง (send|verify)', 400);
