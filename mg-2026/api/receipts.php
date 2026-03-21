<?php
/**
 * receipts.php
 * GET  /hengheng/api/receipts.php?phone=  → รายการ receipts
 * POST /hengheng/api/receipts.php          → อัปโหลดใบเสร็จ (multipart)
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ─── GET: รายการ receipts ───
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $phone = preg_replace('/\D/', '', $_GET['phone'] ?? '');
    if (!$phone) json_err('ต้องระบุ phone', 400);

    $merchant = db_row("SELECT id FROM Merchant WHERE phone = ?", [$phone]);
    if (!$merchant) json_ok(['receipts' => []]);

    $receipts = db_all(
        "SELECT r.id, r.bagCount, r.status, r.submittedAt,
                mq.totalCodes, mq.usedCodes
         FROM Receipt r
         LEFT JOIN MerchantQuota mq ON mq.receiptId = r.id
         WHERE r.merchantId = ?
         ORDER BY r.submittedAt DESC
         LIMIT 20",
        [$merchant['id']]
    );

    json_ok([
        'receipts' => array_map(fn($r) => [
            'id'          => (int)$r['id'],
            'bagCount'    => (int)$r['bagCount'],
            'status'      => $r['status'],
            'submittedAt' => $r['submittedAt'],
            'quota'       => $r['totalCodes'] ? [
                'totalCodes' => (int)$r['totalCodes'],
                'usedCodes'  => (int)$r['usedCodes'],
            ] : null,
        ], $receipts),
    ]);
}

// ─── POST: อัปโหลดใบเสร็จ ───
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone    = preg_replace('/\D/', '', $_POST['phone'] ?? '');
    $bagCount = max(1, min(99, (int)($_POST['bagCount'] ?? 1)));

    if (!$phone) json_err('ต้องระบุ phone', 400);

    $merchant = db_row("SELECT * FROM Merchant WHERE phone = ?", [$phone]);
    if (!$merchant)                         json_err('ไม่พบร้านค้า', 404);
    if ($merchant['status'] !== 'approved') json_err('ร้านค้ายังไม่ได้รับการอนุมัติ', 403);

    // อัปโหลดรูป
    if (empty($_FILES['image'])) json_err('กรุณาแนบรูปใบเสร็จ', 400);
    $file = $_FILES['image'];

    $allowedTypes = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    if (!in_array($file['type'], $allowedTypes)) json_err('รองรับเฉพาะไฟล์รูปภาพ', 400);
    if ($file['size'] > 10 * 1024 * 1024) json_err('ไฟล์ใหญ่เกิน 10MB', 400);

    $uploadDir = '/var/www/html/hengheng/uploads/receipts/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $filename = 'receipt_' . $merchant['id'] . '_' . time() . '_' . random_int(1000, 9999) . '.' . $ext;
    $destPath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        json_err('อัปโหลดไฟล์ไม่สำเร็จ', 500);
    }

    $imageUrl = '/hengheng/uploads/receipts/' . $filename;

    // บันทึก Receipt
    db_run(
        "INSERT INTO Receipt (merchantId, imageUrl, bagCount, status, submittedAt)
         VALUES (?, ?, ?, 'pending', NOW())",
        [$merchant['id'], $imageUrl, $bagCount]
    );
    $receiptId = last_id();

    json_ok([
        'receipt' => [
            'id'          => $receiptId,
            'bagCount'    => $bagCount,
            'status'      => 'pending',
            'submittedAt' => date('Y-m-d H:i:s'),
            'imageUrl'    => $imageUrl,
        ],
    ]);
}

json_err('Method not allowed', 405);
