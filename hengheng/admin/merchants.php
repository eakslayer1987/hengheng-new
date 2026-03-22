<?php
require_once __DIR__.'/layout.php';
layout_header('ร้านค้า', 'merchants');

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id     = (int)($_POST['id'] ?? 0);
    $action = $_POST['action'] ?? '';
    if ($id && in_array($action, ['approve','reject','toggle'])) {
        if ($action === 'approve') {
            db_run("UPDATE Merchant SET status='approved',isActive=1 WHERE id=?", [$id]);
            $msg = '✅ อนุมัติร้านค้าแล้ว';
        } elseif ($action === 'reject') {
            db_run("UPDATE Merchant SET status='rejected',isActive=0 WHERE id=?", [$id]);
            $msg = '❌ ปฏิเสธร้านค้าแล้ว';
        } elseif ($action === 'toggle') {
            $cur = (int)db_val("SELECT isActive FROM Merchant WHERE id=?", [$id]);
            db_run("UPDATE Merchant SET isActive=? WHERE id=?", [$cur?0:1, $id]);
            $msg = $cur ? '⛔ ปิดร้านแล้ว' : '✅ เปิดร้านแล้ว';
        }
    }
}

$filter  = $_GET['status'] ?? 'pending';
$allowed = ['pending','approved','all'];
if (!in_array($filter, $allowed)) $filter = 'pending';
$where   = $filter === 'all' ? '1=1' : "m.status='{$filter}'";

$merchants = db_all(
    "SELECT m.*,
            COALESCE(SUM(mq.totalCodes),0) AS totalQr,
            COALESCE(SUM(mq.usedCodes),0) AS usedQr,
            COUNT(DISTINCT dt.id) AS totalTickets
     FROM Merchant m
     LEFT JOIN MerchantQuota mq ON mq.merchantId=m.id AND mq.isActive=1
     LEFT JOIN DigitalTicket dt ON dt.merchantId=m.id AND dt.status='activated'
     WHERE {$where}
     GROUP BY m.id
     ORDER BY m.createdAt DESC LIMIT 50"
);
?>

<div class="card">
  <div class="card-title" style="justify-content:space-between">
    <span>🏪 ร้านค้า</span>
    <span style="font-size:12px;color:rgba(150,170,210,.5)"><?= count($merchants) ?> ร้าน</span>
  </div>

  <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
    <?php foreach(['pending'=>'⏳ รอ','approved'=>'✅ อนุมัติ','all'=>'ทั้งหมด'] as $k=>$l): ?>
    <a href="?status=<?= $k ?>"
       style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:700;
              background:<?= $filter===$k?'rgba(232,184,32,.15)':'rgba(255,255,255,.04)' ?>;
              color:<?= $filter===$k?'#E8B820':'rgba(150,170,210,.5)' ?>;
              border:1px solid <?= $filter===$k?'rgba(232,184,32,.4)':'rgba(255,255,255,.06)' ?>">
      <?= $l ?>
    </a>
    <?php endforeach; ?>
  </div>

  <?php if($msg): ?>
  <div class="alert <?= str_starts_with($msg,'✅')?'alert-ok':'alert-bad' ?>"><?= htmlspecialchars($msg) ?></div>
  <?php endif; ?>

  <?php if(empty($merchants)): ?>
  <p style="color:rgba(150,170,210,.4);font-size:13px;padding:16px 0">ไม่มีรายการ</p>
  <?php else: ?>
  <table>
    <tr>
      <th>ร้านค้า</th><th>QR</th><th>สแกน</th><th>สถานะ</th><th>จัดการ</th>
    </tr>
    <?php foreach($merchants as $m): ?>
    <tr>
      <td>
        <strong><?= htmlspecialchars($m['name']) ?></strong><br>
        <span style="font-size:11px;color:rgba(150,170,210,.5)">
          👤 <?= htmlspecialchars($m['ownerName']) ?> · <?= htmlspecialchars($m['phone']??'—') ?>
        </span><br>
        <span style="font-size:10px;color:rgba(150,170,210,.4)">📍 <?= htmlspecialchars(substr($m['address']??'—',0,40)) ?></span>
      </td>
      <td style="text-align:center">
        <span style="font-size:18px;font-weight:900;color:#E8B820"><?= max(0,(int)$m['totalQr']-(int)$m['usedQr']) ?></span>
        <br><span style="font-size:10px;color:rgba(150,170,210,.4)">เหลือ</span>
      </td>
      <td style="text-align:center">
        <span style="font-size:16px;font-weight:900;color:#3fb950"><?= (int)$m['totalTickets'] ?></span>
        <br><span style="font-size:10px;color:rgba(150,170,210,.4)">ฉลาก</span>
      </td>
      <td>
        <span class="badge-<?= $m['status']==='approved'?'ok':($m['status']==='pending'?'pending':'bad') ?>">
          <?= $m['status']==='approved'?'✅':($m['status']==='pending'?'⏳':'❌') ?>
          <?= $m['status'] ?>
        </span>
        <?php if($m['status']==='approved'): ?>
        <br><span style="font-size:10px;color:<?= $m['isActive']?'#3fb950':'#f85149' ?>">
          <?= $m['isActive']?'🟢 เปิด':'🔴 ปิด' ?>
        </span>
        <?php endif; ?>
      </td>
      <td>
        <div style="display:flex;flex-direction:column;gap:5px">
          <?php if($m['status']==='pending'): ?>
          <form method="POST">
            <input type="hidden" name="id" value="<?= $m['id'] ?>">
            <input type="hidden" name="action" value="approve">
            <button class="btn btn-ok" style="font-size:11px;padding:4px 10px">✅ อนุมัติ</button>
          </form>
          <form method="POST" onsubmit="return confirm('ปฏิเสธร้านนี้?')">
            <input type="hidden" name="id" value="<?= $m['id'] ?>">
            <input type="hidden" name="action" value="reject">
            <button class="btn btn-bad" style="font-size:11px;padding:4px 10px">❌ ปฏิเสธ</button>
          </form>
          <?php elseif($m['status']==='approved'): ?>
          <form method="POST">
            <input type="hidden" name="id" value="<?= $m['id'] ?>">
            <input type="hidden" name="action" value="toggle">
            <button class="btn btn-sec" style="font-size:11px;padding:4px 10px">
              <?= $m['isActive']?'⛔ ปิด':'✅ เปิด' ?>
            </button>
          </form>
          <?php endif; ?>
        </div>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>
  <?php endif; ?>
</div>

<?php layout_footer(); ?>
