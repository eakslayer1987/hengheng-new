<?php
/**
 * mycodes.php
 * GET /hengheng/api/mycodes.php?phone=0812345678
 * ลูกค้าตรวจสอบโค้ดที่สะสม
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$phone = preg_replace('/\D/', '', $_GET['phone'] ?? '');
if (!$phone) {
    json_ok(['codes' => [], 'todayCount' => 0]);
}

$todayStart = date('Y-m-d 00:00:00');

// ดึงฉลากดิจิทัลที่ activated (เรียงใหม่สุดก่อน)
$tickets = db_all(
    "SELECT dt.id, dt.ticketCode AS code,
            m.name AS merchantName,
            c.name AS campaignName,
            dt.isWinner, dt.claimStatus, dt.activatedAt AS collectedAt
     FROM DigitalTicket dt
     JOIN Merchant m  ON m.id  = dt.merchantId
     JOIN Campaign c  ON c.id  = dt.campaignId
     WHERE dt.customerPhone = ? AND dt.status = 'activated'
     ORDER BY dt.activatedAt DESC
     LIMIT 50",
    [$phone]
);

$todayCount = (int)db_val(
    "SELECT COUNT(*) FROM DigitalTicket
     WHERE customerPhone = ? AND status = 'activated' AND activatedAt >= ?",
    [$phone, $todayStart]
);

json_ok([
    'codes' => array_map(fn($t) => [
        'id'           => (int)$t['id'],
        'code'         => $t['code'],
        'merchantName' => $t['merchantName'],
        'campaignName' => $t['campaignName'],
        'isWinner'     => (bool)$t['isWinner'],
        'claimStatus'  => $t['claimStatus'] ?? 'pending',
        'collectedAt'  => $t['collectedAt'],
    ], $tickets),
    'todayCount' => $todayCount,
]);
