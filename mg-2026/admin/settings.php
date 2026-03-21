<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/layout.php';
require_admin();

// Handle POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $section = $_POST['section'] ?? '';

    if ($section === 'campaign') {
        $id = (int)$_POST['id'];
        if ($id) {
            db_run("UPDATE Campaign SET name=?,description=?,startDate=?,endDate=?,totalBudget=?,codesPerBag=? WHERE id=?", [
                $_POST['name'], $_POST['description'],
                $_POST['startDate'], $_POST['endDate'],
                (int)$_POST['totalBudget'], (int)$_POST['codesPerBag'], $id
            ]);
        } else {
            db_run("INSERT INTO Campaign (name,description,startDate,endDate,isActive,totalBudget,codesPerBag,createdAt) VALUES (?,?,?,?,0,?,?,NOW())", [
                $_POST['name'], $_POST['description'], $_POST['startDate'],
                $_POST['endDate'], (int)$_POST['totalBudget'], (int)$_POST['codesPerBag']
            ]);
        }
        flash('success', 'บันทึกแคมเปญสำเร็จ');
    }

    if ($section === 'toggle_campaign') {
        $id = (int)$_POST['id'];
        $active = (int)$_POST['active'];
        db_run("UPDATE Campaign SET isActive=? WHERE id=?", [$active, $id]);
        flash('success', $active ? 'เปิดแคมเปญแล้ว' : 'ปิดแคมเปญแล้ว');
    }

    if ($section === 'prize') {
        db_run("INSERT INTO Prize (campaignId,name,value,quantity,remaining,sortOrder) VALUES (?,?,?,?,?,?)", [
            (int)$_POST['campaignId'], $_POST['name'], (int)$_POST['value'],
            (int)$_POST['quantity'], (int)$_POST['quantity'], (int)($_POST['sortOrder'] ?? 0)
        ]);
        flash('success', 'เพิ่มรางวัลสำเร็จ');
    }

    if ($section === 'delete_prize') {
        db_run("DELETE FROM Prize WHERE id=?", [(int)$_POST['prize_id']]);
        flash('success', 'ลบรางวัลสำเร็จ');
    }

    if ($section === 'system') {
        $keys = ['daily_collect_limit','gps_radius_m','registration_open','otp_expire_min','otp_cooldown_sec','tickets_per_bag'];
        foreach ($keys as $k) {
            if (isset($_POST[$k])) set_config($k, $_POST[$k]);
        }
        flash('success', 'บันทึกการตั้งค่าสำเร็จ');
    }

    if ($section === 'password') {
        $pw = $_POST['new_password'];
        if (strlen($pw) < 6) {
            flash('error', 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัว');
        } else {
            $hash = password_hash($pw, PASSWORD_BCRYPT);
            db_run("UPDATE AdminUser SET password=? WHERE id=1", [$hash]);
            flash('success', 'เปลี่ยนรหัสผ่านสำเร็จ');
        }
    }

    header('Location: /hengheng/admin/settings.php');
    exit;
}

$campaigns = db_all("SELECT c.*, (SELECT COUNT(*) FROM CollectedCode WHERE campaignId=c.id) as code_count FROM Campaign ORDER BY createdAt DESC");
$active_camp = db_row("SELECT * FROM Campaign WHERE isActive=1 ORDER BY createdAt DESC LIMIT 1");
$prizes = $active_camp ? db_all("SELECT * FROM Prize WHERE campaignId=? ORDER BY sortOrder", [$active_camp['id']]) : [];

render_head('ตั้งค่า');
render_sidebar('settings');
?>
<div class="main">
<?php render_topbar('ตั้งค่าระบบ') ?>
<div class="content">
<?php flash_html() ?>

<!-- แคมเปญ -->
<div class="card" style="margin-bottom:16px">
  <div class="card-title"><i class="fa fa-calendar" style="color:#6366F1"></i> แคมเปญ</div>
  <?php foreach ($campaigns as $c):
    $days = ceil((strtotime($c['endDate']) - time()) / 86400);
  ?>
  <div style="background:#F8FAFC;border:1px solid <?= $c['isActive']?'rgba(99,102,241,.3)':'rgba(0,0,0,.08)' ?>;border-radius:10px;padding:14px;margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-weight:700;font-size:14px"><?= htmlspecialchars($c['name']) ?></span>
          <?= badge($c['isActive']?'approved':'rejected') ?>
        </div>
        <p style="font-size:12px;color:#475569">
          <?= date('d/m/Y', strtotime($c['startDate'])) ?> → <?= date('d/m/Y', strtotime($c['endDate'])) ?>
          · <?= number_format($c['code_count']) ?> โค้ด
          <?= $days > 0 ? "· เหลือ {$days} วัน" : ' · หมดเขตแล้ว' ?>
        </p>
      </div>
      <!-- Toggle -->
      <form method="post" style="display:inline">
        <input type="hidden" name="section" value="toggle_campaign">
        <input type="hidden" name="id" value="<?= $c['id'] ?>">
        <input type="hidden" name="active" value="<?= $c['isActive']?0:1 ?>">
        <button class="btn <?= $c['isActive']?'btn-danger':'btn-success' ?> btn-sm" type="submit">
          <?= $c['isActive']?'ปิด':'เปิด' ?>
        </button>
      </form>
      <button class="btn btn-secondary btn-sm" onclick="openModal('modal-camp-<?= $c['id'] ?>')"><i class="fa fa-pen"></i></button>
    </div>
  </div>
  <!-- Modal แก้ไข -->
  <div id="modal-camp-<?= $c['id'] ?>" class="modal-overlay">
    <div class="modal">
      <div class="modal-title">✏️ แก้ไขแคมเปญ <button class="modal-close" onclick="closeModal('modal-camp-<?= $c['id'] ?>')">✕</button></div>
      <form method="post">
        <input type="hidden" name="section" value="campaign">
        <input type="hidden" name="id" value="<?= $c['id'] ?>">
        <div class="form-grid cols-2">
          <div style="grid-column:1/-1"><label class="form-label">ชื่อแคมเปญ</label><input class="form-input" name="name" value="<?= htmlspecialchars($c['name']) ?>" required></div>
          <div><label class="form-label">วันเริ่ม</label><input class="form-input" type="date" name="startDate" value="<?= date('Y-m-d', strtotime($c['startDate'])) ?>"></div>
          <div><label class="form-label">วันหมดเขต</label><input class="form-input" type="date" name="endDate" value="<?= date('Y-m-d', strtotime($c['endDate'])) ?>"></div>
          <div><label class="form-label">งบประมาณ (฿)</label><input class="form-input" type="number" name="totalBudget" value="<?= $c['totalBudget'] ?>"></div>
          <div><label class="form-label">QR ต่อถุง</label><input class="form-input" type="number" name="codesPerBag" value="<?= $c['codesPerBag'] ?>"></div>
          <div style="grid-column:1/-1"><label class="form-label">รายละเอียด</label><textarea class="form-input" name="description" rows="2"><?= htmlspecialchars($c['description'] ?? '') ?></textarea></div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn btn-primary" type="submit"><i class="fa fa-save"></i> บันทึก</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal('modal-camp-<?= $c['id'] ?>')">ยกเลิก</button>
        </div>
      </form>
    </div>
  </div>
  <?php endforeach ?>
  <button class="btn btn-secondary btn-sm" onclick="openModal('modal-new-camp')"><i class="fa fa-plus"></i> สร้างแคมเปญใหม่</button>
</div>

<!-- Modal สร้างแคมเปญ -->
<div id="modal-new-camp" class="modal-overlay">
  <div class="modal">
    <div class="modal-title">+ สร้างแคมเปญใหม่ <button class="modal-close" onclick="closeModal('modal-new-camp')">✕</button></div>
    <form method="post">
      <input type="hidden" name="section" value="campaign"><input type="hidden" name="id" value="0">
      <div class="form-grid cols-2">
        <div style="grid-column:1/-1"><label class="form-label">ชื่อแคมเปญ *</label><input class="form-input" name="name" required></div>
        <div><label class="form-label">วันเริ่ม *</label><input class="form-input" type="date" name="startDate" required></div>
        <div><label class="form-label">วันหมดเขต *</label><input class="form-input" type="date" name="endDate" required></div>
        <div><label class="form-label">งบประมาณ (฿)</label><input class="form-input" type="number" name="totalBudget" value="1000000"></div>
        <div><label class="form-label">QR ต่อถุง</label><input class="form-input" type="number" name="codesPerBag" value="30"></div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn btn-primary" type="submit"><i class="fa fa-plus"></i> สร้าง</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal('modal-new-camp')">ยกเลิก</button>
      </div>
    </form>
  </div>
</div>

<!-- รางวัล -->
<?php if ($active_camp): ?>
<div class="card" style="margin-bottom:16px">
  <div class="card-title"><i class="fa fa-medal" style="color:#B45309"></i> รางวัล (<?= htmlspecialchars($active_camp['name']) ?>)</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
    <?php foreach ($prizes as $i => $p):
      $pct = $p['quantity']>0 ? round(($p['remaining']/$p['quantity'])*100) : 0;
      $color = $pct>50?'#6366F1':($pct>20?'#B45309':'#E53E3E');
    ?>
    <div style="border:1px solid rgba(0,0,0,.08);border-radius:10px;padding:12px;position:relative">
      <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px">
        <span style="font-size:24px"><?= ['🥇','🥈','🥉','🎁','🎀','🎖️'][$i]??'🎁' ?></span>
        <div style="flex:1"><div style="font-weight:700;font-size:13px"><?= htmlspecialchars($p['name']) ?></div>
          <div style="font-size:12px;color:#94A3B8">฿<?= number_format($p['value']) ?> / ชิ้น</div></div>
        <form method="post" style="display:inline">
          <input type="hidden" name="section" value="delete_prize"><input type="hidden" name="prize_id" value="<?= $p['id'] ?>">
          <button class="btn btn-danger btn-sm" type="submit" onclick="return confirm('ลบรางวัลนี้?')"><i class="fa fa-trash"></i></button>
        </form>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px">
        <span>คงเหลือ</span><span style="font-weight:700;color:<?= $color ?>"><?= $p['remaining'] ?>/<?= $p['quantity'] ?></span>
      </div>
      <div style="height:6px;border-radius:3px;background:#F1F5F9"><div style="height:100%;border-radius:3px;background:<?= $color ?>;width:<?= $pct ?>%"></div></div>
    </div>
    <?php endforeach ?>
  </div>
  <button class="btn btn-secondary btn-sm" onclick="openModal('modal-new-prize')"><i class="fa fa-plus"></i> เพิ่มรางวัล</button>
</div>

<div id="modal-new-prize" class="modal-overlay">
  <div class="modal">
    <div class="modal-title">+ เพิ่มรางวัล <button class="modal-close" onclick="closeModal('modal-new-prize')">✕</button></div>
    <form method="post">
      <input type="hidden" name="section" value="prize">
      <input type="hidden" name="campaignId" value="<?= $active_camp['id'] ?>">
      <div class="form-grid cols-2">
        <div style="grid-column:1/-1"><label class="form-label">ชื่อรางวัล *</label><input class="form-input" name="name" placeholder="เช่น เงินสด 100,000 บาท" required></div>
        <div><label class="form-label">มูลค่า (฿)</label><input class="form-input" type="number" name="value" required></div>
        <div><label class="form-label">จำนวน</label><input class="form-input" type="number" name="quantity" value="1" required></div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn btn-success" type="submit"><i class="fa fa-save"></i> บันทึก</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal('modal-new-prize')">ยกเลิก</button>
      </div>
    </form>
  </div>
</div>
<?php endif ?>

<!-- System Config -->
<div class="card" style="margin-bottom:16px">
  <div class="card-title"><i class="fa fa-gear" style="color:#475569"></i> ตั้งค่าระบบ</div>
  <form method="post">
    <input type="hidden" name="section" value="system">
    <div class="form-grid cols-2" style="margin-bottom:14px">
      <div><label class="form-label">สิทธิ์สะสมสูงสุด/วัน/คน</label>
        <input class="form-input" type="number" name="daily_collect_limit" value="<?= htmlspecialchars(get_config('daily_collect_limit','3')) ?>">
        <p class="form-note">นับรวมทุกร้าน</p></div>
      <div><label class="form-label">รัศมี GPS (เมตร)</label>
        <input class="form-input" type="number" name="gps_radius_m" value="<?= htmlspecialchars(get_config('gps_radius_m','20')) ?>">
        <p class="form-note">ค่าเริ่มต้น 20 เมตร</p></div>
      <div><label class="form-label">OTP หมดอายุ (นาที)</label>
        <input class="form-input" type="number" name="otp_expire_min" value="<?= htmlspecialchars(get_config('otp_expire_min','5')) ?>"></div>
      <div><label class="form-label">OTP Cooldown (วินาที)</label>
        <input class="form-input" type="number" name="otp_cooldown_sec" value="<?= htmlspecialchars(get_config('otp_cooldown_sec','60')) ?>"></div>
      <div><label class="form-label">ฉลากดิจิทัลต่อถุง</label>
        <input class="form-input" type="number" name="tickets_per_bag" value="<?= htmlspecialchars(get_config('tickets_per_bag','20')) ?>">
        <p class="form-note">ค่าเริ่มต้น 20 ใบ/ถุง</p></div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:20px">
        <label class="form-label" style="margin:0">เปิดรับสมัครร้านค้าใหม่</label>
        <input type="checkbox" name="registration_open" value="true" <?= get_config('registration_open','true')==='true'?'checked':'' ?> style="width:18px;height:18px">
      </div>
    </div>
    <button class="btn btn-primary" type="submit"><i class="fa fa-save"></i> บันทึกการตั้งค่า</button>
  </form>
</div>

<!-- เปลี่ยนรหัสผ่าน -->
<div class="card">
  <div class="card-title"><i class="fa fa-shield" style="color:#475569"></i> เปลี่ยนรหัสผ่าน</div>
  <form method="post" style="max-width:400px">
    <input type="hidden" name="section" value="password">
    <div class="form-group"><label class="form-label">รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)</label>
      <input class="form-input" type="password" name="new_password" required></div>
    <button class="btn btn-danger" type="submit"><i class="fa fa-key"></i> เปลี่ยนรหัสผ่าน</button>
  </form>
</div>

</div></div>
<?php render_foot() ?>
