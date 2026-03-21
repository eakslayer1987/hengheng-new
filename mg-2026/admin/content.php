<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/layout.php';
require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $section = $_POST['section'] ?? '';
    $keys_map = [
        'app'   => ['app_name','app_subtitle','scan_btn_text','prize_section_title','daily_limit_title','daily_limit_sub'],
        'nav'   => ['nav_home','nav_prizes','nav_scan','nav_check','nav_more'],
        'steps' => ['how_to_steps'],
        'slides'=> ['hero_slides'],
    ];
    if (isset($keys_map[$section])) {
        foreach ($keys_map[$section] as $k) {
            if ($k === 'how_to_steps' || $k === 'hero_slides') {
                $val = $_POST[$k] ?? '';
                // validate JSON
                json_decode($val);
                if (json_last_error() === JSON_ERROR_NONE) set_config($k, $val);
            } elseif (isset($_POST[$k])) {
                set_config($k, $_POST[$k]);
            }
        }
        flash('success', 'บันทึกเนื้อหาสำเร็จ');
    }
    header('Location: /hengheng/admin/content.php?tab=' . ($section ?: 'app'));
    exit;
}

$cf = function(string $key, string $default = '') { return htmlspecialchars(get_config($key, $default)); };
$tab = get('tab', 'app');

render_head('จัดการเนื้อหา');
render_sidebar('content');
?>
<div class="main">
<?php render_topbar('จัดการเนื้อหา') ?>
<div class="content">
<?php flash_html() ?>

<!-- Sub tabs -->
<div style="display:flex;gap:4px;margin-bottom:20px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:4px">
  <?php foreach (['app'=>'📱 แอป','nav'=>'🔘 เมนู','steps'=>'📋 ขั้นตอน','slides'=>'🖼 Slides'] as $k=>$l): ?>
  <a href="?tab=<?= $k ?>" style="flex:1;text-align:center;padding:8px 4px;border-radius:8px;font-size:12px;font-weight:<?= $tab===$k?700:500 ?>;
    background:<?= $tab===$k?'#6366F1':'transparent' ?>;color:<?= $tab===$k?'#fff':'#475569' ?>;text-decoration:none;transition:.15s"><?= $l ?></a>
  <?php endforeach ?>
</div>

<?php if ($tab === 'app'): ?>
<div class="card">
  <div class="card-title">📱 ส่วนหัวแอป</div>
  <form method="post">
    <input type="hidden" name="section" value="app">
    <div class="form-grid cols-2" style="margin-bottom:14px">
      <div><label class="form-label">ชื่อแอป</label><input class="form-input" name="app_name" value="<?= $cf('app_name','ปังจัง Lucky Draw') ?>"></div>
      <div><label class="form-label">คำโปรยใต้ชื่อ</label><input class="form-input" name="app_subtitle" value="<?= $cf('app_subtitle','ชิงโชคมูลค่ากว่า 1 ล้านบาท') ?>"></div>
      <div><label class="form-label">ข้อความปุ่ม Scan</label><input class="form-input" name="scan_btn_text" value="<?= $cf('scan_btn_text','สแกน QR รับโค้ดลุ้นโชค') ?>"></div>
      <div><label class="form-label">หัวข้อส่วนรางวัล</label><input class="form-input" name="prize_section_title" value="<?= $cf('prize_section_title','🏆 รางวัลโชคใหญ่') ?>"></div>
      <div><label class="form-label">หัวข้อ Daily Limit</label><input class="form-input" name="daily_limit_title" value="<?= $cf('daily_limit_title','เก็บโค้ดได้ 3 ครั้ง/วัน') ?>"></div>
      <div><label class="form-label">รายละเอียด Daily Limit</label><input class="form-input" name="daily_limit_sub" value="<?= $cf('daily_limit_sub') ?>"></div>
    </div>
    <button class="btn btn-primary" type="submit"><i class="fa fa-save"></i> บันทึก</button>
  </form>
</div>

<?php elseif ($tab === 'nav'): ?>
<div class="card">
  <div class="card-title">🔘 เมนูด้านล่าง (Bottom Nav)</div>
  <!-- Preview -->
  <div style="background:#0F172A;border-radius:12px;padding:12px 8px;margin-bottom:16px;display:flex;justify-content:space-around">
    <?php foreach (['nav_home'=>'🏠','nav_prizes'=>'🏆','nav_scan'=>'📷','nav_check'=>'🔍','nav_more'=>'•••'] as $k=>$icon): ?>
    <div style="text-align:center">
      <div style="font-size:18px"><?= $icon ?></div>
      <div style="font-size:9px;color:rgba(255,255,255,.6);max-width:40px"><?= $cf($k) ?></div>
    </div>
    <?php endforeach ?>
  </div>
  <form method="post">
    <input type="hidden" name="section" value="nav">
    <div class="form-grid cols-3" style="margin-bottom:14px">
      <?php foreach (['nav_home'=>'🏠 หน้าหลัก','nav_prizes'=>'🏆 รางวัล','nav_scan'=>'📷 สแกน (กลาง)','nav_check'=>'🔍 ตรวจสอบ','nav_more'=>'••• อื่นๆ'] as $k=>$l): ?>
      <div><label class="form-label"><?= $l ?></label><input class="form-input" name="<?= $k ?>" value="<?= $cf($k) ?>"></div>
      <?php endforeach ?>
    </div>
    <button class="btn btn-primary" type="submit"><i class="fa fa-save"></i> บันทึก</button>
  </form>
</div>

<?php elseif ($tab === 'steps'): ?>
<div class="card">
  <div class="card-title">📋 ขั้นตอนวิธีรับโค้ด (JSON)</div>
  <p style="font-size:12px;color:#94A3B8;margin-bottom:12px">แก้ไข JSON ตรงๆ — format: [{n,e,t,d}] (n=ลำดับ, e=emoji, t=หัวข้อ, d=รายละเอียด)</p>
  <form method="post">
    <input type="hidden" name="section" value="steps">
    <textarea class="form-input" name="how_to_steps" rows="10" style="font-family:monospace;font-size:12px"><?= $cf('how_to_steps','[]') ?></textarea>
    <button class="btn btn-primary" type="submit" style="margin-top:12px"><i class="fa fa-save"></i> บันทึก</button>
  </form>
</div>

<?php elseif ($tab === 'slides'): ?>
<div class="card">
  <div class="card-title">🖼 Hero Slides (JSON)</div>
  <p style="font-size:12px;color:#94A3B8;margin-bottom:12px">format: [{emoji,title,sub}]</p>
  <form method="post">
    <input type="hidden" name="section" value="slides">
    <textarea class="form-input" name="hero_slides" rows="10" style="font-family:monospace;font-size:12px"><?= $cf('hero_slides','[]') ?></textarea>
    <button class="btn btn-primary" type="submit" style="margin-top:12px"><i class="fa fa-save"></i> บันทึก</button>
  </form>
</div>
<?php endif ?>

</div></div>
<?php render_foot() ?>
