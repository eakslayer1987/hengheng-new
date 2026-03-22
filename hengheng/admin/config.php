<?php
require_once __DIR__.'/layout.php';
layout_header('ตั้งค่า', 'config');

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($_POST as $k => $v) {
        if ($k === 'action') continue;
        $k = preg_replace('/[^a-z0-9_]/', '', $k);
        if (!$k) continue;
        db_run("INSERT INTO SystemConfig (`key`,value) VALUES (?,?)
                ON DUPLICATE KEY UPDATE value=?", [$k, $v, $v]);
    }
    $msg = '✅ บันทึกการตั้งค่าสำเร็จ';
}

$configs_raw = db_all("SELECT `key`,value,label FROM SystemConfig ORDER BY `key`");
$configs = [];
foreach ($configs_raw as $c) $configs[$c['key']] = $c;

$keys = [
    ['key'=>'app_name',           'label'=>'ชื่อแอป',              'type'=>'text'],
    ['key'=>'app_subtitle',       'label'=>'คำโปรย',               'type'=>'text'],
    ['key'=>'daily_collect_limit','label'=>'สิทธิ์สะสม/วัน',       'type'=>'number'],
    ['key'=>'gps_radius_m',       'label'=>'รัศมี GPS (เมตร)',       'type'=>'number'],
    ['key'=>'otp_expire_min',     'label'=>'OTP หมดอายุ (นาที)',    'type'=>'number'],
    ['key'=>'otp_cooldown_sec',   'label'=>'OTP cooldown (วินาที)', 'type'=>'number'],
    ['key'=>'tickets_per_bag',    'label'=>'ฉลากต่อถุง',           'type'=>'number'],
    ['key'=>'codes_per_bag',      'label'=>'QR codes ต่อถุง',       'type'=>'number'],
    ['key'=>'registration_open',  'label'=>'เปิดรับสมัคร (true/false)','type'=>'text'],
    ['key'=>'smsmkt_api_key',     'label'=>'SMSMKT API Key',        'type'=>'text'],
    ['key'=>'smsmkt_api_secret',  'label'=>'SMSMKT API Secret',     'type'=>'password'],
];
?>

<div class="card">
  <div class="card-title">⚙️ ตั้งค่าระบบ</div>
  <?php if($msg): ?>
  <div class="alert alert-ok"><?= htmlspecialchars($msg) ?></div>
  <?php endif; ?>

  <form method="POST">
    <?php foreach($keys as $k): ?>
    <div class="form-group">
      <label><?= htmlspecialchars($k['label']) ?>
        <span style="font-size:10px;color:rgba(100,120,160,.4);margin-left:4px"><?= $k['key'] ?></span>
      </label>
      <input type="<?= $k['type'] ?>" name="<?= $k['key'] ?>"
             value="<?= htmlspecialchars($configs[$k['key']]['value'] ?? '') ?>">
    </div>
    <?php endforeach; ?>
    <button class="btn btn-gold" type="submit" style="height:44px;padding:0 24px;font-size:14px">
      💾 บันทึกการตั้งค่า
    </button>
  </form>
</div>

<!-- Change password -->
<div class="card">
  <div class="card-title">🔐 เปลี่ยนรหัสผ่าน Admin</div>
  <?php
  $pwmsg = '';
  if (isset($_POST['new_password'])) {
      $np = $_POST['new_password'] ?? '';
      if (strlen($np) >= 6) {
          $hash = password_hash($np, PASSWORD_BCRYPT);
          db_run("UPDATE AdminUser SET password=? WHERE username=?",
                 [$hash, $_SESSION['admin_user']]);
          $pwmsg = '✅ เปลี่ยนรหัสผ่านสำเร็จ';
      } else {
          $pwmsg = '❌ รหัสผ่านต้องยาวอย่างน้อย 6 ตัว';
      }
  }
  if ($pwmsg): ?>
  <div class="alert <?= str_starts_with($pwmsg,'✅')?'alert-ok':'alert-bad' ?>"><?= htmlspecialchars($pwmsg) ?></div>
  <?php endif; ?>
  <form method="POST" style="display:flex;gap:10px;align-items:flex-end">
    <div class="form-group" style="flex:1;margin:0">
      <label>รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)</label>
      <input type="password" name="new_password" placeholder="••••••••">
    </div>
    <button class="btn btn-sec" type="submit" style="height:40px;flex-shrink:0">🔐 เปลี่ยน</button>
  </form>
</div>

<?php layout_footer(); ?>
