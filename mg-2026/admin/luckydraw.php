<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/layout.php';
require_admin();

$campaigns = db_all("SELECT * FROM Campaign ORDER BY createdAt DESC");
$active_camp = db_row("SELECT * FROM Campaign WHERE isActive=1 ORDER BY createdAt DESC LIMIT 1");
$prizes = $active_camp ? db_all("SELECT * FROM Prize WHERE campaignId=? ORDER BY sortOrder", [$active_camp['id']]) : [];

// Stats
$eligible = $active_camp
    ? (int)db_val("SELECT COUNT(*) FROM CollectedCode WHERE campaignId=? AND isWinner=0", [$active_camp['id']])
    : 0;

$winners = [];
$draw_error = '';

// Handle draw POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['action'] === 'draw') {
    $camp_id  = (int)$_POST['campaignId'];
    $prize_id = (int)$_POST['prizeId'];
    $count    = max(1, (int)$_POST['count']);

    $prize = db_row("SELECT * FROM Prize WHERE id=? AND campaignId=?", [$prize_id, $camp_id]);
    if (!$prize) {
        $draw_error = 'ไม่พบรางวัล';
    } elseif ($prize['remaining'] < $count) {
        $draw_error = "รางวัลเหลือแค่ {$prize['remaining']} ชิ้น";
    } else {
        // Fisher-Yates style random pick
        $pool = db_all(
            "SELECT id, customerName, customerPhone, code FROM CollectedCode WHERE campaignId=? AND isWinner=0 ORDER BY RAND() LIMIT ?",
            [$camp_id, $count]
        );
        if (count($pool) < $count) {
            $draw_error = "สิทธิ์ที่ยังไม่ได้รางวัลมีแค่ " . count($pool) . " รายการ";
        } else {
            $db = db();
            $db->beginTransaction();
            try {
                foreach ($pool as $e) {
                    db_run("UPDATE CollectedCode SET isWinner=1, prizeId=?, claimStatus='pending' WHERE id=?",
                        [$prize_id, $e['id']]);
                }
                db_run("UPDATE Prize SET remaining=remaining-? WHERE id=?", [count($pool), $prize_id]);
                $db->commit();
                $winners = $pool;
                flash('success', 'จับรางวัลสำเร็จ ' . count($winners) . ' คน 🎉');
            } catch (Throwable $ex) {
                $db->rollBack();
                $draw_error = $ex->getMessage();
            }
        }
    }
}

render_head('จับรางวัล');
render_sidebar('luckydraw');
?>
<div class="main">
<?php render_topbar('จับรางวัล') ?>
<div class="content">
<?php flash_html() ?>
<?php if ($draw_error): ?>
<div class="alert alert-error">❌ <?= htmlspecialchars($draw_error) ?></div>
<?php endif ?>

<div style="display:grid;grid-template-columns:1fr 380px;gap:20px">

<!-- Left: Form + Winners -->
<div>
  <div class="card" style="margin-bottom:16px">
    <div class="card-title"><i class="fa fa-dice" style="color:#6366F1"></i> ตั้งค่าการจับรางวัล</div>
    <form method="post" onsubmit="return confirm('ยืนยันจับรางวัล?')">
      <input type="hidden" name="action" value="draw">
      <div class="form-grid cols-2" style="margin-bottom:14px">
        <div>
          <label class="form-label">แคมเปญ</label>
          <select class="form-input" name="campaignId" onchange="this.form.submit()">
            <?php foreach ($campaigns as $c): ?>
            <option value="<?= $c['id'] ?>" <?= ($active_camp&&$c['id']==$active_camp['id'])?'selected':'' ?>>
              <?= htmlspecialchars($c['name']) ?> <?= $c['isActive']?'(เปิดอยู่)':'' ?>
            </option>
            <?php endforeach ?>
          </select>
        </div>
        <div>
          <label class="form-label">รางวัล</label>
          <select class="form-input" name="prizeId">
            <option value="">— เลือกรางวัล —</option>
            <?php foreach ($prizes as $p): ?>
            <option value="<?= $p['id'] ?>">
              <?= htmlspecialchars($p['name']) ?> (เหลือ <?= $p['remaining'] ?>/<?= $p['quantity'] ?>)
            </option>
            <?php endforeach ?>
          </select>
        </div>
        <div>
          <label class="form-label">จำนวนผู้โชคดี</label>
          <input class="form-input" type="number" name="count" value="1" min="1" max="<?= $eligible ?>">
          <p class="form-note">สิทธิ์ที่ยังไม่ได้รางวัล: <?= number_format($eligible) ?> รายการ</p>
        </div>
      </div>
      <button class="btn btn-primary" type="submit">
        <i class="fa fa-trophy"></i> จับรางวัลเลย
      </button>
    </form>
  </div>

  <!-- Winners result -->
  <?php if (!empty($winners)): ?>
  <div class="card">
    <div class="card-title"><i class="fa fa-trophy" style="color:#B45309"></i> ผู้โชคดี <?= count($winners) ?> คน 🎉</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <?php foreach ($winners as $i => $w): ?>
      <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;
        background:<?= $i%2===0?'#fff':'#F8FAFC' ?>;border:1px solid rgba(0,0,0,.06)">
        <div style="width:28px;height:28px;border-radius:50%;background:#B45309;display:flex;align-items:center;
          justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0"><?= $i+1 ?></div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px"><?= htmlspecialchars($w['customerName']) ?></div>
          <div style="font-size:11px;color:#94A3B8"><?= htmlspecialchars($w['customerPhone']) ?></div>
        </div>
        <code style="font-size:11px;color:#1D4ED8;background:#EFF6FF;padding:2px 8px;border-radius:4px">
          <?= htmlspecialchars($w['code']) ?>
        </code>
      </div>
      <?php endforeach ?>
    </div>
  </div>
  <?php endif ?>
</div>

<!-- Right: Stats -->
<div>
  <div class="card">
    <div class="card-title"><i class="fa fa-chart-pie" style="color:#8B5CF6"></i> สถิติแคมเปญ</div>
    <?php if ($active_camp): ?>
    <div style="display:flex;flex-direction:column;gap:10px">
      <?php
      $stats = [
        ['โค้ดทั้งหมด', db_val("SELECT COUNT(*) FROM CollectedCode WHERE campaignId=?",[$active_camp['id']])??0, '#6366F1'],
        ['ยังไม่ได้รางวัล', $eligible, '#B45309'],
        ['ผู้โชคดีแล้ว', db_val("SELECT COUNT(*) FROM CollectedCode WHERE campaignId=? AND isWinner=1",[$active_camp['id']])??0, '#16A34A'],
        ['รอรับรางวัล', db_val("SELECT COUNT(*) FROM CollectedCode WHERE campaignId=? AND isWinner=1 AND claimStatus='pending'",[$active_camp['id']])??0, '#F59E0B'],
      ];
      foreach ($stats as [$l,$v,$c]):
      ?>
      <div style="display:flex;justify-content:space-between;padding:10px 14px;background:#F8FAFC;border-radius:8px">
        <span style="font-size:13px;color:#475569"><?= $l ?></span>
        <span style="font-size:16px;font-weight:700;color:<?= $c ?>"><?= number_format($v) ?></span>
      </div>
      <?php endforeach ?>
    </div>
    <?php else: ?>
    <p style="color:#94A3B8;font-size:13px;text-align:center;padding:20px">ยังไม่มีแคมเปญที่เปิดอยู่</p>
    <?php endif ?>
  </div>
</div>

</div><!-- end grid -->
</div></div>
<?php render_foot() ?>
