<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/layout.php';
require_admin();

// Handle approve/reject
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id     = (int)$_POST['merchant_id'];
    $action = $_POST['action'] ?? '';
    if ($action === 'approve') {
        db_run("UPDATE Merchant SET status='approved', isActive=1 WHERE id=?", [$id]);
        flash('success', 'อนุมัติร้านค้าแล้ว');
    } elseif ($action === 'reject') {
        db_run("UPDATE Merchant SET status='rejected', isActive=0 WHERE id=?", [$id]);
        flash('success', 'ปฏิเสธร้านค้าแล้ว');
    } elseif ($action === 'suspend') {
        db_run("UPDATE Merchant SET status='rejected', isActive=0 WHERE id=?", [$id]);
        flash('success', 'ระงับร้านค้าแล้ว');
    }
    header('Location: /hengheng/admin/merchants.php?status=' . get('status', 'pending'));
    exit;
}

$status_filter = get('status', 'pending');
$page   = max(1, (int)get('page', 1));
$limit  = 15;
$offset = ($page - 1) * $limit;

$where  = $status_filter ? "WHERE m.status=?" : "WHERE 1";
$params = $status_filter ? [$status_filter] : [];

$total   = (int)db_val("SELECT COUNT(*) FROM Merchant m $where", $params);
$pages   = max(1, ceil($total / $limit));
$pending = (int)(db_val("SELECT COUNT(*) FROM Merchant WHERE status='pending'") ?: 0);

$merchants = db_all("
    SELECT m.*,
      (SELECT COUNT(*) FROM Receipt WHERE merchantId=m.id) as receipt_count,
      (SELECT COALESCE(SUM(totalCodes),0) FROM MerchantQuota WHERE merchantId=m.id AND isActive=1) as total_quota,
      (SELECT COALESCE(SUM(usedCodes),0)  FROM MerchantQuota WHERE merchantId=m.id AND isActive=1) as used_quota,
      (SELECT COUNT(*) FROM DigitalTicket WHERE merchantId=m.id) as ticket_total,
      (SELECT COUNT(*) FROM DigitalTicket WHERE merchantId=m.id AND status='unclaimed') as ticket_unclaimed,
      (SELECT COUNT(*) FROM DigitalTicket WHERE merchantId=m.id AND status='activated') as ticket_activated
    FROM Merchant m $where
    ORDER BY m.createdAt DESC
    LIMIT $limit OFFSET $offset
", $params);

render_head('ร้านค้าพาร์ทเนอร์');
render_sidebar('merchants');
?>
<div class="main">
<?php render_topbar("ร้านค้าพาร์ทเนอร์ ({$total} ร้าน)") ?>
<div class="content">
<?php flash_html() ?>

<?php if ($pending > 0): ?>
<div class="alert alert-info" style="cursor:pointer" onclick="window.location='?status=pending'">
  🔔 มีร้านค้ารออนุมัติ <b><?= $pending ?> ร้าน</b> — คลิกเพื่อดู
</div>
<?php endif ?>

<div class="filter-tabs">
  <?php foreach (['pending'=>'รออนุมัติ','approved'=>'อนุมัติแล้ว','rejected'=>'ปฏิเสธ',''=>'ทั้งหมด'] as $v=>$l): ?>
  <a href="?status=<?= $v ?>" class="filter-tab <?= $status_filter===$v?'active':'' ?>"><?= $l ?></a>
  <?php endforeach ?>
</div>

<?php if (empty($merchants)): ?>
<div class="card" style="text-align:center;padding:40px;color:#94A3B8">
  <?= $status_filter==='pending' ? 'ไม่มีร้านรออนุมัติ 🎉' : 'ไม่พบร้านค้า' ?>
</div>
<?php else: foreach ($merchants as $m): ?>
<div class="card" style="margin-bottom:10px;border:1px solid <?= $m['status']==='pending'?'rgba(180,83,9,.3)':'rgba(0,0,0,.08)' ?>">
  <div style="display:flex;align-items:flex-start;gap:12px">
    <!-- Avatar -->
    <div style="width:42px;height:42px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;
      justify-content:center;font-weight:700;font-size:16px;color:#1D4ED8;flex-shrink:0">
      <?= mb_substr($m['name'], 0, 1) ?>
    </div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
        <span style="font-weight:700;font-size:14px"><?= htmlspecialchars($m['name']) ?></span>
        <?= badge($m['status']) ?>
        <?php if (!$m['isActive'] && $m['status']==='approved'): ?>
        <span style="background:#FEF2F2;color:#E53E3E;border:1px solid rgba(229,62,62,.2);border-radius:6px;padding:2px 8px;font-size:11px">ระงับ</span>
        <?php endif ?>
      </div>
      <p style="font-size:12px;color:#475569">
        👤 <?= htmlspecialchars($m['ownerName']) ?> · 📞 <?= htmlspecialchars($m['phone']) ?>
      </p>
      <?php if ($m['address']): ?>
      <p style="font-size:11px;color:#94A3B8;margin-top:2px">📍 <?= htmlspecialchars($m['address']) ?></p>
      <?php endif ?>
      <?php if ($m['lat']): ?>
      <p style="font-size:11px;color:#16A34A;font-family:monospace">📌 <?= round($m['lat'],5) ?>, <?= round($m['lng'],5) ?></p>
      <?php endif ?>

      <!-- Stats row -->
      <div style="display:flex;gap:20px;margin-top:8px">
        <?php foreach ([
          ['ใบเสร็จ', $m['receipt_count']],
          ['QR รับแล้ว', $m['total_quota']],
          ['QR ใช้ไป', $m['used_quota']],
          ['ฉลากทั้งหมด', $m['ticket_total']],
          ['Activated', $m['ticket_activated']],
          ['Unclaimed', $m['ticket_unclaimed']],
        ] as [$l, $v]): ?>
        <div>
          <div style="font-size:15px;font-weight:700;color:#0F172A"><?= number_format($v) ?></div>
          <div style="font-size:10px;color:#94A3B8"><?= $l ?></div>
        </div>
        <?php endforeach ?>
      </div>
    </div>

    <!-- Actions -->
    <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
      <form method="post">
        <input type="hidden" name="merchant_id" value="<?= $m['id'] ?>">
        <?php if ($m['status']==='pending'): ?>
          <button class="btn btn-success btn-sm" name="action" value="approve">✅ อนุมัติ</button><br>
          <button class="btn btn-danger btn-sm" name="action" value="reject" style="margin-top:4px">❌ ปฏิเสธ</button>
        <?php elseif ($m['status']==='approved'): ?>
          <button class="btn btn-danger btn-sm" name="action" value="suspend">⏸ ระงับ</button>
        <?php else: ?>
          <button class="btn btn-success btn-sm" name="action" value="approve">♻️ อนุมัติ</button>
        <?php endif ?>
      </form>
    </div>
  </div>
  <p style="font-size:11px;color:#94A3B8;margin-top:8px">
    สมัคร <?= format_date_th($m['createdAt']) ?>
  </p>
</div>
<?php endforeach; endif ?>

<?php if ($pages > 1): ?>
<div class="pagination">
  <?php if ($page>1): ?><a href="?status=<?= $status_filter ?>&page=<?= $page-1 ?>" class="page-btn">‹</a><?php endif ?>
  <span class="page-info"><?= $page ?> / <?= $pages ?></span>
  <?php if ($page<$pages): ?><a href="?status=<?= $status_filter ?>&page=<?= $page+1 ?>" class="page-btn">›</a><?php endif ?>
</div>
<?php endif ?>
</div></div>
<?php render_foot() ?>
