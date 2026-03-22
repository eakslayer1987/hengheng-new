<?php
// layout.php — รวม header + nav สำหรับทุกหน้า admin
// ใช้: require_once __DIR__.'/layout.php'; แล้ว layout_header('ชื่อหน้า');
require_once __DIR__.'/../includes/auth.php';
require_once __DIR__.'/../includes/db.php';
require_login();

function layout_header(string $title, string $active = ''): void {
    $pending_receipts  = (int)db_val("SELECT COUNT(*) FROM Receipt WHERE status='pending'");
    $pending_merchants = (int)db_val("SELECT COUNT(*) FROM Merchant WHERE status='pending'");
    $badge = $pending_receipts + $pending_merchants;
    $nav = [
        ['href'=>'dashboard.php', 'icon'=>'📊', 'label'=>'ภาพรวม', 'key'=>'dashboard'],
        ['href'=>'receipts.php',  'icon'=>'📋', 'label'=>'ใบเสร็จ', 'key'=>'receipts',
         'badge'=>$pending_receipts],
        ['href'=>'merchants.php', 'icon'=>'🏪', 'label'=>'ร้านค้า', 'key'=>'merchants',
         'badge'=>$pending_merchants],
        ['href'=>'tickets.php',   'icon'=>'🎫', 'label'=>'ฉลาก',   'key'=>'tickets'],
        ['href'=>'banners.php',   'icon'=>'🖼️', 'label'=>'แบนเนอร์','key'=>'banners'],
        ['href'=>'config.php',    'icon'=>'⚙️', 'label'=>'ตั้งค่า', 'key'=>'config'],
    ];
?>
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= htmlspecialchars($title) ?> — Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Kanit',sans-serif;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;min-height:100vh}
a{text-decoration:none;color:inherit}
/* Header */
.topbar{background:#161b22;border-bottom:1px solid rgba(255,255,255,.08);padding:10px 16px;
        display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.topbar h1{font-size:16px;font-weight:900}
.topbar h1 span{color:#E8B820}
.topbar .logout{font-size:12px;color:#f85149;border:1px solid rgba(248,81,73,.3);
                border-radius:8px;padding:4px 12px;cursor:pointer;background:none}
/* Nav */
.sidenav{display:flex;flex-direction:row;flex-shrink:0;background:#161b22;
         border-bottom:1px solid rgba(255,255,255,.06);overflow-x:auto;
         scrollbar-width:none}
.sidenav a{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:2px;
           padding:8px 16px;font-size:10px;font-weight:700;color:rgba(150,170,210,.5);
           position:relative;white-space:nowrap;transition:color .15s}
.sidenav a.active,.sidenav a:hover{color:#E8B820}
.sidenav a.active::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);
                         width:20px;height:2px;background:#E8B820;border-radius:2px}
.sidenav .icon{font-size:18px}
.badge{position:absolute;top:4px;right:8px;background:#f85149;color:#fff;
       border-radius:10px;padding:1px 5px;font-size:9px;font-weight:900;min-width:16px;text-align:center}
/* Content */
.content{flex:1;padding:16px;max-width:900px;width:100%;margin:0 auto}
/* Cards */
.card{background:#161b22;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;margin-bottom:12px}
.card-title{font-size:15px;font-weight:900;margin-bottom:12px;display:flex;align-items:center;gap:8px}
/* Table */
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:8px 10px;font-size:11px;font-weight:700;color:rgba(150,170,210,.5);
   border-bottom:1px solid rgba(255,255,255,.06)}
td{padding:10px;border-bottom:1px solid rgba(255,255,255,.04)}
tr:hover td{background:rgba(255,255,255,.02)}
/* Badges */
.badge-ok{font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;
          background:rgba(63,185,80,.12);color:#3fb950;border:1px solid rgba(63,185,80,.3)}
.badge-pending{font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;
               background:rgba(232,184,32,.12);color:#E8B820;border:1px solid rgba(232,184,32,.3)}
.badge-bad{font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;
           background:rgba(248,81,73,.1);color:#f85149;border:1px solid rgba(248,81,73,.3)}
/* Buttons */
.btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:8px;
     border:none;cursor:pointer;font-family:'Kanit',sans-serif;font-size:12px;font-weight:700;
     transition:opacity .15s}
.btn:hover{opacity:.85}
.btn-gold{background:linear-gradient(135deg,#A67208,#E8B820);color:#3d1f00}
.btn-ok{background:rgba(63,185,80,.15);color:#3fb950;border:1px solid rgba(63,185,80,.3)}
.btn-bad{background:rgba(248,81,73,.12);color:#f85149;border:1px solid rgba(248,81,73,.3)}
.btn-sec{background:rgba(255,255,255,.06);color:#e6edf3;border:1px solid rgba(255,255,255,.08)}
/* Form */
.form-group{margin-bottom:14px}
.form-group label{font-size:11px;font-weight:700;color:rgba(150,170,210,.5);display:block;margin-bottom:5px}
.form-group input,.form-group select,.form-group textarea{
  width:100%;padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.04);color:#e6edf3;font-family:'Kanit',sans-serif;
  font-size:13px;outline:none}
.form-group input:focus,.form-group select:focus{border-color:rgba(232,184,32,.4)}
/* Alert */
.alert{padding:10px 14px;border-radius:10px;font-size:13px;font-weight:700;margin-bottom:12px}
.alert-ok{background:rgba(63,185,80,.1);border:1px solid rgba(63,185,80,.3);color:#3fb950}
.alert-bad{background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);color:#f85149}
/* Grid */
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.kpi{background:#161b22;border:1px solid rgba(255,255,255,.08);border-radius:12px;
     padding:14px;text-align:center}
.kpi .num{font-size:28px;font-weight:900;line-height:1}
.kpi .lbl{font-size:11px;color:rgba(150,170,210,.4);margin-top:4px}
@media(max-width:600px){.grid-2,.grid-3{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<div class="topbar">
  <h1>Admin <span>Panel</span></h1>
  <form method="POST" action="logout.php" style="display:inline">
    <button type="submit" class="logout">ออกจากระบบ</button>
  </form>
</div>
<nav class="sidenav">
  <?php foreach($nav as $n): ?>
  <a href="<?= $n['href'] ?>" class="<?= $active===$n['key']?'active':'' ?>">
    <?php if(!empty($n['badge']) && $n['badge']>0): ?>
    <span class="badge"><?= $n['badge'] ?></span>
    <?php endif; ?>
    <span class="icon"><?= $n['icon'] ?></span>
    <?= $n['label'] ?>
  </a>
  <?php endforeach; ?>
</nav>
<div class="content">
<?php
}

function layout_footer(): void {
    echo '</div></body></html>';
}
?>
