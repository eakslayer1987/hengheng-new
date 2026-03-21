<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_admin_api();

$code        = trim($_POST['ticket_code'] ?? body()['ticketCode'] ?? '');
$draw_period = trim($_POST['draw_period'] ?? body()['drawPeriod'] ?? '');
$redirect    = $_POST['redirect'] ?? '';

if (!$code) json_err('ต้องระบุรหัสฉลาก', 400);

$updated = db_run("UPDATE DigitalTicket SET isWinner=1, drawPeriod=? WHERE ticketCode=?",
    [$draw_period ?: null, $code])->rowCount();

if ($redirect && $updated) {
    flash('success', "บันทึกผู้โชคดี {$code} สำเร็จ 🏆");
    header("Location: $redirect");
    exit;
}

json_ok(['ok' => true, 'message' => "บันทึกผู้โชคดีสำเร็จ", 'ticketCode' => $code]);
