<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/layout.php';
require_admin();

const POSITIONS = [
    'user_topbar'       => '👤 User — Top bar',
    'user_hero'         => '👤 User — Hero banner',
    'user_infeed'       => '👤 User — In-feed card',
    'user_popup'        => '👤 User — Popup',
    'user_sticky'       => '👤 User — Sticky bar',
    'merchant_hero'     => '🏪 Merchant — Hero',
    'merchant_card'     => '🏪 Merchant — Card',
    'merchant_popup'    => '🏪 Merchant — Popup',
    'admin_alert'       => '🔧 Admin — Alert bar',
];
const BTYPES = [
    'announcement' => 'Announcement bar',
    'image'        => 'Image banner',
    'card'         => 'Card (in-feed)',
    'popup'        => 'Popup modal',
    'sticky'       => 'Sticky bar',
];

// Handle POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $act = $_POST['action'] ?? '';
    $id  = (int)($_POST['id'] ?? 0);

    if ($act === 'toggle') {
        db_run("UPDATE Banner SET isActive = NOT isActive, updatedAt=NOW() WHERE id=?", [$id]);
        flash('success', 'เปลี่ยนสถานะแล้ว');
    } elseif ($act === 'delete') {
        db_run("DELETE FROM Banner WHERE id=?", [$id]);
        flash('success', 'ลบแบนเนอร์แล้ว');
    } elseif ($act === 'save') {
        $data = [
            'position'      => $_POST['position'] ?? 'user_hero',
            'type'          => $_POST['type'] ?? 'announcement',
            'title'         => trim($_POST['title'] ?? ''),
            'body'          => trim($_POST['body'] ?? ''),
            'imageUrl'      => trim($_POST['imageUrl'] ?? ''),
            'linkUrl'       => trim($_POST['linkUrl'] ?? ''),
            'ctaText'       => trim($_POST['ctaText'] ?? ''),
            'bgColor'       => $_POST['bgColor'] ?? '#FD1803',
            'textColor'     => $_POST['textColor'] ?? '#FFFFFF',
            'targetAudience'=> $_POST['targetAudience'] ?? 'all',
            'showMobile'    => isset($_POST['showMobile']) ? 1 : 0,
            'showDesktop'   => isset($_POST['showDesktop']) ? 1 : 0,
            'priority'      => (int)($_POST['priority'] ?? 0),
            'isActive'      => isset($_POST['isActive']) ? 1 : 0,
            'startsAt'      => $_POST['startsAt'] ?: null,
            'endsAt'        => $_POST['endsAt'] ?: null,
        ];
        if ($id) {
            $sets = implode(',', array_map(fn($k) => "`$k`=?", array_keys($data)));
            db_run("UPDATE Banner SET $sets, updatedAt=NOW() WHERE id=?",
                array_merge(array_values($data), [$id]));
            flash('success', 'อัปเดตแบนเนอร์สำเร็จ');
        } else {
            $cols = '`' . implode('`,`', array_keys($data)) . '`,createdAt,updatedAt';
            $ph   = implode(',', array_fill(0, count($data), '?')) . ',NOW(),NOW()';
            db_run("INSERT INTO Banner ($cols) VALUES ($ph)", array_values($data));
            flash('success', 'สร้างแบนเนอร์สำเร็จ');
        }
    }
    header('Location: /hengheng/admin/banners.php');
    exit;
}

$pos_filter = get('pos', 'all');
$page = max(1, (int)get('page', 1));
$limit = 15; $offset = ($page - 1) * $limit;

$where = $pos_filter !== 'all' ? "WHERE position=?" : "WHERE 1";
$params = $pos_filter !== 'all' ? [$pos_filter] : [];
$total = (int)db_val("SELECT COUNT(*) FROM Banner $where", $params);
$pages = max(1, ceil($total / $limit));

$banners = db_all("SELECT * FROM Banner $where ORDER BY priority DESC, createdAt DESC LIMIT $limit OFFSET $offset", $params);

// For edit modal
$edit = null;
if (get('edit')) {
    $edit = db_row("SELECT * FROM Banner WHERE id=?", [(int)get('edit')]);
}

render_head('แบนเนอร์');
render_sidebar('banners');
?>
<div class="main">
<?php render_topbar("แบนเนอร์ ({$total} รายการ)") ?>
<div class="content">
<?php flash_html() ?>

<!-- Filter bar -->
<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px">
  <a href="?pos=all" class="filter-tab <?= $pos_filter==='all'?'active':'' ?>">ทั้งหมด</a>
  <?php foreach (POSITIONS as $v => $l): ?>
  <a href="?pos=<?= $v ?>" class="filter-tab <?= $pos_filter===$v?'active':'' ?>"><?= explode('—', $l)[1] ?? $l ?></a>
  <?php endforeach ?>
</div>

<div style="display:flex;justify-content:flex-end;margin-bottom:12px">
  <button class="btn btn-primary" onclick="openModal('modal-banner-new')"><i class="fa fa-plus"></i> สร้าง Banner</button>
</div>

<!-- List -->
<?php if (empty($banners)): ?>
<div class="card" style="text-align:center;padding:40px;color:#94A3B8">ยังไม่มี banner</div>
<?php else: foreach ($banners as $b): ?>
<div class="card" style="margin-bottom:8px;padding:12px 14px;border:1px solid <?= $b['isActive']?'rgba(22,163,74,.25)':'rgba(0,0,0,.08)' ?>">
  <div style="display:flex;align-items:center;gap:12px">
    <div style="width:36px;height:36px;border-radius:8px;background:<?= htmlspecialchars($b['bgColor']) ?>;flex-shrink:0;
      display:flex;align-items:center;justify-content:center;overflow:hidden">
      <?php if ($b['imageUrl']): ?>
      <img src="<?= htmlspecialchars($b['imageUrl']) ?>" style="width:36px;height:36px;object-fit:cover">
      <?php else: ?>
      <span style="font-size:16px">📢</span>
      <?php endif ?>
    </div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span style="font-weight:600;font-size:13px"><?= htmlspecialchars($b['title'] ?: substr($b['body'] ?? '', 0, 40) ?: '(ไม่มีชื่อ)') ?></span>
        <?= badge($b['isActive']?'approved':'rejected') ?>
        <span style="background:#EFF6FF;color:#1D4ED8;border:1px solid rgba(29,78,216,.15);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600"><?= $b['type'] ?></span>
      </div>
      <p style="font-size:11px;color:#94A3B8;margin-top:2px"><?= POSITIONS[$b['position']] ?? $b['position'] ?></p>
      <div style="display:flex;gap:12px;margin-top:3px;font-size:11px;color:#94A3B8">
        <span>👁 <?= number_format($b['impressions']) ?></span>
        <span>🖱 <?= number_format($b['clicks']) ?></span>
        <?php if ($b['impressions']>0): ?><span style="color:#1D4ED8">CTR <?= round(($b['clicks']/$b['impressions'])*100,1) ?>%</span><?php endif ?>
        <?php if ($b['endsAt']): ?><span style="color:#B45309">หมด <?= format_date_th($b['endsAt']) ?></span><?php endif ?>
      </div>
    </div>
    <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
      <form method="post" style="display:inline">
        <input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= $b['id'] ?>">
        <button class="btn btn-secondary btn-sm" type="submit" title="Toggle"><?= $b['isActive']?'⏸':'▶' ?></button>
      </form>
      <a href="?edit=<?= $b['id'] ?>" class="btn btn-secondary btn-sm"><i class="fa fa-pen"></i></a>
      <form method="post" style="display:inline">
        <input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= $b['id'] ?>">
        <button class="btn btn-danger btn-sm" type="submit" onclick="return confirm('ลบแบนเนอร์นี้?')"><i class="fa fa-trash"></i></button>
      </form>
    </div>
  </div>
</div>
<?php endforeach; endif ?>

<?php if ($pages > 1): ?>
<div class="pagination">
  <?php if ($page>1): ?><a href="?pos=<?= $pos_filter ?>&page=<?= $page-1 ?>" class="page-btn">‹</a><?php endif ?>
  <span class="page-info"><?= $page ?> / <?= $pages ?></span>
  <?php if ($page<$pages): ?><a href="?pos=<?= $pos_filter ?>&page=<?= $page+1 ?>" class="page-btn">›</a><?php endif ?>
</div>
<?php endif ?>

<!-- Modal: New / Edit -->
<?php
$m = $edit ?? [];
$modal_id = $edit ? 'modal-banner-edit' : 'modal-banner-new';
$modal_title = $edit ? 'แก้ไข Banner' : 'สร้าง Banner';
foreach (['modal-banner-new', 'modal-banner-edit'] as $mid):
  if ($mid === 'modal-banner-edit' && !$edit) continue;
  $m = $mid === 'modal-banner-edit' ? $edit : [];
  $v = fn(string $k, string $d='') => htmlspecialchars($m[$k] ?? $d);
?>
<div id="<?= $mid ?>" class="modal-overlay" <?= ($edit && $mid==='modal-banner-edit')?'style="display:flex"':'' ?>>
  <div class="modal" style="max-width:560px">
    <div class="modal-title">
      <?= $mid==='modal-banner-edit'?'✏️ แก้ไข Banner':'+ สร้าง Banner' ?>
      <button class="modal-close" onclick="closeModal('<?= $mid ?>')">✕</button>
    </div>
    <form method="post">
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= $m['id'] ?? 0 ?>">
      <div class="form-grid cols-2" style="gap:10px">
        <div>
          <label class="form-label">Position</label>
          <select class="form-input" name="position">
            <?php foreach (POSITIONS as $pv => $pl): ?>
            <option value="<?= $pv ?>" <?= ($m['position']??'')===$pv?'selected':'' ?>><?= $pl ?></option>
            <?php endforeach ?>
          </select>
        </div>
        <div>
          <label class="form-label">Type</label>
          <select class="form-input" name="type">
            <?php foreach (BTYPES as $tv => $tl): ?>
            <option value="<?= $tv ?>" <?= ($m['type']??'')===$tv?'selected':'' ?>><?= $tl ?></option>
            <?php endforeach ?>
          </select>
        </div>
        <div style="grid-column:1/-1"><label class="form-label">หัวข้อ</label><input class="form-input" name="title" value="<?= $v('title') ?>"></div>
        <div style="grid-column:1/-1">
          <label class="form-label">ข้อความ</label>
          <textarea class="form-input" name="body" rows="2"><?= $v('body') ?></textarea>
        </div>
        <div style="grid-column:1/-1"><label class="form-label">Image URL</label><input class="form-input" name="imageUrl" value="<?= $v('imageUrl') ?>" placeholder="https://..."></div>
        <div><label class="form-label">Link URL</label><input class="form-input" name="linkUrl" value="<?= $v('linkUrl') ?>" placeholder="https://..."></div>
        <div><label class="form-label">CTA text</label><input class="form-input" name="ctaText" value="<?= $v('ctaText') ?>" placeholder="คลิกเลย"></div>
        <div>
          <label class="form-label">สี BG</label>
          <div style="display:flex;gap:6px">
            <input type="color" name="bgColor" value="<?= $v('bgColor','#FD1803') ?>" style="width:36px;height:36px;border:1px solid rgba(0,0,0,.12);border-radius:8px;cursor:pointer;padding:2px">
            <input class="form-input" value="<?= $v('bgColor','#FD1803') ?>" oninput="this.previousElementSibling.value=this.value">
          </div>
        </div>
        <div>
          <label class="form-label">สี Text</label>
          <div style="display:flex;gap:6px">
            <input type="color" name="textColor" value="<?= $v('textColor','#FFFFFF') ?>" style="width:36px;height:36px;border:1px solid rgba(0,0,0,.12);border-radius:8px;cursor:pointer;padding:2px">
            <input class="form-input" value="<?= $v('textColor','#FFFFFF') ?>" oninput="this.previousElementSibling.value=this.value">
          </div>
        </div>
        <div><label class="form-label">เริ่มแสดง</label><input class="form-input" type="datetime-local" name="startsAt" value="<?= $v('startsAt') ?>"></div>
        <div><label class="form-label">หยุดแสดง</label><input class="form-input" type="datetime-local" name="endsAt" value="<?= $v('endsAt') ?>"></div>
        <div><label class="form-label">Priority</label><input class="form-input" type="number" name="priority" value="<?= $v('priority','0') ?>"></div>
        <div style="display:flex;flex-direction:column;justify-content:flex-end;gap:8px;padding-bottom:4px">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" name="isActive" value="1" <?= ($m['isActive']??0)?'checked':'' ?>> เปิดแสดงทันที
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" name="showMobile" value="1" <?= ($m['showMobile']??1)?'checked':'' ?>> แสดงมือถือ
          </label>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,0,0,.06)">
        <button class="btn btn-primary" type="submit"><i class="fa fa-save"></i> <?= $mid==='modal-banner-edit'?'บันทึก':'สร้าง' ?></button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal('<?= $mid ?>')">ยกเลิก</button>
      </div>
    </form>
  </div>
</div>
<?php endforeach ?>

</div></div>
<?php render_foot() ?>
