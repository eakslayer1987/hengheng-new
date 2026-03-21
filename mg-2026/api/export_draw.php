<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
cors_headers();
require_admin_api();

$campaign_id = get('campaignId', '');
$from        = get('from', '');
$to          = get('to', '');

$where_parts = ["t.status='activated'"];
$params = [];
if ($campaign_id) { $where_parts[] = "t.campaignId=?"; $params[] = (int)$campaign_id; }
if ($from)        { $where_parts[] = "t.activatedAt>=?"; $params[] = $from . ' 00:00:00'; }
if ($to)          { $where_parts[] = "t.activatedAt<=?"; $params[] = $to . ' 23:59:59'; }

$where = implode(' AND ', $where_parts);

$tickets = db_all("
    SELECT t.ticketCode, m.name as merchant_name, m.phone as merchant_phone,
           t.customerName, t.customerPhone, t.activatedAt
    FROM DigitalTicket t
    JOIN Merchant m ON m.id=t.merchantId
    WHERE $where
    ORDER BY t.activatedAt ASC
", $params);

if (empty($tickets)) {
    if (str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'text/html')) {
        echo '<p style="font-family:sans-serif;color:#E53E3E;padding:20px">❌ ไม่มีฉลากที่ Activated ในช่วงเวลานี้</p>';
    } else {
        json_err('ไม่มีฉลากที่ Activated ในช่วงเวลานี้', 404);
    }
    exit;
}

$period   = ($from && $to) ? "{$from}_{$to}" : 'all';
$filename = "draw_{$period}_" . count($tickets) . "tickets.csv";

header('Content-Type: text/csv; charset=utf-8');
header("Content-Disposition: attachment; filename=\"{$filename}\"");
echo "\xEF\xBB\xBF"; // BOM for Excel Thai

$out = fopen('php://output', 'w');
fputcsv($out, ['ลำดับ','รหัสฉลาก','ร้านค้า','เบอร์ร้าน','ชื่อลูกค้า','เบอร์ลูกค้า','วันที่รับ']);
foreach ($tickets as $i => $t) {
    fputcsv($out, [
        $i + 1,
        $t['ticketCode'],
        $t['merchant_name'],
        $t['merchant_phone'],
        $t['customerName'],
        $t['customerPhone'],
        $t['activatedAt'] ? date('d/m/Y H:i', strtotime($t['activatedAt'])) : '',
    ]);
}
fclose($out);
