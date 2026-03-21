<?php
/**
 * stats.php
 * GET /hengheng/api/stats.php?phone=0812345678
 * สถิติการสแกน 7 วันล่าสุดสำหรับ merchant portal
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$phone = preg_replace('/\D/', '', $_GET['phone'] ?? '');
if (!$phone) json_err('ต้องระบุ phone', 400);

$merchant = db_row("SELECT id FROM Merchant WHERE phone = ?", [$phone]);
if (!$merchant) json_err('ไม่พบร้านค้า', 404);

$merchantId = $merchant['id'];
$todayStart = date('Y-m-d 00:00:00');

// ── สถิติรายวัน 7 วัน ──
$days = [];
for ($i = 6; $i >= 0; $i--) {
    $date  = date('Y-m-d', strtotime("-{$i} days"));
    $label = date('D', strtotime($date));
    $thDays = ['Mon'=>'จ','Tue'=>'อ','Wed'=>'พ','Thu'=>'พฤ','Fri'=>'ศ','Sat'=>'ส','Sun'=>'อา'];
    $days[] = ['date' => $date, 'label' => $thDays[$label] ?? $label];
}

$chartData = [];
foreach ($days as $d) {
    $count = (int)db_val(
        "SELECT COUNT(*) FROM DigitalTicket
         WHERE merchantId = ? AND status = 'activated'
           AND DATE(activatedAt) = ?",
        [$merchantId, $d['date']]
    );
    $chartData[] = ['date' => $d['date'], 'label' => $d['label'], 'count' => $count];
}

// ── รายการสแกนล่าสุด 10 รายการ ──
$recentScans = db_all(
    "SELECT dt.id, dt.ticketCode AS code, dt.customerName,
            dt.customerPhone, dt.activatedAt AS collectedAt,
            dt.isWinner, dt.claimStatus
     FROM DigitalTicket dt
     WHERE dt.merchantId = ? AND dt.status = 'activated'
     ORDER BY dt.activatedAt DESC LIMIT 10",
    [$merchantId]
);

// ── นับวันนี้ + ทั้งหมด ──
$todayCount = (int)db_val(
    "SELECT COUNT(*) FROM DigitalTicket
     WHERE merchantId = ? AND status = 'activated' AND activatedAt >= ?",
    [$merchantId, $todayStart]
);
$totalCount = (int)db_val(
    "SELECT COUNT(*) FROM DigitalTicket
     WHERE merchantId = ? AND status = 'activated'",
    [$merchantId]
);

json_ok([
    'dailyChart'  => $chartData,
    'recentScans' => array_map(fn($s) => [
        'id'           => (int)$s['id'],
        'code'         => $s['code'],
        'customerName' => $s['customerName'],
        'customerPhone'=> $s['customerPhone'],
        'collectedAt'  => $s['collectedAt'],
        'isWinner'     => (bool)$s['isWinner'],
        'claimStatus'  => $s['claimStatus'] ?? 'pending',
    ], $recentScans),
    'todayCount'  => $todayCount,
    'totalCount'  => $totalCount,
]);
