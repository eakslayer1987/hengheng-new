<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/layout.php';
require_admin();

// Handle claim status update
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id     = (int)$_POST['entry_id'];
    $status = $_POST['claim_status'] ?? '';
    if (in_array($status, ['pending','claimed','expired'])) {
        db_run("UPDATE CollectedCode SET claimStatus=? WHERE id=?", [$status, $id]);
        flash('success', 'อัปเดตสถานะสำเร็จ');
    }
    header('Location: /hengheng/admin/entries.php?' . http_build_query($_GET));
    exit;
}

$search      = trim(get('search', ''));
$winner      = get('winner', '');
$claim_status= get('claim_status', '');
$page        = max(1, (int)get('page', 1));
$limit       = 15;
$offset      = ($page - 1) * $limit;

$where_parts = ["1=1"];
$params      = [];

if ($search) {
    $where_parts[] = "(e.customerName LIKE ? OR e.customerPhone LIKE ? OR e.code LIKE ?)";
    $s = "%$search%";
    array_push($params, $s, $s, $s);
}
if ($winner === 'yes') { $where_parts[] = "e.isWinner=1"; }
if ($winner === 'no')  { $where_parts[] = "e.isWinner=0"; }
if ($claim_status)     { $where_parts[] = "e.claimStatus=?"; $params[] = $claim_status; }

$where = implode(' AND ', $where_parts);
$total = (int)db_val("SELECT COUNT(*) FROM CollectedCode e WHERE $where", $params);
$pages = max(1, ceil($total / $limit));

$entries = db_all("
    SELECT e.*, m.name as merchant_name, c.name as campaign_name
    FROM CollectedCode e
    LEFT JOIN Merchant m ON m.id=e.merchantId
    LEFT JOIN Campaign c ON c.id=e.campaignId
    WHERE $where
    ORDER BY e.collectedAt DESC
    LIMIT $limit OFFSET $offset
", $params);

const CLAIM_LABELS = ['pending'=>'รอรับ','claimed'=>'รับแล้ว','expired'=>'หมดอายุ'];
const CLAIM_COLORS = ['pending'=>'#B45309','claimed'=>'#16A34A','expired'=>'#94A3B8'];

render_head('ผู้เข้าร่วม');
render_sidebar('entries');
?>
<div class="main">
<?php render_topbar("ผู้เข้าร่วม (<?= number_format($total) ?> รายการ)") ?>
<div class="content">
<?php flash_html() ?>

<!-- Filters -->
<form method="get" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
  <div style="position:relative;flex:1;min-width:200px">
    <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94A3B8;font-size:12px"></i>
    <input class="form-input" style="padding-left:30px" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="ค้นหาชื่อ/เบอร์/รหัส">
  </div>
  <select class="form-input" style="width:130px" name="winner">
    <option value="">สถานะทั้งหมด</option>
    <option value="yes" <?= $winner==='yes'?'selected':'' ?>>ผู้โชคดี</option>
    <option value="no"  <?= $winner==='no'?'selected':'' ?>>รอลุ้น</option>
  </select>
  <select class="form-input" style="width:130px" name="claim_status">
    <option value="">การรับรางวัล</option>
    <option value="pending" <?= $claim_status==='pending'?'selected':'' ?>>รอรับ</option>
    <option value="claimed" <?= $claim_status==='claimed'?'selected':'' ?>>รับแล้ว</option>
    <option value="expired" <?= $claim_status==='expired'?'selected':'' ?>>หมดอายุ</option>
  </select>
  <button class="btn btn-primary" type="submit"><i class="fa fa-search"></i></button>
  <a href="/hengheng/admin/entries.php" class="btn btn-secondary"><i class="fa fa-rotate-left"></i></a>
</form>

<div class="table-wrap">
  <table>
    <thead><tr>
      <th>ชื่อ / เบอร์</th><th>โค้ด</th><th>ร้านค้า</th>
      <th>สถานะ</th><th>วันที่</th><th>การดำเนินการ</th>
    </tr></thead>
    <tbody>
    <?php if (empty($entries)): ?>
    <tr><td colspan="6" style="text-align:center;padding:40px;color:#94A3B8">ไม่พบข้อมูล</td></tr>
    <?php else: foreach ($entries as $e): ?>
    <tr>
      <td>
        <div style="font-weight:500;font-size:13px"><?= htmlspecialchars($e['customerName']) ?></div>
        <div style="font-size:11px;color:#94A3B8"><?= htmlspecialchars($e['customerPhone']) ?></div>
      </td>
      <td><code style="font-size:12px;color:#1D4ED8;font-weight:600"><?= htmlspecialchars($e['code']) ?></code></td>
      <td style="font-size:12px;color:#475569"><?= htmlspecialchars($e['merchant_name'] ?? '—') ?></td>
      <td>
        <div style="display:flex;flex-direction:column;gap:3px">
          <?= badge($e['isWinner']?'approved':'rejected') ?>
          <?php if ($e['isWinner']): ?>
          <?php
            $cl = $e['claimStatus'] ?? 'pending';
            $cc = CLAIM_COLORS[$cl] ?? '#94A3B8';
            $clabel = CLAIM_LABELS[$cl] ?? $cl;
          ?>
          <span style="background:<?= $cc ?>15;color:<?= $cc ?>;border:1px solid <?= $cc ?>30;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600">
            <?= $clabel ?>
          </span>
          <?php endif ?>
        </div>
      </td>
      <td style="font-size:11px;color:#94A3B8;white-space:nowrap"><?= format_date_th($e['collectedAt']) ?></td>
      <td>
        <?php if ($e['isWinner'] && ($e['claimStatus'] ?? 'pending') === 'pending'): ?>
        <div style="display:flex;gap:4px">
          <form method="post" style="display:inline">
            <input type="hidden" name="entry_id" value="<?= $e['id'] ?>">
            <button class="btn btn-success btn-sm" name="claim_status" value="claimed">✅ รับแล้ว</button>
          </form>
          <form method="post" style="display:inline">
            <input type="hidden" name="entry_id" value="<?= $e['id'] ?>">
            <button class="btn btn-danger btn-sm" name="claim_status" value="expired">❌ หมดอายุ</button>
          </form>
        </div>
        <?php endif ?>
      </td>
    </tr>
    <?php endforeach; endif ?>
    </tbody>
  </table>
</div>

<?php if ($pages > 1): ?>
<div class="pagination">
  <?php if ($page>1): ?>
  <a href="?search=<?= urlencode($search) ?>&winner=<?= $winner ?>&claim_status=<?= $claim_status ?>&page=<?= $page-1 ?>" class="page-btn">‹</a>
  <?php endif ?>
  <span class="page-info"><?= $page ?> / <?= $pages ?></span>
  <?php if ($page<$pages): ?>
  <a href="?search=<?= urlencode($search) ?>&winner=<?= $winner ?>&claim_status=<?= $claim_status ?>&page=<?= $page+1 ?>" class="page-btn">›</a>
  <?php endif ?>
</div>
<?php endif ?>
</div></div>
<?php render_foot() ?>
