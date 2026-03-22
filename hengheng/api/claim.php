<?php
/**
 * claim.php  — Phase 2: ลูกค้าสแกน QR รับฉลากดิจิทัล
 * POST /hengheng/api/claim.php
 * Body JSON: { merchantPhone, customerName, customerPhone, customerLat?, customerLng? }
 * Response:  { ticketCode, merchantName, campaignName, todayUsed, dailyLimit, remainingToday }
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { json_err('Method not allowed', 405); }

$body = json_decode(file_get_contents('php://input'), true) ?: [];

$merchantPhone  = trim($body['merchantPhone']  ?? '');
$customerName   = trim($body['customerName']   ?? '');
$customerPhone  = preg_replace('/\D/', '', $body['customerPhone'] ?? '');
$customerLat    = isset($body['customerLat'])  ? (float)$body['customerLat']  : null;
$customerLng    = isset($body['customerLng'])  ? (float)$body['customerLng']  : null;

if (!$merchantPhone || !$customerName || !$customerPhone) {
    json_err('กรุณากรอกข้อมูลให้ครบ', 400);
}
if (strlen($customerPhone) < 9) {
    json_err('เบอร์โทรลูกค้าไม่ถูกต้อง', 400);
}

// ─── Config ───
$dailyLimit = (int)(get_config('daily_collect_limit') ?: 3);
$gpsRadius  = (int)(get_config('gps_radius_m')       ?: 20);

// ─── หา merchant ───
$merchant = db_row("SELECT * FROM Merchant WHERE phone = ?", [$merchantPhone]);
if (!$merchant)                         json_err('ไม่พบร้านค้า', 404);
if ($merchant['status'] !== 'approved') json_err('ร้านค้านี้ยังไม่ได้รับการอนุมัติ', 403);
if (!$merchant['isActive'])             json_err('ร้านค้าถูกระงับชั่วคราว', 403);

// ─── GPS check ───
if ($merchant['lat'] && $merchant['lng']) {
    if ($customerLat === null || $customerLng === null) {
        json_err('ต้องเปิด GPS เพื่อยืนยันตำแหน่ง', 400);
    }
    $dist = haversine_m((float)$merchant['lat'], (float)$merchant['lng'], $customerLat, $customerLng);
    if ($dist > $gpsRadius) {
        http_response_code(403);
        echo json_encode([
            'error'       => "คุณอยู่ห่างร้าน " . round($dist) . " เมตร — ต้องอยู่ในระยะ {$gpsRadius} เมตร",
            'distance'    => round($dist),
            'maxDistance' => $gpsRadius,
        ]);
        exit;
    }
}

// ─── ตรวจสอบ daily limit ───
$todayStart = date('Y-m-d 00:00:00');

$alreadyShop = db_val(
    "SELECT COUNT(*) FROM DigitalTicket
     WHERE merchantId = ? AND customerPhone = ? AND activatedAt >= ?",
    [$merchant['id'], $customerPhone, $todayStart]
);
if ($alreadyShop > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'คุณเก็บโค้ดจากร้านนี้แล้ววันนี้ มาใหม่พรุ่งนี้ 🌟', 'alreadyCollected' => true]);
    exit;
}

$todayTotal = (int)db_val(
    "SELECT COUNT(*) FROM DigitalTicket
     WHERE customerPhone = ? AND activatedAt >= ?",
    [$customerPhone, $todayStart]
);
if ($todayTotal >= $dailyLimit) {
    http_response_code(429);
    echo json_encode([
        'error'      => "คุณเก็บโค้ดครบ {$dailyLimit} ครั้งแล้ววันนี้ มาใหม่พรุ่งนี้ 🌟",
        'todayUsed'  => $todayTotal,
        'dailyLimit' => $dailyLimit,
    ]);
    exit;
}

// ─── หา active campaign ───
$campaign = db_row(
    "SELECT * FROM Campaign WHERE isActive = 1 AND startDate <= NOW() AND endDate >= NOW() ORDER BY createdAt DESC LIMIT 1"
);
if (!$campaign) json_err('ขณะนี้ยังไม่มีแคมเปญที่เปิดอยู่', 400);

// ─── ดึง DigitalTicket ที่ยัง unclaimed (FIFO) ───
$ticket = db_row(
    "SELECT dt.* FROM DigitalTicket dt
     JOIN MerchantQuota mq ON mq.id = dt.quotaId
     WHERE dt.merchantId = ? AND dt.status = 'unclaimed' AND mq.campaignId = ?
     ORDER BY dt.id ASC LIMIT 1",
    [$merchant['id'], $campaign['id']]
);
if (!$ticket) json_err('โควต้า QR ของร้านนี้หมดแล้ว กรุณาติดต่อร้านค้า', 400);

// ─── Activate ticket ───
db_run(
    "UPDATE DigitalTicket
     SET status = 'activated', customerName = ?, customerPhone = ?,
         customerLat = ?, customerLng = ?, activatedAt = NOW()
     WHERE id = ?",
    [
        substr($customerName, 0, 100),
        $customerPhone,
        $customerLat,
        $customerLng,
        $ticket['id'],
    ]
);

// ─── Log ใน CollectedCode (สำหรับ customer check tab) ───
try {
    db_run(
        "INSERT INTO CollectedCode (code, campaignId, merchantId, customerPhone, customerName, collectedAt)
         VALUES (?, ?, ?, ?, ?, NOW())",
        [$ticket['ticketCode'], $campaign['id'], $merchant['id'], $customerPhone, substr($customerName, 0, 100)]
    );
} catch (Exception $e) {
    // ถ้า CollectedCode ไม่มีอยู่ให้ ignore
}

json_ok([
    'ticketCode'     => $ticket['ticketCode'],  // ← ชื่อ field ตาม PHP schema
    'code'           => $ticket['ticketCode'],  // ← alias สำหรับ Next.js ที่อ่าน 'code'
    'merchantName'   => $merchant['name'],
    'campaignName'   => $campaign['name'],
    'campaignEndDate'=> $campaign['endDate'],
    'todayUsed'      => $todayTotal + 1,
    'dailyLimit'     => $dailyLimit,
    'remainingToday' => $dailyLimit - $todayTotal - 1,
]);
