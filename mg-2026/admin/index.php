<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/layout.php';
require_admin();

// ─── Stats ────────────────────────────────────────────────────
$campaign = db_row("SELECT * FROM Campaign WHERE isActive=1 ORDER BY createdAt DESC LIMIT 1");

$today = today_start();
$stats = [
    'total_codes'       => db_val("SELECT COUNT(*) FROM CollectedCode") ?: 0,
    'today_codes'       => db_val("SELECT COUNT(*) FROM CollectedCode WHERE collectedAt>=?", [$today]) ?: 0,
    'total_winners'     => db_val("SELECT COUNT(*) FROM CollectedCode WHERE isWinner=1") ?: 0,
    'approved_merchants'=> db_val("SELECT COUNT(*) FROM Merchant WHERE status='approved'") ?: 0,
    'pending_merchants' => db_val("SELECT COUNT(*) FROM Merchant WHERE status='pending'") ?: 0,
    'pending_receipts'  => db_val("SELECT COUNT(*) FROM Receipt WHERE status='pending'") ?: 0,
    // Digital Ticket
    'ticket_total'      => db_val("SELECT COUNT(*) FROM DigitalTicket") ?: 0,
    'ticket_unclaimed'  => db_val("SELECT COUNT(*) FROM DigitalTicket WHERE status='unclaimed'") ?: 0,
    'ticket_activated'  => db_val("SELECT COUNT(*) FROM DigitalTicket WHERE status='activated'") ?: 0,
    'ticket_winners'    => db_val("SELECT COUNT(*) FROM DigitalTicket WHERE isWinner=1") ?: 0,
];

// 7-day chart
$daily = db_all("
    SELECT DATE(collectedAt) as day, COUNT(*) as cnt
    FROM CollectedCode
    WHERE collectedAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(collectedAt)
    ORDER BY day
");
$daily_map = [];
foreach ($daily as $d) $daily_map[$d['day']] = $d['cnt'];
$chart_data = [];
for ($i = 6; $i >= 0; $i--) {
    $day = date('Y-m-d', strtotime("-{$i} days"));
    $chart_data[] = ['day' => date('j/n', strtotime($day)), 'cnt' => $daily_map[$day] ?? 0];
}
$max_cnt = max(array_column($chart_data, 'cnt') ?: [1]);

// Prizes
$prizes = $campaign ? db_all("SELECT * FROM Prize WHERE campaignId=? ORDER BY sortOrder", [$campaign['id']]) : [];

render_head('Dashboard');
render_sidebar('dashboard');
?>
<div class="main">
<?php render_topbar('Dashboard') ?>
<div class="content">
<?php flash_html() ?>

<?php if ($campaign): ?>
<div class="alert alert-success" style="margin-bottom:20px">
  🟢 แคมเปญกำลังดำเนินอยู่: <b><?= htmlspecialchars($campaign['name']) ?></b>
  — หมดเขต <?= format_date_th($campaign['endDate']) ?>
</div>
<?php else: ?>
<div class="alert alert-error" style="margin-bottom:20px">⏸ ยังไม่มีแคมเปญที่เปิดอยู่ — <a href="/hengheng/admin/settings.php" style="color:inherit;text-decoration:underline">สร้างแคมเปญ</a></div>
<?php endif ?>

<!-- KPI -->
<div class="kpi-grid">
  <div class="kpi">
    <div style="font-size:20px;margin-bottom:8px">🎟️</div>
    <div class="kpi-val"><?= number_format($stats['total_codes']) ?></div>
    <div class="kpi-label">โค้ดสะสมทั้งหมด</div>
    <div class="kpi-sub">+<?= number_format($stats['today_codes']) ?> วันนี้</div>
  </div>
  <div class="kpi">
    <div style="font-size:20px;margin-bottom:8px">🏆</div>
    <div class="kpi-val"><?= number_format($stats['total_winners']) ?></div>
    <div class="kpi-label">ผู้โชคดี</div>
    <div class="kpi-sub">จากโค้ดสะสม</div>
  </div>
  <div class="kpi">
    <div style="font-size:20px;margin-bottom:8px">🏪</div>
    <div class="kpi-val"><?= number_format($stats['approved_merchants']) ?></div>
    <div class="kpi-label">ร้านค้าที่อนุมัติ</div>
    <div class="kpi-sub">รอ <?= $stats['pending_merchants'] ?> ร้าน</div>
  </div>
  <div class="kpi">
    <div style="font-size:20px;margin-bottom:8px">📄</div>
    <div class="kpi-val"><?= number_format($stats['pending_receipts']) ?></div>
    <div class="kpi-label">ใบเสร็จรอตรวจ</div>
    <div class="kpi-sub">รอการอนุมัติ</div>
  </div>
  <div class="kpi" style="border-color:rgba(139,92,246,.3);background:rgba(139,92,246,.03)">
    <div style="font-size:20px;margin-bottom:8px">🎫</div>
    <div class="kpi-val" style="color:#8B5CF6"><?= number_format($stats['ticket_activated']) ?></div>
    <div class="kpi-label">ฉลาก Activated</div>
    <div class="kpi-sub">Unclaimed <?= number_format($stats['ticket_unclaimed']) ?></div>
  </div>
</div>

<!-- Chart + Prizes -->
<div style="display:grid;grid-template-columns:1fr 320px;gap:16px;margin-bottom:20px">
  <div class="card">
    <div class="card-title"><i class="fa fa-chart-bar" style="color:#6366F1"></i> สแกน 7 วันล่าสุด</div>
    <div style="display:flex;align-items:flex-end;gap:8px;height:110px">
      <?php foreach ($chart_data as $d): ?>
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
        <span style="font-size:11px;font-weight:600;color:<?= $d['cnt']>0?'#6366F1':'#94A3B8' ?>"><?= $d['cnt'] ?: '' ?></span>
        <div style="width:100%;border-radius:4px 4px 0 0;min-height:4px;
          background:<?= $d['cnt']>0?'linear-gradient(180deg,#6366F1,#4F46E5)':'#F1F5F9' ?>;
          height:<?= max(4, round(($d['cnt']/$max_cnt)*90)) ?>px"></div>
        <span style="font-size:10px;color:#94A3B8"><?= $d['day'] ?></span>
      </div>
      <?php endforeach ?>
    </div>
  </div>
  <div class="card">
    <div class="card-title"><i class="fa fa-medal" style="color:#B45309"></i> รางวัลคงเหลือ</div>
    <?php if ($prizes): ?>
      <?php foreach ($prizes as $i => $p):
        $pct = $p['quantity'] > 0 ? round(($p['remaining']/$p['quantity'])*100) : 0;
        $color = $pct > 50 ? '#6366F1' : ($pct > 20 ? '#B45309' : '#E53E3E');
      ?>
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:12px;font-weight:500"><?= ['🥇','🥈','🥉','🎁','🎀'][$i] ?? '🎁' ?> <?= htmlspecialchars($p['name']) ?></span>
          <span style="font-size:12px;font-weight:600;color:<?= $color ?>"><?= $p['remaining'] ?>/<?= $p['quantity'] ?></span>
        </div>
        <div style="height:6px;border-radius:3px;background:#F1F5F9;overflow:hidden">
          <div style="height:100%;border-radius:3px;background:<?= $color ?>;width:<?= $pct ?>%"></div>
        </div>
      </div>
      <?php endforeach ?>
    <?php else: ?>
      <p style="color:#94A3B8;font-size:13px;text-align:center;padding:20px">ยังไม่มีรางวัล</p>
    <?php endif ?>
  </div>
</div>

<!-- Digital Ticket Summary -->
<div class="card">
  <div class="card-title"><i class="fa fa-ticket" style="color:#8B5CF6"></i> ฉลากดิจิทัล Overview</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
    <?php foreach ([
      ['ทั้งหมด', $stats['ticket_total'], '#6366F1', '#EEF2FF'],
      ['Unclaimed', $stats['ticket_unclaimed'], '#B45309', '#FFFBEB'],
      ['Activated', $stats['ticket_activated'], '#16A34A', '#F0FDF4'],
      ['ผู้โชคดี Double Win', $stats['ticket_winners'], '#F59E0B', '#FFFBEB'],
    ] as [$label, $val, $color, $bg]): ?>
    <div style="background:<?= $bg ?>;border:1px solid <?= $color ?>20;border-radius:10px;padding:14px;text-align:center">
      <div style="font-size:22px;font-weight:700;color:<?= $color ?>"><?= number_format($val) ?></div>
      <div style="font-size:11px;color:#94A3B8;margin-top:2px"><?= $label ?></div>
    </div>
    <?php endforeach ?>
  </div>
  <div style="margin-top:14px;text-align:right">
    <a href="/hengheng/admin/tickets.php" class="btn btn-secondary btn-sm"><i class="fa fa-ticket"></i> ดูฉลากทั้งหมด</a>
    <a href="/hengheng/api/export_draw.php" class="btn btn-gold btn-sm" style="margin-left:8px"><i class="fa fa-download"></i> Export CSV จับรางวัล</a>
  </div>
</div>

</div></div>
<?php render_foot() ?>
