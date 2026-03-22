<?php
require_once __DIR__.'/../../includes/db.php';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$today = date('Y-m-d 00:00:00');
json_ok([
    'totalMerchants'  => (int)db_val("SELECT COUNT(*) FROM Merchant WHERE status='approved'"),
    'pendingMerchants'=> (int)db_val("SELECT COUNT(*) FROM Merchant WHERE status='pending'"),
    'pendingReceipts' => (int)db_val("SELECT COUNT(*) FROM Receipt WHERE status='pending'"),
    'todayScans'      => (int)db_val("SELECT COUNT(*) FROM DigitalTicket WHERE status='activated' AND activatedAt>=?", [$today]),
    'totalTickets'    => (int)db_val("SELECT COUNT(*) FROM DigitalTicket"),
    'totalWinners'    => (int)db_val("SELECT COUNT(*) FROM DigitalTicket WHERE isWinner=1"),
]);
