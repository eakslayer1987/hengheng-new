<?php
/**
 * campaign.php — GET active campaign + prizes
 * VPS: /hengheng/api/campaign.php
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

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Get active campaign
    $stmt = $pdo->query("
        SELECT id, name, description, end_date, total_prize_value, status
        FROM campaigns 
        WHERE status = 'active' 
        ORDER BY id DESC 
        LIMIT 1
    ");
    $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$campaign) {
        // Return default campaign data if none in DB
        echo json_encode([
            'id'              => 1,
            'name'            => 'เฮงเฮง ปังจัง Lucky Draw',
            'description'     => 'ลูกค้าเฮง ร้านค้าเฮ หมีปรุงเปย์ — ลุ้นรวย แบบดับเบิ้ล',
            'endDate'         => '2026-12-31T23:59:59',
            'totalPrizeValue' => 2400000,
            'prizes'          => [
                ['id' => 1, 'name' => 'ทองคำ 1 บาท',       'description' => 'ทองคำแท่ง 1 บาท', 'probability' => 1,  'requiredPoints' => 0, 'imageUrl' => null],
                ['id' => 2, 'name' => 'ทองคำ 1 สลึง',      'description' => 'ทองคำแท่ง 1 สลึง', 'probability' => 4,  'requiredPoints' => 0, 'imageUrl' => null],
                ['id' => 3, 'name' => 'หมีปรุง เปย์แพคเค่จ์', 'description' => 'เซ็ตซอสหมีปรุง ครบชุด', 'probability' => 15, 'requiredPoints' => 0, 'imageUrl' => null],
                ['id' => 4, 'name' => 'คูปองส่วนลด 100 บาท', 'description' => 'ส่วนลด ปังจัง.com', 'probability' => 30, 'requiredPoints' => 0, 'imageUrl' => null],
                ['id' => 5, 'name' => 'Lucky Ticket',       'description' => 'ฉลากลุ้นโชค เข้ารอบจับรางวัลใหญ่', 'probability' => 50, 'requiredPoints' => 0, 'imageUrl' => null],
            ],
        ]);
        exit;
    }

    // Get prizes for this campaign
    $stmt = $pdo->prepare("
        SELECT id, name, description, probability, required_points, image_url
        FROM prizes
        WHERE campaign_id = ?
        ORDER BY probability ASC
    ");
    $stmt->execute([$campaign['id']]);
    $prizes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'id'              => (int)$campaign['id'],
        'name'            => $campaign['name'],
        'description'     => $campaign['description'],
        'endDate'         => $campaign['end_date'],
        'totalPrizeValue' => (int)$campaign['total_prize_value'],
        'prizes'          => array_map(function($p) {
            return [
                'id'             => (int)$p['id'],
                'name'           => $p['name'],
                'description'    => $p['description'],
                'probability'    => (float)$p['probability'],
                'requiredPoints' => (int)$p['required_points'],
                'imageUrl'       => $p['image_url'],
            ];
        }, $prizes),
    ]);

} catch (Exception $e) {
    error_log("[campaign.php] Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'detail' => $e->getMessage()]);
}
