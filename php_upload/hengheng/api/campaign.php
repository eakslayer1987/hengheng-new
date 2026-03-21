<?php
/**
 * campaign.php
 * GET /hengheng/api/campaign.php
 * Returns the current active campaign with prizes
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$campaign = db_row(
    "SELECT * FROM Campaign WHERE isActive = 1 AND endDate >= NOW() ORDER BY createdAt DESC LIMIT 1"
);

if (!$campaign) {
    json_ok(['campaign' => null]);
}

$prizes = db_all(
    "SELECT id, name, value, quantity, remaining, sortOrder
     FROM Prize WHERE campaignId = ? ORDER BY sortOrder ASC",
    [$campaign['id']]
);

$totalCollected = (int)db_val(
    "SELECT COUNT(*) FROM DigitalTicket WHERE status = 'activated'",
    []
);

json_ok([
    'campaign' => [
        'id'             => (int)$campaign['id'],
        'name'           => $campaign['name'],
        'description'    => $campaign['description'] ?? '',
        'startDate'      => $campaign['startDate'],
        'endDate'        => $campaign['endDate'],
        'isActive'       => (bool)$campaign['isActive'],
        'totalBudget'    => (int)($campaign['totalBudget'] ?? 1000000),
        'prizes'         => array_map(fn($p) => [
            'id'        => (int)$p['id'],
            'name'      => $p['name'],
            'value'     => (int)$p['value'],
            'quantity'  => (int)$p['quantity'],
            'remaining' => (int)$p['remaining'],
        ], $prizes),
        'totalCollected' => $totalCollected,
    ],
]);
