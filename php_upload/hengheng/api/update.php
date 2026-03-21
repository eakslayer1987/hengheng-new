<?php
/**
 * update.php
 * PATCH /hengheng/api/update.php
 * Body: { phone, name?, ownerName?, address?, lat?, lng? }
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PATCH'])) {
    json_err('Method not allowed', 405);
}

$body  = json_decode(file_get_contents('php://input'), true) ?: [];
$phone = preg_replace('/\D/', '', $body['phone'] ?? '');

if (!$phone) json_err('ต้องระบุ phone', 400);

$merchant = db_row("SELECT * FROM Merchant WHERE phone = ?", [$phone]);
if (!$merchant) json_err('ไม่พบร้านค้า', 404);

$fields = [];
$params = [];

if (!empty($body['name'])) {
    $fields[] = 'name = ?';
    $params[] = substr(trim($body['name']), 0, 255);
}
if (!empty($body['ownerName'])) {
    $fields[] = 'ownerName = ?';
    $params[] = substr(trim($body['ownerName']), 0, 255);
}
if (!empty($body['address'])) {
    $fields[] = 'address = ?';
    $params[] = substr(trim($body['address']), 0, 1000);
}
if (isset($body['lat']) && isset($body['lng'])) {
    $fields[] = 'lat = ?';
    $params[] = (float)$body['lat'];
    $fields[] = 'lng = ?';
    $params[] = (float)$body['lng'];
}

if (!$fields) json_err('ไม่มีข้อมูลที่ต้องอัปเดต', 400);

$params[] = $merchant['id'];
db_run("UPDATE Merchant SET " . implode(', ', $fields) . " WHERE id = ?", $params);

$updated = db_row("SELECT * FROM Merchant WHERE id = ?", [$merchant['id']]);
unset($updated['lineUserId']);

json_ok(['merchant' => $updated]);
