<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/layout.php';
require_admin();

$status = get('status', '');
$search = trim(get('search', ''));
$page   = max(1, (int)get('page', 1));
$limit  = 20;
$offset = ($page - 1) * $limit;

$where_parts = ["1=1"];
$params = [];
if ($status) { $where_parts[] = "t.status=?"; $params[] = $status; }
if ($search) {
    $where_parts[] = "(t.ticketCode LIKE ? OR m.name LIKE ? OR t.customerPhone LIKE ? OR t.customerName LIKE ?)";
    $s = "%$search%";
    array_push($params, $s, $s, $s, $s);
}
$where = implode(' AND ', $where_parts);

$total  = (int)db_val("SELECT COUNT(*) FROM DigitalTicket t JOIN Merchant m ON m.id=t.merchantId WHERE $where", $params);
$pages  = max(1, ceil($total / $limit));

$tickets = db_all("
    SELECT t.*, m.name as merchant_name, m.phone as merchant_phone
    FROM DigitalTicket t
    JOIN Merchant m ON m.id=t.merchantId
    WHERE $where
    ORDER BY t.createdAt DESC
    LIMIT $limit OFFSET $offset
", $params);

// Summary stats
$summary = [
    'total'     => db_val("SELECT COUNT(*) FROM DigitalTicket") ?: 0,
    'unclaimed' => db_val("SELECT COUNT(*) FROM DigitalTicket WHERE status='unclaimed'") ?: 0,
    'activated' => db_val("SELECT COUNT(*) FROM DigitalTicket WHERE status='activated'") ?: 0,
    'winners'   => db_val("SELECT COUNT(*) FROM DigitalTicket WHERE isWinner=1") ?: 0,
];

// Double Win verify
$verify_code   = trim(get('verify', ''));
$verify_result = null;
if ($verify_code) {
    $verify_result = db_row("
        SELECT t.*, m.name as merchant_name, m.phone as merchant_phone,
               r.bagCount
        FROM DigitalTicket t
        JOIN Merchant m ON m.id=t.merchantId
        JOIN Receipt r ON r.id=t.receiptId
        WHERE t.ticketCode=?
    ", [$verify_code]);
}

render_head('ฉลากดิจิทัล');
render_sidebar('tickets');
?>
<div class="main">
<?php render_topbar("ฉลากดิจิทัล ({$summary['total']} ใบ)") ?>
<div class="content">
<?php flash_html() ?>

<!-- Stats cards -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
  <?php foreach ([
    ['ทั้งหมด', $summary['total'], '#6366F1', '#EEF2FF'],
    ['Unclaimed ⊙', $summary['unclaimed'], '#B45309', '#FFFBEB'],
    ['Activated ✅', $summary['activated'], '#16A34A', '#F0FDF4'],
    ['ผู้โชคดี 🏆', $summary['winners'], '#F59E0B', '#FFFBEB'],
  ] as [$label, $val, $color, $bg]): ?>
  <div style="background:<?= $bg ?>;border:1px solid <?= $color ?>20;border-radius:12px;padding:14px;text-align:center">
    <div style="font-size:22px;font-weight:700;color:<?= $color ?>"><?= number_format($val) ?></div>
    <div style="font-size:11px;color:#94A3B8;margin-top:2px"><?= $label ?></div>
  </div>
  <?php endforeach ?>
</div>

<div style="display:grid;grid-template-columns:1fr 340px;gap:16px;margin-bottom:20px">

<!-- Filters + Table -->
<div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
    <form method="get" style="display:flex;gap:8px;flex-wrap:wrap;width:100%">
      <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="ค้นหาโค้ด/ร้าน/เบอร์/ชื่อ"
        class="form-input" style="flex:1;min-width:200px">
      <select name="status" class="form-input" style="width:140px">
        <option value="">ทั้งหมด</option>
        <option value="unclaimed" <?= $status==='unclaimed'?'selected':'' ?>>Unclaimed</option>
        <option value="activated" <?= $status==='activated'?'selected':'' ?>>Activated</option>
      </select>
      <button class="btn btn-primary" type="submit"><i class="fa fa-search"></i> ค้นหา</button>
      <a href="?status=<?= $status ?>" class="btn btn-secondary"><i class="fa fa-rotate-left"></i></a>
    </form>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <span style="font-size:13px;color:#475569">พบ <?= number_format($total) ?> รายการ</span>
    <a href="/hengheng/api/export_draw.php" class="btn btn-gold btn-sm">
      <i class="fa fa-download"></i> Export CSV (<?= number_format($summary['activated']) ?> Activated)
    </a>
  </div>

  <div class="table-wrap">
    <table>
      <thead><tr>
        <th>โค้ด 6 หลัก</th><th>ร้านค้า</th><th>สถานะ</th>
        <th>ลูกค้า</th><th>เปิดใช้เมื่อ</th><th>รางวัล</th>
      </tr></thead>
      <tbody>
      <?php if (empty($tickets)): ?>
      <tr><td colspan="6" style="text-align:center;padding:40px;color:#94A3B8">ไม่พบข้อมูล</td></tr>
      <?php else: foreach ($tickets as $t): ?>
      <tr>
        <td>
          <span style="font-family:monospace;font-size:16px;font-weight:900;letter-spacing:3px;
            color:<?= $t['status']==='activated'?'#16A34A':'#6366F1' ?>">
            <?= htmlspecialchars($t['ticketCode']) ?>
          </span>
        </td>
        <td>
          <div style="font-weight:500;font-size:13px"><?= htmlspecialchars($t['merchant_name']) ?></div>
          <div style="font-size:11px;color:#94A3B8"><?= htmlspecialchars($t['merchant_phone']) ?></div>
        </td>
        <td><?= badge($t['status']) ?></td>
        <td>
          <?php if ($t['customerPhone']): ?>
          <div style="font-size:13px"><?= htmlspecialchars($t['customerName'] ?? '—') ?></div>
          <div style="font-size:11px;color:#94A3B8"><?= htmlspecialchars($t['customerPhone']) ?></div>
          <?php else: ?>
          <span style="color:#94A3B8">—</span>
          <?php endif ?>
        </td>
        <td style="font-size:11px;color:#94A3B8;white-space:nowrap">
          <?= $t['activatedAt'] ? format_date_th($t['activatedAt']) : '—' ?>
        </td>
        <td>
          <?php if ($t['isWinner']): ?><?= badge('winner') ?><?php endif ?>
        </td>
      </tr>
      <?php endforeach; endif ?>
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <?php if ($pages > 1): ?>
  <div class="pagination">
    <?php if ($page>1): ?><a href="?search=<?= urlencode($search) ?>&status=<?= $status ?>&page=<?= $page-1 ?>" class="page-btn">‹</a><?php endif ?>
    <span class="page-info"><?= $page ?> / <?= $pages ?></span>
    <?php if ($page<$pages): ?><a href="?search=<?= urlencode($search) ?>&status=<?= $status ?>&page=<?= $page+1 ?>" class="page-btn">›</a><?php endif ?>
  </div>
  <?php endif ?>
</div>

<!-- Double Win Verifier -->
<div>
  <div class="dw-box">
    <div style="font-size:14px;font-weight:600;color:#B45309;margin-bottom:12px">🏆 ตรวจสอบ Double Win</div>
    <form method="get">
      <input type="hidden" name="status" value="<?= htmlspecialchars($status) ?>">
      <input type="text" name="verify" value="<?= htmlspecialchars($verify_code) ?>"
        class="dw-code-input" maxlength="6" pattern="\d{6}" placeholder="______"
        oninput="this.value=this.value.replace(/\D/g,'').slice(0,6)" autocomplete="off">
      <div style="margin-top:10px">
        <button class="btn btn-gold" style="width:100%" type="submit">
          <i class="fa fa-magnifying-glass"></i> ตรวจสอบ
        </button>
      </div>
    </form>

    <?php if ($verify_code && !$verify_result): ?>
    <div class="alert alert-error" style="margin-top:12px">❌ ไม่พบฉลากหมายเลข <?= htmlspecialchars($verify_code) ?></div>
    <?php elseif ($verify_result): ?>
    <div style="margin-top:12px">
      <div style="text-align:center;margin-bottom:12px">
        <span style="font-family:monospace;font-size:28px;font-weight:900;letter-spacing:6px;
          color:<?= $verify_result['status']==='activated'?'#B45309':'#94A3B8' ?>">
          <?= htmlspecialchars($verify_result['ticketCode']) ?>
        </span>
        <br>
        <div style="margin-top:6px"><?= badge($verify_result['status']) ?></div>
      </div>

      <?php if ($verify_result['status'] === 'activated'): ?>
      <!-- Double Win Result -->
      <div style="background:linear-gradient(145deg,#1a0800,#2a1200);border:2px solid #F59E0B;border-radius:12px;padding:14px;text-align:center;margin-bottom:10px">
        <div style="font-size:12px;font-weight:700;color:#F59E0B;letter-spacing:1px;margin-bottom:8px">🏆 DOUBLE WIN! 🏆</div>
        <div class="dw-result">
          <div class="dw-card dw-merchant">
            <div style="font-size:10px;color:#B45309;font-weight:700;margin-bottom:4px">🏪 ต้นขั้ว (ร้านค้า)</div>
            <div style="font-weight:700;color:#0F172A;font-size:13px"><?= htmlspecialchars($verify_result['merchant_name']) ?></div>
            <div style="font-size:11px;color:#94A3B8"><?= htmlspecialchars($verify_result['merchant_phone']) ?></div>
            <div style="margin-top:8px;background:#B4530920;border-radius:6px;padding:4px 8px;font-size:11px;color:#B45309;font-weight:700">รับ 50%</div>
          </div>
          <div class="dw-card dw-customer">
            <div style="font-size:10px;color:#16A34A;font-weight:700;margin-bottom:4px">👤 หางตั๋ว (ลูกค้า)</div>
            <div style="font-weight:700;color:#0F172A;font-size:13px"><?= htmlspecialchars($verify_result['customerName'] ?? '—') ?></div>
            <div style="font-size:11px;color:#94A3B8"><?= htmlspecialchars($verify_result['customerPhone'] ?? '') ?></div>
            <div style="margin-top:8px;background:#16A34A20;border-radius:6px;padding:4px 8px;font-size:11px;color:#16A34A;font-weight:700">รับ 50%</div>
          </div>
        </div>
        <div style="margin-top:10px;font-size:11px;color:#94A3B8">
          เปิดใช้: <?= format_date_th($verify_result['activatedAt']) ?>
        </div>
      </div>
      <!-- Mark as winner -->
      <?php if (!$verify_result['isWinner']): ?>
      <form method="post" action="/hengheng/api/mark_winner.php">
        <input type="hidden" name="ticket_code" value="<?= htmlspecialchars($verify_result['ticketCode']) ?>">
        <input type="hidden" name="redirect" value="/hengheng/admin/tickets.php?verify=<?= urlencode($verify_code) ?>">
        <button class="btn btn-gold" style="width:100%;margin-top:8px" type="submit">
          <i class="fa fa-trophy"></i> บันทึกเป็นผู้โชคดี
        </button>
      </form>
      <?php else: ?>
      <div class="alert alert-success" style="margin-top:8px">✅ บันทึกเป็นผู้โชคดีแล้ว</div>
      <?php endif ?>

      <?php else: ?>
      <div class="alert alert-info" style="margin-top:8px">⊙ ฉลากนี้ยัง Unclaimed — ลูกค้ายังไม่ได้ดึงหางตั๋ว (ไม่นำมาโปรยจับรางวัล)</div>
      <?php endif ?>
    </div>
    <?php endif ?>
  </div>
</div>

</div><!-- end grid -->
</div></div>
<?php render_foot() ?>
