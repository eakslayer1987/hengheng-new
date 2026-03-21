<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
cors_headers();
header('Content-Type: application/json; charset=utf-8');

$defaults = [
    'app_name'           => 'ปังจัง Lucky Draw',
    'app_subtitle'       => 'ชิงโชคมูลค่ากว่า 1 ล้านบาท',
    'hero_slides'        => json_encode([
        ['emoji'=>'🎰','title'=>'ชิงโชคมูลค่า 2.4 ล้านบาท','sub'=>'สแกน QR ที่ร้านพาร์ทเนอร์'],
        ['emoji'=>'🏪','title'=>'ร้านค้าพาร์ทเนอร์','sub'=>'ยิ่งขายซอสหมีปรุง ยิ่งได้ QR'],
        ['emoji'=>'🎫','title'=>'สะสมโค้ด ลุ้นโชคใหญ่','sub'=>'เก็บโค้ดได้สูงสุด 3 ร้าน/วัน'],
    ], JSON_UNESCAPED_UNICODE),
    'daily_limit_title'  => 'เก็บโค้ดได้ 3 ครั้ง/วัน',
    'daily_limit_sub'    => 'สะสมได้จากร้านค้าพาร์ทเนอร์ต่างๆ รวมกัน ไม่เกิน 3 ครั้งต่อวัน',
    'how_to_steps'       => json_encode([
        ['n'=>1,'e'=>'🍽️','t'=>'ซื้อซอสหมีปรุงที่ร้านพาร์ทเนอร์','d'=>'ร้านที่มีป้าย Smart QR ปังจัง'],
        ['n'=>2,'e'=>'📍','t'=>'สแกน QR ในระยะ 20 เมตร','d'=>'ต้องอยู่ในร้านเท่านั้น เพื่อยืนยันตัวตน'],
        ['n'=>3,'e'=>'📝','t'=>'กรอกชื่อ+เบอร์ → รับโค้ดทันที','d'=>'1 ร้านได้ 1 โค้ด/วัน สูงสุด 3 ร้าน/วัน'],
        ['n'=>4,'e'=>'🎟️','t'=>'สะสมโค้ด → ลุ้นโชคใหญ่','d'=>'ยิ่งมีโค้ดมาก ยิ่งมีสิทธิ์มาก'],
    ], JSON_UNESCAPED_UNICODE),
    'nav_home'           => 'หน้าหลัก',
    'nav_prizes'         => 'รางวัล',
    'nav_scan'           => 'รหัสชิง',
    'nav_check'          => 'ตรวจสอบ',
    'nav_more'           => 'อื่นๆ',
    'scan_btn_text'      => 'สแกน QR รับโค้ดลุ้นโชค',
    'prize_section_title'=> '🏆 รางวัลโชคใหญ่',
];

try {
    $keys = array_keys($defaults);
    $in   = implode(',', array_fill(0, count($keys), '?'));
    $rows = db_all("SELECT `key`, value FROM SystemConfig WHERE `key` IN ($in)", $keys);
    foreach ($rows as $r) $defaults[$r['key']] = $r['value'];
} catch (Throwable) {}

json_ok(['content' => $defaults]);
