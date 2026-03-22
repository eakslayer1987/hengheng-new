<?php
/**
 * feed.php
 * GET /hengheng/api/feed.php?limit=30
 * Recent scan activity for the live feed tab
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$limit = min(50, max(10, (int)($_GET['limit'] ?? 30)));

$items = db_all(
    "SELECT
       dt.id, dt.ticketCode AS code,
       dt.customerName, dt.customerPhone,
       dt.activatedAt AS collectedAt,
       dt.isWinner, dt.claimStatus,
       m.name  AS merchantName,
       m.id    AS merchantId,
       c.name  AS campaignName
     FROM DigitalTicket dt
     JOIN Merchant m ON m.id = dt.merchantId
     JOIN Campaign c ON c.id = dt.campaignId
     WHERE dt.status = 'activated'
     ORDER BY dt.activatedAt DESC
     LIMIT ?",
    [$limit]
);

function timeAgo(string $ts): string {
    $diff = time() - strtotime($ts);
    if ($diff < 60)   return 'เพิ่งสแกน';
    if ($diff < 3600) return round($diff/60).' นาทีที่แล้ว';
    if ($diff < 86400)return round($diff/3600).' ชม.ที่แล้ว';
    return round($diff/86400).' วันที่แล้ว';
}

function maskName(string $name): string {
    $parts = explode(' ', trim($name));
    if (count($parts) >= 2) {
        return $parts[0].' '.mb_substr($parts[1],0,1,'UTF-8').'.';
    }
    $len = mb_strlen($name,'UTF-8');
    return mb_substr($name,0,max(1,$len-2),'UTF-8').'**';
}

json_ok([
    'feed' => array_map(fn($i) => [
        'id'           => (int)$i['id'],
        'code'         => $i['code'],
        'customerName' => maskName($i['customerName']),
        'merchantName' => $i['merchantName'],
        'merchantId'   => (int)$i['merchantId'],
        'campaignName' => $i['campaignName'],
        'isWinner'     => (bool)$i['isWinner'],
        'claimStatus'  => $i['claimStatus'],
        'timeAgo'      => timeAgo($i['collectedAt']),
        'collectedAt'  => $i['collectedAt'],
    ], $items),
]);
