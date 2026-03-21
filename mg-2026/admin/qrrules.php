<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/layout.php';
require_admin();

$RULE_TYPES = [
    'time'        => ['label'=>'⏰ ตามเวลา',           'hint'=>'เช่น 08:00-21:00',         'default_value'=>'08:00-21:00', 'default_msg'=>'ขออภัย สามารถสแกนได้เฉพาะเวลา 08:00-21:00 น. เท่านั้น'],
    'day_of_week' => ['label'=>'📅 ตามวัน',             'hint'=>'เช่น 1,2,3,4,5 (จ-ศ)',      'default_value'=>'1,2,3,4,5',   'default_msg'=>'ขออภัย สามารถสแกนได้เฉพาะวันจันทร์-ศุกร์ เท่านั้น'],
    'scan_count'  => ['label'=>'🔢 ตามจำนวนสแกน',      'hint'=>'JSON {"from":1,"to":1000}',  'default_value'=>'{"from":1,"to":1000}', 'default_msg'=>'โควต้าการสแกนเต็มแล้ว กรุณาติดต่อร้านค้า'],
    'geo'         => ['label'=>'📍 รัศมีสถานที่ (m)',   'hint'=>'เช่น 50',                   'default_value'=>'50',           'default_msg'=>'คุณอยู่นอกพื้นที่ร้านค้า กรุณาสแกนภายในร้านเท่านั้น 📍'],
];

// Handle POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $act = $_POST['action'] ?? '';
    $id  = (int)($_POST['id'] ?? 0);

    if ($act === 'save') {
        $data = [
            'name'         => trim($_POST['name'] ?? ''),
            'ruleType'     => $_POST['ruleType'] ?? 'time',
            'value'        => trim($_POST['value'] ?? ''),
            'blockMessage' => trim($_POST['blockMessage'] ?? ''),
            'priority'     => (int)($_POST['priority'] ?? 0),
            'isActive'     => isset($_POST['isActive']) ? 1 : 0,
        ];
        if (!$data['name'] || !$data['value'] || !$data['blockMessage']) {
            flash('error', 'กรุณากรอกข้อมูลให้ครบ');
        } elseif ($id) {
            db_run("UPDATE QrRule SET name=?,ruleType=?,value=?,blockMessage=?,priority=?,isActive=?,updatedAt=NOW() WHERE id=?",
                [...array_values($data), $id]);
            flash('success', 'อัปเดต rule แล้ว');
        } else {
            db_run("INSERT INTO QrRule (name,ruleType,value,blockMessage,priority,isActive,createdAt,updatedAt) VALUES (?,?,?,?,?,?,NOW(),NOW())",
                array_values($data));
            flash('success', 'สร้าง rule แล้ว');
        }
    } elseif ($act === 'toggle') {
        db_run("UPDATE QrRule SET isActive = NOT isActive, updatedAt=NOW() WHERE id=?", [$id]);
        flash('success', 'เปลี่ยนสถานะ rule แล้ว');
    } elseif ($act === 'delete') {
        db_run("DELETE FROM QrRule WHERE id=?", [$id]);
        flash('success', 'ลบ rule แล้ว');
    }

    header('Location: /hengheng/admin/qrrules.php');
    exit;
}

$rules = db_all("SELECT * FROM QrRule ORDER BY priority ASC, createdAt ASC");
$edit = get('edit') ? db_row("SELECT * FROM QrRule WHERE id=?", [(int)get('edit')]) : null;

render_head('Smart QR Rules');
render_sidebar('qrrules');
?>
<div class="main">
<?php render_topbar('Smart QR Rules') ?>
<div class="content">
<?php flash_html() ?>

<div class="alert alert-info" style="margin-bottom:16px">
  <i class="fa fa-shield"></i>
  <div><strong>วิธีทำงาน:</strong> เมื่อลูกค้าสแกน QR ระบบ evaluate rules ตาม priority (น้อย = ก่อน)
  — rule ไหนไม่ผ่านจะแสดง blockMessage และหยุดทันที</div>
</div>

<div style="display:flex;justify-content:flex-end;margin-bottom:12px">
  <button class="btn btn-primary" onclick="openModal('modal-rule-new')"><i class="fa fa-plus"></i> เพิ่ม Rule</button>
</div>

<?php if (empty($rules)): ?>
<div class="card" style="text-align:center;padding:48px;color:#94A3B8">
  <i class="fa fa-qrcode" style="font-size:32px;margin-bottom:12px;display:block"></i>
  <p>ยังไม่มี Smart QR Rules</p>
  <p style="font-size:12px;margin-top:4px">กด "เพิ่ม Rule" เพื่อตั้งค่ากฎการสแกน</p>
</div>
<?php else: ?>
<div style="display:flex;flex-direction:column;gap:10px">
  <?php foreach ($rules as $rule): ?>
  <div class="card" style="opacity:<?= $rule['isActive']?1:.55 ?>">
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="min-width:36px;height:36px;border-radius:8px;background:#EFF6FF;display:flex;align-items:center;
        justify-content:center;font-size:13px;font-weight:700;color:#1D4ED8;flex-shrink:0">
        <?= $rule['priority'] ?>
      </div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
          <span style="font-weight:600;font-size:14px"><?= htmlspecialchars($rule['name']) ?></span>
          <?= badge($rule['isActive']?'approved':'rejected') ?>
          <span style="background:#EFF6FF;color:#1D4ED8;border:1px solid rgba(29,78,216,.15);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600">
            <?= $RULE_TYPES[$rule['ruleType']]['label'] ?? $rule['ruleType'] ?>
          </span>
        </div>
        <code style="font-size:12px;background:#F8FAFC;border:1px solid rgba(0,0,0,.08);border-radius:6px;
          padding:2px 8px;color:#475569;display:inline-block;margin-bottom:6px">
          <?= htmlspecialchars($rule['value']) ?>
        </code>
        <p style="font-size:12px;color:#94A3B8">🚫 <?= htmlspecialchars($rule['blockMessage']) ?></p>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <form method="post" style="display:inline">
          <input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= $rule['id'] ?>">
          <button class="btn btn-secondary btn-sm" type="submit"><?= $rule['isActive']?'⏸':'▶' ?></button>
        </form>
        <a href="?edit=<?= $rule['id'] ?>" class="btn btn-secondary btn-sm"><i class="fa fa-pen"></i></a>
        <form method="post" style="display:inline">
          <input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= $rule['id'] ?>">
          <button class="btn btn-danger btn-sm" type="submit" onclick="return confirm('ลบ rule นี้?')"><i class="fa fa-trash"></i></button>
        </form>
      </div>
    </div>
  </div>
  <?php endforeach ?>
</div>
<?php endif ?>

<!-- Modal: New / Edit -->
<?php foreach (['modal-rule-new'=>null, 'modal-rule-edit'=>$edit] as $mid => $m]:
  if ($mid === 'modal-rule-edit' && !$m) continue;
  $v = fn(string $k, string $d='') => htmlspecialchars($m[$k] ?? $d);
?>
<div id="<?= $mid ?>" class="modal-overlay" <?= ($m && $mid==='modal-rule-edit')?'style="display:flex"':'' ?>>
  <div class="modal">
    <div class="modal-title">
      <?= $mid==='modal-rule-edit'?'✏️ แก้ไข Rule':'+ เพิ่ม Smart QR Rule' ?>
      <button class="modal-close" onclick="closeModal('<?= $mid ?>')">✕</button>
    </div>
    <form method="post">
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= $m['id'] ?? 0 ?>">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div><label class="form-label">ชื่อ Rule *</label>
          <input class="form-input" name="name" value="<?= $v('name') ?>" placeholder="เช่น เปิดเฉพาะวันธรรมดา" required></div>

        <div>
          <label class="form-label">ประเภท Rule *</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="<?= $mid ?>-types">
            <?php foreach ($$RULE_TYPES as $rt => $info): ?>
            <label style="display:block;padding:8px 12px;border-radius:8px;font-size:13px;cursor:pointer;border:1px solid rgba(0,0,0,.1);
              background:#fff" onclick="fillPreset('<?= $mid ?>', '<?= $rt ?>')">
              <input type="radio" name="ruleType" value="<?= $rt ?>" <?= ($v('ruleType','time')===$rt)?'checked':'' ?> style="margin-right:6px">
              <?= $info['label'] ?>
              <span style="display:block;font-size:10px;color:#94A3B8;margin-top:2px"><?= $info['hint'] ?></span>
            </label>
            <?php endforeach ?>
          </div>
        </div>

        <div><label class="form-label">ค่า *</label>
          <input class="form-input" name="value" id="<?= $mid ?>-value" value="<?= $v('value') ?>" required></div>

        <div>
          <label class="form-label">ข้อความเมื่อถูก block *</label>
          <textarea class="form-input" name="blockMessage" id="<?= $mid ?>-msg" rows="2" required><?= $v('blockMessage') ?></textarea>
          <?php if ($v('blockMessage')): ?>
          <div style="margin-top:6px;background:#FEF2F2;border:1px solid rgba(229,62,62,.2);border-radius:8px;padding:8px 12px;font-size:12px;color:#E53E3E">
            🚫 <?= $v('blockMessage') ?>
          </div>
          <?php endif ?>
        </div>

        <div style="display:flex;gap:10px;align-items:center">
          <div style="flex:1"><label class="form-label">Priority (น้อย = ตรวจก่อน)</label>
            <input class="form-input" type="number" name="priority" value="<?= $v('priority','0') ?>"></div>
          <div style="padding-top:20px">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
              <input type="checkbox" name="isActive" value="1" <?= ($m['isActive']??1)?'checked':'' ?>> เปิดใช้งาน
            </label>
          </div>
        </div>

        <div style="display:flex;gap:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,.06)">
          <button class="btn btn-primary" type="submit"><i class="fa fa-save"></i> <?= $mid==='modal-rule-edit'?'บันทึก':'สร้าง Rule' ?></button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal('<?= $mid ?>')">ยกเลิก</button>
        </div>
      </div>
    </form>
  </div>
</div>
<?php endforeach ?>

</div></div>
<script>
<?php
$PRESETS_JS = [];
foreach ($RULE_TYPES as $k => $r) {
    $PRESETS_JS[$k] = ['value' => $r['default_value'], 'msg' => $r['default_msg']];
}
?>
const PRESETS = <?= json_encode($PRESETS_JS, JSON_UNESCAPED_UNICODE) ?>;
function fillPreset(modalId, type) {
  const p = PRESETS[type];
  if (!p) return;
  const v = document.getElementById(modalId + '-value');
  const m = document.getElementById(modalId + '-msg');
  if (v && !v.value) v.value = p.value;
  if (m && !m.value) m.value = p.msg;
}
</script>
<?php render_foot() ?>
