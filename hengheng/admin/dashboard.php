<?php
require_once __DIR__.'/layout.php';
layout_header('ภาพรวม', 'dashboard');

$total_merchants  = (int)db_val("SELECT COUNT(*) FROM Merchant WHERE status='approved'");
$pending_merchant = (int)db_val("SELECT COUNT(*) FROM Merchant WHERE status='pending'");
$pending_receipts = (int)db_val("SELECT COUNT(*) FROM Receipt WHERE status='pending'");
$today_start      = date('Y-m-d 00:00:00');
$today_scans      = (int)db_val("SELECT COUNT(*) FROM DigitalTicket WHERE status='activated' AND activatedAt>=?", [$today_start]);
$total_tickets    = (int)db_val("SELECT COUNT(*) FROM DigitalTicket");
$total_winners    = (int)db_val("SELECT COUNT(*) FROM DigitalTicket WHERE isWinner=1");
$total_quota      = (int)db_val("SELECT COALESCE(SUM(totalCodes),0) FROM MerchantQuota");
$used_quota       = (int)db_val("SELECT COALESCE(SUM(usedCodes),0) FROM MerchantQuota");

$recent_scans = db_all(
    "SELECT dt.ticketCode, dt.customerName, dt.customerPhone, dt.activatedAt,
            m.name AS merchantName
     FROM DigitalTicket dt
     JOIN Merchant m ON m.id=dt.merchantId
     WHERE dt.status='activated'
     ORDER BY dt.activatedAt DESC LIMIT 10"
);
?>

<div class="card">
  <div class="card-title">📊 ภาพรวมระบบ</div>
  <div class="grid-3">
    <div class="kpi"><div class="num" style="color:#58a6ff"><?= $total_merchants ?></div><div class="lbl">ร้านค้าอนุมัติแล้ว</div></div>
    <div class="kpi"><div class="num" style="color:#E8B820"><?= $pending_merchant + $pending_receipts ?></div><div class="lbl">รอดำเนินการ</div></div>
    <div class="kpi"><div class="num" style="color:#3fb950"><?= $today_scans ?></div><div class="lbl">สแกนวันนี้</div></div>
    <div class="kpi"><div class="num" style="color:#58a6ff"><?= $total_quota ?></div><div class="lbl">QR ทั้งหมด</div></div>
    <div class="kpi"><div class="num" style="color:#f85149"><?= $used_quota ?></div><div class="lbl">ใช้ไปแล้ว</div></div>
    <div class="kpi"><div class="num" style="color:#E8B820"><?= $total_winners ?></div><div class="lbl">ผู้โชคดี</div></div>
  </div>
</div>

<?php if($pending_receipts > 0): ?>
<div class="alert alert-bad">
  ⚠️ มีใบเสร็จรอการอนุมัติ <strong><?= $pending_receipts ?> รายการ</strong>
  <a href="receipts.php" style="margin-left:12px;text-decoration:underline">→ ไปอนุมัติ</a>
</div>
<?php endif; ?>

<?php if($pending_merchant > 0): ?>
<div class="alert alert-bad" style="background:rgba(232,184,32,.08);border-color:rgba(232,184,32,.3);color:#E8B820">
  ⏳ มีร้านค้ารอการอนุมัติ <strong><?= $pending_merchant ?> ร้าน</strong>
  <a href="merchants.php" style="margin-left:12px;text-decoration:underline">→ ไปอนุมัติ</a>
</div>
<?php endif; ?>

<div class="card">
  <div class="card-title">📱 สแกนล่าสุด</div>
  <?php if(empty($recent_scans)): ?>
  <p style="color:rgba(150,170,210,.4);font-size:13px;padding:12px 0">ยังไม่มีข้อมูล</p>
  <?php else: ?>
  <table>
    <tr><th>โค้ด</th><th>ลูกค้า</th><th>ร้าน</th><th>เวลา</th></tr>
    <?php foreach($recent_scans as $s): ?>
    <tr>
      <td><span style="font-family:monospace;font-weight:700;letter-spacing:2px;color:#E8B820">
        <?= htmlspecialchars($s['ticketCode']) ?></span></td>
      <td><?= htmlspecialchars($s['customerName']??'—') ?>
          <span style="font-size:11px;color:rgba(150,170,210,.5)"> <?= htmlspecialchars($s['customerPhone']??'') ?></span></td>
      <td style="font-size:12px"><?= htmlspecialchars($s['merchantName']) ?></td>
      <td style="font-size:11px;color:rgba(150,170,210,.5)">
        <?= $s['activatedAt'] ? date('d/m H:i', strtotime($s['activatedAt'])) : '—' ?></td>
    </tr>
    <?php endforeach; ?>
  </table>
  <?php endif; ?>
</div>

<?php layout_footer(); ?>
