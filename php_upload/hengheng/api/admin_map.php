<?php
/**
 * admin_map.php
 * POST /hengheng/api/admin_map.php
 * actions: line_verify, update_qr, update_merchant_status, get_overview
 *
 * LINE Login flow:
 *   1. Client เปิด LINE OAuth URL
 *   2. LINE redirect กลับพร้อม code
 *   3. Client ส่ง code มา → action=line_verify
 *   4. เราแลก code → access_token → verify profile
 *   5. เช็คว่า lineUserId อยู่ใน AdminUser หรือ Merchant (isAdmin=1)
 *   6. คืน JWT token สำหรับ session
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$LINE_CHANNEL_ID     = get_config('line_channel_id')     ?: '';
$LINE_CHANNEL_SECRET = get_config('line_channel_secret') ?: '';
$JWT_SECRET          = get_config('admin_jwt_secret')    ?: 'hengheng-admin-2026-change!';
$APP_URL             = get_config('app_url')             ?: 'https://xn--72ca9ib1gc.xn--72cac8e8ec.com';

/* ── Simple JWT ── */
function make_jwt(array $payload, string $secret): string {
    $header  = base64_encode(json_encode(['alg'=>'HS256','typ'=>'JWT']));
    $payload['exp'] = time() + 86400 * 7; // 7 days
    $pay     = base64_encode(json_encode($payload));
    $sig     = base64_encode(hash_hmac('sha256', "$header.$pay", $secret, true));
    return "$header.$pay.$sig";
}
function verify_jwt(string $token, string $secret): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h,$p,$s] = $parts;
    $expected = base64_encode(hash_hmac('sha256', "$h.$p", $secret, true));
    if (!hash_equals($expected, $s)) return null;
    $payload = json_decode(base64_decode($p), true);
    if (!$payload || ($payload['exp'] ?? 0) < time()) return null;
    return $payload;
}
function require_admin_jwt(string $secret): array {
    $token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = str_replace('Bearer ', '', $token);
    $p = verify_jwt($token, $secret);
    if (!$p || empty($p['isAdmin'])) {
        http_response_code(401); echo json_encode(['error'=>'Unauthorized']); exit;
    }
    return $p;
}

$body   = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $body['action'] ?? $_GET['action'] ?? '';

/* ══════════════════════
   LINE OAUTH URL
══════════════════════ */
if ($action === 'get_line_url') {
    $state    = bin2hex(random_bytes(16));
    $redirect = $APP_URL . '/admin-map?callback=1';
    $url = "https://access.line.me/oauth2/v2.1/authorize?"
         . http_build_query([
             'response_type' => 'code',
             'client_id'     => $LINE_CHANNEL_ID,
             'redirect_uri'  => $redirect,
             'state'         => $state,
             'scope'         => 'profile openid',
           ]);
    json_ok(['url' => $url, 'state' => $state]);
}

/* ══════════════════════
   LINE VERIFY
══════════════════════ */
if ($action === 'line_verify') {
    $code     = trim($body['code'] ?? '');
    $redirect = $APP_URL . '/admin-map?callback=1';
    if (!$code) json_err('ไม่มี code', 400);

    // แลก code → token
    $tokenRes = @file_get_contents('https://api.line.me/oauth2/v2.1/token', false, stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query([
                'grant_type'    => 'authorization_code',
                'code'          => $code,
                'redirect_uri'  => $redirect,
                'client_id'     => $LINE_CHANNEL_ID,
                'client_secret' => $LINE_CHANNEL_SECRET,
            ]),
        ],
    ]));
    $tokenData = json_decode($tokenRes, true);
    if (empty($tokenData['access_token'])) json_err('LINE token ผิดพลาด', 401);

    // ดึง profile
    $profRes = @file_get_contents('https://api.line.me/v2/profile', false, stream_context_create([
        'http' => ['method'=>'GET','header'=>"Authorization: Bearer {$tokenData['access_token']}\r\n"],
    ]));
    $profile = json_decode($profRes, true);
    if (empty($profile['userId'])) json_err('ดึง profile ไม่ได้', 401);

    $lineId   = $profile['userId'];
    $name     = $profile['displayName'] ?? 'Admin';
    $avatar   = $profile['pictureUrl']  ?? '';

    // เช็คว่าเป็น admin ไหม (ดูจาก AdminLineUser table)
    $admin = db_row("SELECT * FROM AdminLineUser WHERE lineUserId = ? AND isActive = 1", [$lineId]);
    if (!$admin) {
        // ถ้ายังไม่มี table นี้ ให้ fallback เช็ค hardcode ก่อน (dev)
        $devAdmins = array_filter(array_map('trim', explode(',', get_config('admin_line_ids') ?: '')));
        if (!in_array($lineId, $devAdmins)) {
            json_err('ไม่มีสิทธิ์เข้าใช้งาน admin', 403);
        }
    }

    $jwt = make_jwt([
        'lineUserId'  => $lineId,
        'displayName' => $name,
        'avatarUrl'   => $avatar,
        'isAdmin'     => true,
    ], $JWT_SECRET);

    json_ok([
        'token'       => $jwt,
        'displayName' => $name,
        'avatarUrl'   => $avatar,
    ]);
}

/* ══════════════════════
   OVERVIEW (requires auth)
══════════════════════ */
if ($action === 'get_overview') {
    $admin = require_admin_jwt($JWT_SECRET);
    $todayStart = date('Y-m-d 00:00:00');

    $merchants = db_all(
        "SELECT m.id, m.name, m.address, m.lat, m.lng, m.phone, m.status, m.isActive,
                COALESCE(SUM(mq.totalCodes),0) AS totalQr,
                COALESCE(SUM(mq.usedCodes),0)  AS usedQr,
                (SELECT COUNT(*) FROM DigitalTicket dt WHERE dt.merchantId=m.id AND dt.status='activated' AND dt.activatedAt>=?) AS todayScans,
                (SELECT COUNT(*) FROM DigitalTicket dt2 WHERE dt2.merchantId=m.id AND dt2.isWinner=1) AS winners
         FROM Merchant m
         LEFT JOIN MerchantQuota mq ON mq.merchantId=m.id AND mq.isActive=1
         WHERE m.lat IS NOT NULL AND m.lng IS NOT NULL
         GROUP BY m.id ORDER BY m.name",
        [$todayStart]
    );

    $pending = (int)db_val("SELECT COUNT(*) FROM Merchant WHERE status='pending'", []);
    $totalScans = (int)db_val("SELECT COUNT(*) FROM DigitalTicket WHERE status='activated' AND activatedAt>=?", [$todayStart]);
    $totalWinners = (int)db_val("SELECT COUNT(*) FROM DigitalTicket WHERE isWinner=1", []);

    json_ok([
        'merchants' => array_map(fn($m) => [
            'id'         => (int)$m['id'],
            'name'       => $m['name'],
            'address'    => $m['address'] ?? '',
            'lat'        => (float)$m['lat'],
            'lng'        => (float)$m['lng'],
            'phone'      => $m['phone'],
            'status'     => $m['status'],
            'isActive'   => (bool)$m['isActive'],
            'qrTotal'    => (int)$m['totalQr'],
            'qrUsed'     => (int)$m['usedQr'],
            'qrRemaining'=> max(0, (int)$m['totalQr'] - (int)$m['usedQr']),
            'todayScans' => (int)$m['todayScans'],
            'winners'    => (int)$m['winners'],
        ], $merchants),
        'summary' => [
            'pending'     => $pending,
            'todayScans'  => $totalScans,
            'totalWinners'=> $totalWinners,
        ],
    ]);
}

/* ══════════════════════
   TOGGLE MERCHANT ACTIVE
══════════════════════ */
if ($action === 'toggle_active') {
    $admin = require_admin_jwt($JWT_SECRET);
    $id    = (int)($body['merchantId'] ?? 0);
    $active= !empty($body['isActive']) ? 1 : 0;
    if (!$id) json_err('ต้องระบุ merchantId', 400);
    db_run("UPDATE Merchant SET isActive=? WHERE id=?", [$active, $id]);
    json_ok(['updated' => true]);
}

/* ══════════════════════
   APPROVE / REJECT MERCHANT
══════════════════════ */
if ($action === 'set_status') {
    $admin  = require_admin_jwt($JWT_SECRET);
    $id     = (int)($body['merchantId'] ?? 0);
    $status = in_array($body['status']??'', ['approved','rejected','pending']) ? $body['status'] : null;
    if (!$id || !$status) json_err('ข้อมูลไม่ครบ', 400);

    $isActive = $status === 'approved' ? 1 : 0;
    db_run("UPDATE Merchant SET status=?, isActive=? WHERE id=?", [$status, $isActive, $id]);
    json_ok(['updated' => true, 'status' => $status]);
}

/* ══════════════════════
   ADD QR QUOTA
══════════════════════ */
if ($action === 'add_quota') {
    $admin      = require_admin_jwt($JWT_SECRET);
    $merchantId = (int)($body['merchantId'] ?? 0);
    $codes      = max(1, min(999, (int)($body['codes'] ?? 30)));
    if (!$merchantId) json_err('ต้องระบุ merchantId', 400);

    $campaign = db_row("SELECT id FROM Campaign WHERE isActive=1 ORDER BY createdAt DESC LIMIT 1");
    if (!$campaign) json_err('ไม่มีแคมเปญที่เปิดอยู่', 400);

    db_run(
        "INSERT INTO MerchantQuota (merchantId, receiptId, campaignId, totalCodes, usedCodes, isActive, createdAt)
         VALUES (?, 0, ?, ?, 0, 1, NOW())",
        [$merchantId, $campaign['id'], $codes]
    );
    json_ok(['added' => $codes, 'message' => "เพิ่ม {$codes} QR สำเร็จ"]);
}

json_err('action ไม่ถูกต้อง', 400);
