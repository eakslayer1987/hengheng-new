<?php
/**
 * merchants.php
 * GET /hengheng/api/merchants.php
 * Returns all approved merchants with location + QR quota stats
 * Used by: Next.js /map page
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$todayStart = date('Y-m-d 00:00:00');

$merchants = db_all(
    "SELECT
       m.id, m.name, m.address, m.lat, m.lng, m.phone,
       COALESCE(SUM(mq.totalCodes), 0)  AS totalQr,
       COALESCE(SUM(mq.usedCodes), 0)   AS usedQr,
       (SELECT COUNT(*) FROM DigitalTicket dt
        WHERE dt.merchantId = m.id AND dt.status = 'activated'
          AND dt.activatedAt >= ?) AS todayScans,
       (SELECT COUNT(*) FROM DigitalTicket dt2
        WHERE dt2.merchantId = m.id AND dt2.isWinner = 1) AS winnerCount,
       m.createdAt
     FROM Merchant m
     LEFT JOIN MerchantQuota mq ON mq.merchantId = m.id AND mq.isActive = 1
     WHERE m.status = 'approved' AND m.isActive = 1
       AND m.lat IS NOT NULL AND m.lng IS NOT NULL
     GROUP BY m.id
     ORDER BY m.name ASC",
    [$todayStart]
);

$result = array_map(function($m) {
    $total     = (int)$m['totalQr'];
    $used      = (int)$m['usedQr'];
    $remaining = max(0, $total - $used);
    return [
        'id'          => (int)$m['id'],
        'name'        => $m['name'],
        'address'     => $m['address'] ?? '',
        'lat'         => (float)$m['lat'],
        'lng'         => (float)$m['lng'],
        'phone'       => $m['phone'],
        'qrTotal'     => $total,
        'qrUsed'      => $used,
        'qrRemaining' => $remaining,
        'hasQr'       => $remaining > 0,
        'todayScans'  => (int)$m['todayScans'],
        'hasWinner'   => (int)$m['winnerCount'] > 0,
    ];
}, $merchants);

// ── summary stats ──
$totalMerchants = count($result);
$openMerchants  = count(array_filter($result, fn($m) => $m['hasQr']));
$todayTotal     = array_sum(array_column($result, 'todayScans'));

json_ok([
    'merchants' => $result,
    'stats' => [
        'total'      => $totalMerchants,
        'withQr'     => $openMerchants,
        'todayScans' => $todayTotal,
    ],
]);
