<?php
require_once __DIR__.'/layout.php';
layout_header('ใบเสร็จ', 'receipts');

$msg = '';
// Handle action
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id     = (int)($_POST['id'] ?? 0);
    $action = $_POST['action'] ?? '';
    $note   = trim($_POST['note'] ?? '');

    if ($id && in_array($action, ['approve','reject'])) {
        $status   = $action === 'approve' ? 'approved' : 'rejected';
        $isActive = $action === 'approve' ? 1 : 0;
        db_run("UPDATE Receipt SET status=?, reviewNote=?, reviewedAt=NOW() WHERE id=?",
               [$status, $note, $id]);

        if ($action === 'approve') {
            // ดึงข้อมูลใบเสร็จ
            $receipt = db_row("SELECT * FROM Receipt WHERE id=?", [$id]);
            if ($receipt) {
                $bagCount  = (int)$receipt['bagCount'];
                $ticketPer = (int)get_config('tickets_per_bag', '20');
                $codePer   = (int)get_config('codes_per_bag', '30');

                // หา campaign active
                $campaign = db_row("SELECT id FROM Campaign WHERE isActive=1 ORDER BY createdAt DESC LIMIT 1");
                if ($campaign) {
                    $cid = $campaign['id'];
                    $mid = $receipt['merchantId'];

                    // สร้าง MerchantQuota
                    db_run("INSERT INTO MerchantQuota (merchantId,receiptId,campaignId,totalCodes,usedCodes,isActive,createdAt)
                            VALUES (?,?,?,?,0,1,NOW())", [$mid, $id, $cid, $bagCount * $codePer]);

                    // สร้าง DigitalTicket
                    $total = $bagCount * $ticketPer;
                    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    for ($i = 0; $i < $total; $i++) {
                        $code = '';
                        for ($j = 0; $j < 6; $j++) $code .= $chars[random_int(0, strlen($chars)-1)];
                        // เช็ค unique
                        $exists = db_val("SELECT id FROM DigitalTicket WHERE ticketCode=?", [$code]);
                        if ($exists) { $i--; continue; }
                        db_run("INSERT INTO DigitalTicket (merchantId,receiptId,campaignId,ticketCode,status,createdAt)
                                VALUES (?,?,?,?,'unclaimed',NOW())", [$mid, $id, $cid, $code]);
                    }
                }
                // อัปเดตร้านค้า isActive
                db_run("UPDATE Merchant SET status='approved',isActive=1 WHERE id=?", [$mid]);
            }
            $msg = "✅ อนุมัติแล้ว สร้างฉลาก {$bagCount} ถุง";
        } else {
            $msg = "❌ ปฏิเสธแล้ว";
        }
    }
}

$filter   = $_GET['status'] ?? 'pending';
$allowed  = ['pending','approved','rejected','all'];
if (!in_array($filter, $allowed)) $filter = 'pending';
$where    = $filter === 'all' ? '1=1' : "r.status='{$filter}'";

$receipts = db_all(
    "SELECT r.*, m.name AS merchantName, m.phone AS merchantPhone
     FROM Receipt r
     LEFT JOIN Merchant m ON m.id=r.merchantId
     WHERE {$where}
     ORDER BY r.submittedAt DESC LIMIT 50"
);
$count = count($receipts);
?>

<div class="card">
  <div class="card-title" style="justify-content:space-between">
    <span>📋 ใบเสร็จ</span>
    <span style="font-size:12px;color:rgba(150,170,210,.5)"><?= $count ?> รายการ</span>
  </div>

  <!-- Filter -->
  <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
    <?php foreach(['pending'=>'⏳ รอ','approved'=>'✅ อนุมัติ','rejected'=>'❌ ปฏิเสธ','all'=>'ทั้งหมด'] as $k=>$l): ?>
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

  <?php if(empty($receipts)): ?>
  <p style="color:rgba(150,170,210,.4);font-size:13px;padding:16px 0">ไม่มีรายการ</p>
  <?php else: ?>
  <?php foreach($receipts as $r): ?>
  <div style="border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px;margin-bottom:10px">
    <div style="display:flex;gap:12px;align-items:flex-start">
      <?php if($r['imageUrl']): ?>
      <img src="<?= htmlspecialchars(str_starts_with($r['imageUrl'],'/') ? 'https://ปังจัง.com'.$r['imageUrl'] : $r['imageUrl']) ?>"
           style="width:80px;height:80px;border-radius:10px;object-fit:cover;border:1px solid rgba(255,255,255,.08);flex-shrink:0"
           onerror="this.style.display='none'">
      <?php endif; ?>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
          <strong style="font-size:14px"><?= htmlspecialchars($r['merchantName']??'—') ?></strong>
          <span class="badge-<?= $r['status']==='approved'?'ok':($r['status']==='pending'?'pending':'bad') ?>">
            <?= $r['status']==='approved'?'✅ อนุมัติ':($r['status']==='pending'?'⏳ รอ':'❌ ปฏิเสธ') ?>
          </span>
        </div>
        <p style="font-size:12px;color:rgba(200,220,255,.6)">📞 <?= htmlspecialchars($r['merchantPhone']??'—') ?></p>
        <p style="font-size:12px;color:rgba(200,220,255,.6)">
          🛍️ <?= $r['bagCount'] ?> ถุง ·
          <?= date('d/m/Y H:i', strtotime($r['submittedAt'])) ?>
        </p>
        <?php if($r['reviewNote']): ?>
        <p style="font-size:11px;color:rgba(150,170,210,.5);margin-top:4px">💬 <?= htmlspecialchars($r['reviewNote']) ?></p>
        <?php endif; ?>
      </div>
    </div>

    <?php if($r['status'] === 'pending'): ?>
    <div style="display:flex;gap:8px;margin-top:12px">
      <form method="POST" style="flex:1">
        <input type="hidden" name="id" value="<?= $r['id'] ?>">
        <input type="hidden" name="action" value="approve">
        <button type="submit" class="btn btn-ok" style="width:100%;justify-content:center">
          ✅ อนุมัติ + ออกฉลาก
        </button>
      </form>
      <form method="POST" style="flex:1" onsubmit="return confirm('ปฏิเสธใบเสร็จนี้?')">
        <input type="hidden" name="id" value="<?= $r['id'] ?>">
        <input type="hidden" name="action" value="reject">
        <button type="submit" class="btn btn-bad" style="width:100%;justify-content:center">
          ❌ ปฏิเสธ
        </button>
      </form>
    </div>
    <?php endif; ?>
  </div>
  <?php endforeach; ?>
  <?php endif; ?>
</div>

<?php layout_footer(); ?>
