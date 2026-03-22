<?php
/**
 * merchant_status.php
 * GET /hengheng/api/merchant_status.php?phone=0812345678
 * 
 * ส่งกลับ: merchant info + quota + receipts (recent 10)
 * ใช้โดย: Next.js merchant portal + scan flow
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { json_err('Method not allowed', 405); }

$phone      = trim($_GET['phone']      ?? '');
$lineUserId = trim($_GET['lineUserId'] ?? '');

if (!$phone && !$lineUserId) {
    json_err('ต้องระบุ phone หรือ lineUserId', 400);
}

// ─── หา merchant ───
if ($phone) {
    $merchant = db_row("SELECT * FROM Merchant WHERE phone = ?", [$phone]);
} else {
    $merchant = db_row("SELECT * FROM Merchant WHERE lineUserId = ?", [$lineUserId]);
}

if (!$merchant) {
    json_ok(['merchant' => null]);
}

// ─── ตรวจ status ───
if ($merchant['status'] === 'pending') {
    http_response_code(403);
    echo json_encode(['status' => 'pending', 'error' => 'รอการอนุมัติ']);
    exit;
}
if ($merchant['status'] === 'rejected') {
    http_response_code(403);
    echo json_encode(['status' => 'rejected', 'error' => 'ไม่ได้รับการอนุมัติ']);
    exit;
}

// ─── Quota ───
$quotas = db_all(
    "SELECT mq.*, c.name AS campaignName, c.endDate
     FROM MerchantQuota mq
     JOIN Campaign c ON c.id = mq.campaignId
     WHERE mq.merchantId = ? AND mq.isActive = 1
     ORDER BY mq.createdAt DESC",
    [$merchant['id']]
);
$totalQuota     = array_sum(array_column($quotas, 'totalCodes'));
$usedQuota      = array_sum(array_column($quotas, 'usedCodes'));
$remainingQuota = $totalQuota - $usedQuota;

// ─── Receipts (recent 10) ───
$receipts = db_all(
    "SELECT r.id, r.bagCount, r.status, r.submittedAt,
            mq.totalCodes, mq.usedCodes
     FROM Receipt r
     LEFT JOIN MerchantQuota mq ON mq.receiptId = r.id
     WHERE r.merchantId = ?
     ORDER BY r.submittedAt DESC
     LIMIT 10",
    [$merchant['id']]
);
$receiptsFormatted = array_map(function($r) {
    return [
        'id'          => (int)$r['id'],
        'bagCount'    => (int)$r['bagCount'],
        'status'      => $r['status'],
        'submittedAt' => $r['submittedAt'],
        'quota'       => $r['totalCodes'] ? [
            'totalCodes' => (int)$r['totalCodes'],
            'usedCodes'  => (int)$r['usedCodes'],
        ] : null,
    ];
}, $receipts);

// ─── ลบข้อมูล sensitive ──
unset($merchant['lineUserId']);

json_ok([
    'merchant' => array_merge($merchant, [
        'lat' => $merchant['lat'] ? (float)$merchant['lat'] : null,
        'lng' => $merchant['lng'] ? (float)$merchant['lng'] : null,
        'totalQuota'     => $totalQuota,
        'usedQuota'      => $usedQuota,
        'remainingQuota' => $remainingQuota,
    ]),
    'quota' => [
        'total'     => $totalQuota,
        'used'      => $usedQuota,
        'remaining' => $remainingQuota,
    ],
    'receipts' => $receiptsFormatted,
]);
