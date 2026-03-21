<?php
/**
 * gallery.php
 * GET  /hengheng/api/gallery.php?filter=all|hasQr|noQr|winner&limit=30&offset=0
 * POST /hengheng/api/gallery.php  multipart: phone, qrStatus(available|empty), image
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

/* ── GET: รายการภาพ ── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $filter = $_GET['filter'] ?? 'all';
    $limit  = min(60, max(9, (int)($_GET['limit']  ?? 30)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));

    $where = "1=1";
    $params = [];

    if ($filter === 'hasQr') {
        $where = "gp.qrStatus = 'available'";
    } elseif ($filter === 'noQr') {
        $where = "gp.qrStatus = 'empty'";
    } elseif ($filter === 'winner') {
        $where = "gp.hasWinner = 1";
    }

    $photos = db_all(
        "SELECT gp.id, gp.imageUrl, gp.qrStatus, gp.hasWinner,
                gp.caption, gp.reporterName, gp.createdAt,
                m.id AS merchantId, m.name AS merchantName,
                m.address AS merchantAddr, m.lat, m.lng
         FROM GalleryPhoto gp
         JOIN Merchant m ON m.id = gp.merchantId
         WHERE {$where}
         ORDER BY gp.createdAt DESC
         LIMIT ? OFFSET ?",
        array_merge($params, [$limit, $offset])
    );

    $total = (int)db_val("SELECT COUNT(*) FROM GalleryPhoto gp WHERE {$where}", $params);

    function timeAgo(string $ts): string {
        $d = time() - strtotime($ts);
        if ($d < 60)    return 'เพิ่งถ่าย';
        if ($d < 3600)  return round($d/60).' นาทีที่แล้ว';
        if ($d < 86400) return round($d/3600).' ชม.ที่แล้ว';
        return round($d/86400).' วันที่แล้ว';
    }

    json_ok([
        'photos' => array_map(fn($p) => [
            'id'           => (int)$p['id'],
            'imageUrl'     => $p['imageUrl'],
            'qrStatus'     => $p['qrStatus'],   // available | empty
            'hasWinner'    => (bool)$p['hasWinner'],
            'caption'      => $p['caption'] ?? '',
            'reporterName' => $p['reporterName'] ?? 'ผู้ใช้',
            'timeAgo'      => timeAgo($p['createdAt']),
            'merchantId'   => (int)$p['merchantId'],
            'merchantName' => $p['merchantName'],
            'merchantAddr' => $p['merchantAddr'] ?? '',
            'lat'          => (float)$p['lat'],
            'lng'          => (float)$p['lng'],
        ], $photos),
        'total'  => $total,
        'offset' => $offset + count($photos),
        'hasMore'=> ($offset + count($photos)) < $total,
    ]);
}

/* ── POST: อัปโหลดภาพ ── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone        = preg_replace('/\D/', '', $_POST['phone']        ?? '');
    $qrStatus     = in_array($_POST['qrStatus'] ?? '', ['available','empty']) ? $_POST['qrStatus'] : 'available';
    $caption      = substr(trim($_POST['caption'] ?? ''), 0, 200);
    $reporterName = substr(trim($_POST['reporterName'] ?? 'ผู้ใช้'), 0, 60);

    if (!$phone) json_err('ต้องระบุเบอร์โทรร้าน', 400);

    $merchant = db_row("SELECT * FROM Merchant WHERE phone = ? AND status = 'approved'", [$phone]);
    if (!$merchant) json_err('ไม่พบร้านค้า', 404);

    if (empty($_FILES['image'])) json_err('กรุณาแนบรูป', 400);
    $f    = $_FILES['image'];
    $ok   = ['image/jpeg','image/jpg','image/png','image/webp'];
    if (!in_array($f['type'], $ok))   json_err('รองรับเฉพาะ JPG / PNG / WEBP', 400);
    if ($f['size'] > 8 * 1024 * 1024) json_err('ไฟล์ใหญ่เกิน 8MB', 400);

    $dir = '/var/www/html/hengheng/uploads/gallery/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $ext      = match($f['type']) { 'image/png'=>'png','image/webp'=>'webp',default=>'jpg' };
    $filename = 'gal_'.$merchant['id'].'_'.time().'_'.random_int(1000,9999).'.'.$ext;
    if (!move_uploaded_file($f['tmp_name'], $dir.$filename)) json_err('อัปโหลดล้มเหลว', 500);

    $imageUrl = '/hengheng/uploads/gallery/'.$filename;

    // ตรวจว่าร้านนี้มีผู้โชคดีไหม
    $hasWinner = (int)db_val(
        "SELECT COUNT(*) FROM DigitalTicket WHERE merchantId = ? AND isWinner = 1",
        [$merchant['id']]
    );

    db_run(
        "INSERT INTO GalleryPhoto (merchantId, imageUrl, qrStatus, hasWinner, caption, reporterName, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [$merchant['id'], $imageUrl, $qrStatus, $hasWinner > 0 ? 1 : 0, $caption, $reporterName]
    );

    json_ok([
        'id'       => last_id(),
        'imageUrl' => $imageUrl,
        'message'  => 'อัปโหลดสำเร็จ ขอบคุณครับ! 🙏',
    ]);
}

json_err('Method not allowed', 405);
