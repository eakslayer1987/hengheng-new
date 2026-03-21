<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
cors_headers();
header('Content-Type: application/json; charset=utf-8');

$position = $_GET['position'] ?? '';
$now      = date('Y-m-d H:i:s');

$where_parts = ["isActive=1", "(startsAt IS NULL OR startsAt<=?)", "(endsAt IS NULL OR endsAt>=?)"];
$params      = [$now, $now];

if ($position) {
    $where_parts[] = "position=?";
    $params[]      = $position;
}

$where   = implode(' AND ', $where_parts);
$banners = db_all("SELECT * FROM Banner WHERE $where ORDER BY priority DESC, createdAt DESC LIMIT 20", $params);

// Track impressions
if (!empty($banners) && !empty($_SERVER['HTTP_X_TRACK_IMP'])) {
    $ids = array_column($banners, 'id');
    $ph  = implode(',', array_fill(0, count($ids), '?'));
    db_run("UPDATE Banner SET impressions=impressions+1 WHERE id IN ($ph)", $ids);
}

json_ok(['banners' => $banners]);
