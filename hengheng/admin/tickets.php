<?php
require_once __DIR__.'/layout.php';
layout_header('ฉลาก', 'tickets');

$search = trim($_GET['q'] ?? '');
$filter = $_GET['status'] ?? 'activated';

$where  = "1=1";
$params = [];
if ($filter === 'activated') { $where .= " AND dt.status='activated'"; }
if ($filter === 'unclaimed') { $where .= " AND dt.status='unclaimed'"; }
if ($filter === 'winner')    { $where .= " AND dt.isWinner=1"; }
if ($search) {
    $where .= " AND (dt.ticketCode LIKE ? OR dt.customerPhone LIKE ? OR dt.customerName LIKE ?)";
    $params = array_merge($params, ["%$search%", "%$search%", "%$search%"]);
}

$tickets = db_all(
    "SELECT dt.*, m.name AS merchantName
     FROM DigitalTicket dt
     LEFT JOIN Merchant m ON m.id=dt.merchantId
     WHERE {$where}
     ORDER BY dt.activatedAt DESC, dt.createdAt DESC
     LIMIT 80",
    $params
);

$total_activated = (int)db_val("SELECT COUNT(*) FROM DigitalTicket WHERE status='activated'");
$total_unclaimed = (int)db_val("SELECT COUNT(*) FROM DigitalTicket WHERE status='unclaimed'");
$total_winners   = (int)db_val("SELECT COUNT(*) FROM DigitalTicket WHERE isWinner=1");
?>

<div class="card">
  <div class="card-title">🎫 ฉลากดิจิทัล</div>
  <div class="grid-3" style="margin-bottom:14px">
    <div class="kpi"><div class="num" style="color:#3fb950"><?= $total_activated ?></div><div class="lbl">สแกนแล้ว</div></div>
    <div class="kpi"><div class="num" style="color:#E8B820"><?= $total_unclaimed ?></div><div class="lbl">รอสแกน</div></div>
    <div class="kpi"><div class="num" style="color:#f85149"><?= $total_winners ?></div><div class="lbl">ผู้โชคดี</div></div>
  </div>

  <form method="GET" style="display:flex;gap:8px;margin-bottom:12px">
    <input name="q" value="<?= htmlspecialchars($search) ?>"
           placeholder="🔍 ค้นหาโค้ด / เบอร์ / ชื่อ"
           style="flex:1;padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.08);
                  background:rgba(255,255,255,.04);color:#e6edf3;font-family:'Kanit',sans-serif;font-size:13px;outline:none">
    <input type="hidden" name="status" value="<?= htmlspecialchars($filter) ?>">
    <button class="btn btn-gold" type="submit">ค้นหา</button>
  </form>

  <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
    <?php foreach(['activated'=>'✅ สแกนแล้ว','unclaimed'=>'⏳ รอสแกน','winner'=>'🏆 ผู้โชคดี','all'=>'ทั้งหมด'] as $k=>$l): ?>
    <a href="?status=<?= $k ?>&q=<?= urlencode($search) ?>"
       style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:700;
              background:<?= $filter===$k?'rgba(232,184,32,.15)':'rgba(255,255,255,.04)' ?>;
              color:<?= $filter===$k?'#E8B820':'rgba(150,170,210,.5)' ?>;
              border:1px solid <?= $filter===$k?'rgba(232,184,32,.4)':'rgba(255,255,255,.06)' ?>">
      <?= $l ?>
    </a>
    <?php endforeach; ?>
  </div>

  <?php if(empty($tickets)): ?>
  <p style="color:rgba(150,170,210,.4);font-size:13px;padding:16px 0">ไม่พบข้อมูล</p>
  <?php else: ?>
  <table>
    <tr><th>โค้ด</th><th>ลูกค้า</th><th>ร้าน</th><th>สถานะ</th><th>เวลา</th></tr>
    <?php foreach($tickets as $t): ?>
    <tr>
      <td>
        <span style="font-family:monospace;font-size:14px;font-weight:900;letter-spacing:2px;
                     color:<?= $t['isWinner']?'#E8B820':'#e6edf3' ?>">
          <?= htmlspecialchars($t['ticketCode']) ?>
        </span>
        <?php if($t['isWinner']): ?><span style="font-size:12px"> 🏆</span><?php endif; ?>
      </td>
      <td style="font-size:12px">
        <?= htmlspecialchars($t['customerName']??'—') ?><br>
        <span style="color:rgba(150,170,210,.5)"><?= htmlspecialchars($t['customerPhone']??'') ?></span>
      </td>
      <td style="font-size:12px"><?= htmlspecialchars($t['merchantName']??'—') ?></td>
      <td>
        <span class="badge-<?= $t['status']==='activated'?'ok':'pending' ?>">
          <?= $t['status']==='activated'?'✅ สแกนแล้ว':'⏳ รอ' ?>
        </span>
      </td>
      <td style="font-size:11px;color:rgba(150,170,210,.5)">
        <?= $t['activatedAt'] ? date('d/m H:i', strtotime($t['activatedAt'])) : '—' ?>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>
  <?php endif; ?>
</div>

<?php layout_footer(); ?>
