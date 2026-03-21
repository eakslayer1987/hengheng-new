<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/layout.php';
require_admin();

$status_filter = get('status', 'pending');
$page = max(1, (int)get('page', 1));
$limit = 10;
$offset = ($page - 1) * $limit;

$where = $status_filter ? "WHERE r.status=?" : "WHERE 1";
$params = $status_filter ? [$status_filter] : [];

$total = (int)db_val("SELECT COUNT(*) FROM Receipt r $where", $params);
$pages = max(1, ceil($total / $limit));

$receipts = db_all("
    SELECT r.*, m.name as merchant_name, m.phone as merchant_phone
    FROM Receipt r
    JOIN Merchant m ON m.id=r.merchantId
    $where ORDER BY r.submittedAt DESC LIMIT $limit OFFSET $offset
", $params);

$campaign = db_row("SELECT * FROM Campaign WHERE isActive=1 ORDER BY createdAt DESC LIMIT 1");
$codes_per_bag = $campaign ? $campaign['codesPerBag'] : 20;

// Handle approve/reject POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['action'])) {
    $rid = (int)$_POST['receipt_id'];
    $action = $_POST['action'];
    $note = trim($_POST['review_note'] ?? '');

    try {
        $receipt = db_row("SELECT * FROM Receipt WHERE id=?", [$rid]);
        if (!$receipt) throw new RuntimeException('ไม่พบใบเสร็จ');

        if ($action === 'approve') {
            if (!$campaign) throw new RuntimeException('ไม่มีแคมเปญที่เปิดอยู่');

            $total_qr      = $receipt['bagCount'] * $campaign['codesPerBag'];
            $total_tickets = $receipt['bagCount'] * TICKETS_PER_BAG;

            db()->beginTransaction();
            // 1. อนุมัติใบเสร็จ
            db_run("UPDATE Receipt SET status='approved',reviewedAt=NOW(),reviewNote=? WHERE id=?", [$note, $rid]);

            // 2. สร้าง/อัปเดต MerchantQuota
            $existing_quota = db_val("SELECT id FROM MerchantQuota WHERE receiptId=?", [$rid]);
            if ($existing_quota) {
                db_run("UPDATE MerchantQuota SET totalCodes=?,isActive=1 WHERE receiptId=?", [$total_qr, $rid]);
            } else {
                db_run("INSERT INTO MerchantQuota (merchantId,receiptId,campaignId,totalCodes,usedCodes,isActive,createdAt)
                        VALUES (?,?,?,?,0,1,NOW())",
                    [$receipt['merchantId'], $rid, $campaign['id'], $total_qr]);
            }

            // 3. สร้าง DigitalTicket ฉลากดิจิทัล
            $already = db_val("SELECT COUNT(*) FROM DigitalTicket WHERE receiptId=?", [$rid]);
            if (!$already) {
                create_tickets_for_receipt($rid, $receipt['merchantId'], $campaign['id'], $receipt['bagCount']);
            }

            db()->commit();
            flash('success', "อนุมัติแล้ว — QR {$total_qr} รหัส + ฉลากดิจิทัล {$total_tickets} ใบ ({$receipt['bagCount']} ถุง × " . TICKETS_PER_BAG . ")");

        } elseif ($action === 'reject') {
            db_run("UPDATE Receipt SET status='rejected',reviewedAt=NOW(),reviewNote=? WHERE id=?", [$note, $rid]);
            flash('success', 'ปฏิเสธใบเสร็จแล้ว');
        }
    } catch (Throwable $e) {
        if (db()->inTransaction()) db()->rollBack();
        flash('error', $e->getMessage());
    }
    header('Location: /hengheng/admin/receipts.php?status=' . $status_filter);
    exit;
}

render_head('ใบเสร็จ');
render_sidebar('receipts');
?>
<div class="main">
<?php render_topbar("ใบเสร็จ ({$total} รายการ | ตรวจสอบ: {$codes_per_bag} QR/ถุง)") ?>
<div class="content">
<?php flash_html() ?>

<div class="filter-tabs">
  <?php foreach (['pending'=>'รอตรวจสอบ','approved'=>'อนุมัติแล้ว','rejected'=>'ไม่อนุมัติ',''=>'ทั้งหมด'] as $v => $l): ?>
  <a href="?status=<?= $v ?>" class="filter-tab <?= $status_filter===$v?'active':'' ?>"><?= $l ?></a>
  <?php endforeach ?>
</div>

<?php if (empty($receipts)): ?>
<div class="card" style="text-align:center;padding:40px;color:#94A3B8">ไม่พบใบเสร็จ</div>
<?php else: foreach ($receipts as $r):
  $qr = $r['bagCount'] * $codes_per_bag;
  $tickets = $r['bagCount'] * TICKETS_PER_BAG;
?>
<div class="card" style="margin-bottom:12px;border:1px solid <?= $r['status']==='pending'?'rgba(180,83,9,.3)':'rgba(0,0,0,.08)' ?>">
  <div style="display:flex;gap:14px;align-items:flex-start">
    <?php if($r['imageUrl']): ?>
    <img src="<?= htmlspecialchars($r['imageUrl']) ?>" onclick="openImgModal('<?= htmlspecialchars($r['imageUrl']) ?>')"
      style="width:72px;height:72px;border-radius:8px;object-fit:cover;cursor:pointer;border:1px solid rgba(0,0,0,.08);flex-shrink:0">
    <?php endif ?>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
        <span style="font-weight:600;font-size:14px"><?= htmlspecialchars($r['merchant_name']) ?></span>
        <?= badge($r['status']) ?>
      </div>
      <p style="font-size:12px;color:#475569">
        <?= $r['bagCount'] ?> ถุง → <b style="color:#1D4ED8"><?= $qr ?> QR</b> +
        <b style="color:#8B5CF6"><?= $tickets ?> ฉลาก</b>
        · <?= htmlspecialchars($r['merchant_phone']) ?>
      </p>
      <p style="font-size:11px;color:#94A3B8;margin-top:2px"><?= format_date_th($r['submittedAt']) ?></p>
      <?php if ($r['reviewNote']): ?>
      <p style="font-size:11px;color:#E53E3E;margin-top:4px">หมายเหตุ: <?= htmlspecialchars($r['reviewNote']) ?></p>
      <?php endif ?>
    </div>

    <?php if ($r['status'] === 'pending'): ?>
    <button onclick="openModal('modal-<?= $r['id'] ?>')" class="btn btn-secondary btn-sm" style="flex-shrink:0">ตรวจสอบ</button>
    <?php endif ?>
  </div>
</div>

<!-- Modal ตรวจสอบ -->
<?php if ($r['status'] === 'pending'): ?>
<div id="modal-<?= $r['id'] ?>" class="modal-overlay">
  <div class="modal">
    <div class="modal-title">
      ตรวจสอบใบเสร็จ — <?= htmlspecialchars($r['merchant_name']) ?>
      <button class="modal-close" onclick="closeModal('modal-<?= $r['id'] ?>')">✕</button>
    </div>
    <?php if($r['imageUrl']): ?>
    <img src="<?= htmlspecialchars($r['imageUrl']) ?>" style="width:100%;border-radius:8px;margin-bottom:14px;max-height:300px;object-fit:contain">
    <?php endif ?>
    <p style="font-size:13px;color:#475569;margin-bottom:14px">
      <b><?= $r['bagCount'] ?> ถุง</b> → <?= $qr ?> QR + <b style="color:#8B5CF6"><?= $tickets ?> ฉลากดิจิทัล</b>
    </p>
    <form method="post">
      <input type="hidden" name="receipt_id" value="<?= $r['id'] ?>">
      <div class="form-group">
        <label class="form-label">หมายเหตุ (ไม่บังคับ)</label>
        <input class="form-input" name="review_note" placeholder="เช่น ใบเสร็จไม่ชัด...">
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-success" name="action" value="approve">✅ อนุมัติ (<?= $qr ?> QR + <?= $tickets ?> ฉลาก)</button>
        <button class="btn btn-danger" name="action" value="reject">❌ ไม่อนุมัติ</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal('modal-<?= $r['id'] ?>')">ยกเลิก</button>
      </div>
    </form>
  </div>
</div>
<?php endif ?>
<?php endforeach; endif ?>

<!-- Pagination -->
<?php if ($pages > 1): ?>
<div class="pagination">
  <?php if ($page > 1): ?><a href="?status=<?= $status_filter ?>&page=<?= $page-1 ?>" class="page-btn">‹</a><?php endif ?>
  <span class="page-info"><?= $page ?> / <?= $pages ?></span>
  <?php if ($page < $pages): ?><a href="?status=<?= $status_filter ?>&page=<?= $page+1 ?>" class="page-btn">›</a><?php endif ?>
</div>
<?php endif ?>
</div></div>

<!-- Image preview modal -->
<div id="img-modal" class="modal-overlay" onclick="closeModal('img-modal')">
  <div style="max-width:90vw;max-height:90vh;margin:auto">
    <img id="img-preview" style="max-width:90vw;max-height:90vh;border-radius:12px;object-fit:contain">
  </div>
</div>
<script>
function openImgModal(url){document.getElementById('img-preview').src=url;openModal('img-modal')}
</script>
<?php render_foot() ?>
