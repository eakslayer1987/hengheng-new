<?php
require_once __DIR__.'/layout.php';
layout_header('แบนเนอร์', 'banners');

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'save') {
        $id       = (int)($_POST['id'] ?? 0);
        $position = $_POST['position'] ?? 'user_hero';
        $type     = $_POST['type'] ?? 'announcement';
        $title    = substr(trim($_POST['title']??''), 0, 255);
        $body     = substr(trim($_POST['body']??''), 0, 1000);
        $imageUrl = trim($_POST['imageUrl']??'');
        $linkUrl  = trim($_POST['linkUrl']??'');
        $bgColor  = $_POST['bgColor'] ?? '#FD1803';
        $textColor= $_POST['textColor'] ?? '#FFFFFF';
        $priority = (int)($_POST['priority']??0);
        $isActive = isset($_POST['isActive']) ? 1 : 0;

        if ($id) {
            db_run("UPDATE Banner SET position=?,type=?,title=?,body=?,imageUrl=?,linkUrl=?,
                    bgColor=?,textColor=?,priority=?,isActive=? WHERE id=?",
                   [$position,$type,$title,$body,$imageUrl,$linkUrl,$bgColor,$textColor,$priority,$isActive,$id]);
            $msg = '✅ อัปเดตแบนเนอร์แล้ว';
        } else {
            db_run("INSERT INTO Banner (position,type,title,body,imageUrl,linkUrl,bgColor,textColor,priority,isActive,createdAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,NOW())",
                   [$position,$type,$title,$body,$imageUrl,$linkUrl,$bgColor,$textColor,$priority,$isActive]);
            $msg = '✅ สร้างแบนเนอร์แล้ว';
        }
    } elseif ($action === 'delete') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id) { db_run("DELETE FROM Banner WHERE id=?", [$id]); $msg = '🗑️ ลบแล้ว'; }
    } elseif ($action === 'toggle') {
        $id = (int)($_POST['id'] ?? 0);
        $cur = (int)db_val("SELECT isActive FROM Banner WHERE id=?", [$id]);
        db_run("UPDATE Banner SET isActive=? WHERE id=?", [$cur?0:1, $id]);
        $msg = $cur ? '⛔ ซ่อนแล้ว' : '✅ แสดงแล้ว';
    }
}

$edit = null;
if (isset($_GET['edit'])) {
    $edit = db_row("SELECT * FROM Banner WHERE id=?", [(int)$_GET['edit']]);
}

$banners = db_all("SELECT * FROM Banner ORDER BY priority DESC, createdAt DESC");
$positions = ['user_topbar','user_hero','user_infeed','user_popup','user_sticky',
              'merchant_hero','merchant_card','admin_alert'];
$types = ['announcement','image','card','sticky','popup'];
?>

<div class="card">
  <div class="card-title">🖼️ จัดการแบนเนอร์</div>
  <?php if($msg): ?>
  <div class="alert <?= str_starts_with($msg,'✅')?'alert-ok':'alert-bad' ?>"><?= htmlspecialchars($msg) ?></div>
  <?php endif; ?>

  <!-- Form สร้าง/แก้ไข -->
  <form method="POST" style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);
                              border-radius:12px;padding:14px;margin-bottom:16px">
    <input type="hidden" name="action" value="save">
    <input type="hidden" name="id" value="<?= (int)($edit['id']??0) ?>">
    <div class="grid-2">
      <div class="form-group">
        <label>Position</label>
        <select name="position">
          <?php foreach($positions as $p): ?>
          <option value="<?= $p ?>" <?= ($edit['position']??'user_hero')===$p?'selected':'' ?>><?= $p ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-group">
        <label>Type</label>
        <select name="type">
          <?php foreach($types as $t): ?>
          <option value="<?= $t ?>" <?= ($edit['type']??'announcement')===$t?'selected':'' ?>><?= $t ?></option>
          <?php endforeach; ?>
        </select>
      </div>
    </div>
    <div class="form-group"><label>หัวข้อ</label><input name="title" value="<?= htmlspecialchars($edit['title']??'') ?>" placeholder="ชื่อแบนเนอร์"></div>
    <div class="form-group"><label>คำอธิบาย</label><input name="body" value="<?= htmlspecialchars($edit['body']??'') ?>" placeholder="ข้อความ"></div>
    <div class="form-group"><label>URL รูปภาพ</label><input name="imageUrl" value="<?= htmlspecialchars($edit['imageUrl']??'') ?>" placeholder="https://..."></div>
    <div class="form-group"><label>Link URL</label><input name="linkUrl" value="<?= htmlspecialchars($edit['linkUrl']??'') ?>" placeholder="https://..."></div>
    <div class="grid-2">
      <div class="form-group"><label>สี BG</label><input type="color" name="bgColor" value="<?= $edit['bgColor']??'#FD1803' ?>"></div>
      <div class="form-group"><label>สีตัวอักษร</label><input type="color" name="textColor" value="<?= $edit['textColor']??'#FFFFFF' ?>"></div>
    </div>
    <div class="form-group"><label>Priority (มากกว่า = แสดงก่อน)</label><input type="number" name="priority" value="<?= (int)($edit['priority']??0) ?>"></div>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-bottom:12px">
      <input type="checkbox" name="isActive" <?= ($edit['isActive']??0)?'checked':'' ?>> เปิดใช้งาน
    </label>
    <button class="btn btn-gold" type="submit">
      <?= $edit ? '💾 บันทึกการแก้ไข' : '➕ สร้างแบนเนอร์' ?>
    </button>
    <?php if($edit): ?>
    <a href="banners.php" style="margin-left:10px;font-size:12px;color:rgba(150,170,210,.5)">ยกเลิก</a>
    <?php endif; ?>
  </form>

  <!-- รายการ -->
  <?php if(empty($banners)): ?>
  <p style="color:rgba(150,170,210,.4);font-size:13px">ยังไม่มีแบนเนอร์</p>
  <?php else: ?>
  <table>
    <tr><th>หัวข้อ</th><th>Position</th><th>สถานะ</th><th>จัดการ</th></tr>
    <?php foreach($banners as $b): ?>
    <tr>
      <td>
        <?php if($b['imageUrl']): ?>
        <img src="<?= htmlspecialchars($b['imageUrl']) ?>" style="width:36px;height:36px;border-radius:6px;object-fit:cover;margin-right:8px;vertical-align:middle" onerror="this.style.display='none'">
        <?php endif; ?>
        <strong><?= htmlspecialchars($b['title']??'(ไม่มีชื่อ)') ?></strong>
        <span style="font-size:10px;color:rgba(150,170,210,.4)"> #<?= $b['id'] ?></span>
      </td>
      <td style="font-size:11px"><?= htmlspecialchars($b['position']) ?></td>
      <td>
        <span class="badge-<?= $b['isActive']?'ok':'pending' ?>">
          <?= $b['isActive']?'✅ เปิด':'⛔ ซ่อน' ?>
        </span>
      </td>
      <td>
        <div style="display:flex;gap:5px">
          <a href="?edit=<?= $b['id'] ?>" class="btn btn-sec" style="font-size:11px;padding:4px 10px">✏️</a>
          <form method="POST" style="display:inline">
            <input type="hidden" name="action" value="toggle">
            <input type="hidden" name="id" value="<?= $b['id'] ?>">
            <button class="btn btn-sec" style="font-size:11px;padding:4px 10px"><?= $b['isActive']?'⛔':'✅' ?></button>
          </form>
          <form method="POST" style="display:inline" onsubmit="return confirm('ลบ?')">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="id" value="<?= $b['id'] ?>">
            <button class="btn btn-bad" style="font-size:11px;padding:4px 10px">🗑️</button>
          </form>
        </div>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>
  <?php endif; ?>
</div>

<?php layout_footer(); ?>
