<?php
/**
 * banners.php — GET banners by position
 * VPS: /hengheng/api/banners.php
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config.php';

$position = $_GET['position'] ?? 'user_hero';

// Validate position
$validPositions = [
    'user_topbar', 'user_hero', 'user_infeed', 'user_popup', 'user_sticky',
    'merchant_hero', 'merchant_card', 'merchant_popup', 'admin_alert'
];

if (!in_array($position, $validPositions)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid position', 'banners' => []]);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare("
        SELECT id, type, title, body, image_url, bg_color, link_url, position, sort_order
        FROM banners
        WHERE position = ? AND is_active = 1
        ORDER BY sort_order ASC, id DESC
    ");
    $stmt->execute([$position]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($rows)) {
        // Fallback banners based on position
        $fallbacks = [
            'user_hero' => [
                ['id' => 1, 'type' => 'announcement', 'title' => 'ลุ้นทองล้านบาท!', 'body' => 'สแกน QR ครบ 5 ร้าน รับสิทธิ์ทันที', 'bgColor' => '#4a1500', 'position' => 'user_hero'],
                ['id' => 2, 'type' => 'announcement', 'title' => 'Double Win!', 'body' => 'ฉลากคู่ โอกาสชนะคูณสอง', 'bgColor' => '#1a0040', 'position' => 'user_hero'],
                ['id' => 3, 'type' => 'announcement', 'title' => 'หมีปรุง เปย์แพคเค่จ์', 'body' => 'ร้านเข้า ลูกค้าลุ้น ซอสหมีปรุงฟรี!', 'bgColor' => '#002a1a', 'position' => 'user_hero'],
            ],
        ];
        
        echo json_encode([
            'banners' => $fallbacks[$position] ?? [],
        ]);
        exit;
    }

    $banners = array_map(function($row) {
        return [
            'id'       => (int)$row['id'],
            'type'     => $row['type'],
            'title'    => $row['title'],
            'body'     => $row['body'],
            'imageUrl' => $row['image_url'],
            'bgColor'  => $row['bg_color'],
            'linkUrl'  => $row['link_url'],
            'position' => $row['position'],
        ];
    }, $rows);

    echo json_encode(['banners' => $banners]);

} catch (Exception $e) {
    error_log("[banners.php] Error: " . $e->getMessage());
    // Return empty on error so frontend uses fallback
    echo json_encode(['banners' => []]);
}
