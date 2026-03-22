<?php
require_once __DIR__.'/../../includes/db.php';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$u    = trim($body['username'] ?? '');
$p    = $body['password'] ?? '';

if (!$u || !$p) json_err('กรุณากรอกข้อมูลให้ครบ', 400);

$user = db_row("SELECT * FROM AdminUser WHERE username=?", [$u]);
if (!$user || !password_verify($p, $user['password'])) {
    json_err('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
}

$token = bin2hex(random_bytes(32));
json_ok(['token' => $token, 'username' => $user['username']]);
