<?php
// includes/layout.php — shared admin layout
function render_head(string $title = 'Admin'): void { ?>
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= htmlspecialchars($title) ?> — เฮงเฮงปังจัง Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Kanit',sans-serif;background:#F1F5F9;color:#0F172A;min-height:100vh;display:flex}
a{text-decoration:none;color:inherit}
input,select,textarea,button{font-family:'Kanit',sans-serif}

/* Sidebar */
.sidebar{width:232px;min-height:100vh;background:#0F172A;position:fixed;left:0;top:0;bottom:0;z-index:100;
  display:flex;flex-direction:column;box-shadow:4px 0 24px rgba(0,0,0,.3)}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid rgba(255,255,255,.07)}
.sb-logo-inner{display:flex;align-items:center;gap:10px}
.sb-icon{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#6366F1,#4F46E5);
  display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;flex-shrink:0}
.sb-title{font-size:15px;font-weight:700;color:#F1F5F9}
.sb-sub{font-size:10px;color:#64748B;letter-spacing:.5px}
.sb-nav{flex:1;padding:12px 8px;overflow-y:auto;display:flex;flex-direction:column;gap:4px}
.sb-section{font-size:10px;font-weight:700;color:#64748B;letter-spacing:1px;text-transform:uppercase;
  padding:0 10px;margin:8px 0 4px}
.sb-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;
  color:#CBD5E1;font-size:13px;font-weight:400;cursor:pointer;border:none;background:none;
  width:100%;text-align:left;transition:.15s;border-left:3px solid transparent}
.sb-item:hover{background:rgba(255,255,255,.05)}
.sb-item.active{background:rgba(99,102,241,.25);color:#A5B4FC;font-weight:600;border-left-color:#6366F1}
.sb-item i{width:16px;text-align:center;opacity:.7}
.sb-item.active i{opacity:1}
.sb-badge{background:#EF4444;color:#fff;border-radius:10px;min-width:18px;height:18px;
  display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;padding:0 4px;margin-left:auto}
.sb-footer{padding:12px 8px;border-top:1px solid rgba(255,255,255,.07)}
.sb-user{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.04);margin-bottom:4px}
.sb-user-icon{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#6366F1,#8B5CF6);
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
.sb-user-name{font-size:12px;font-weight:600;color:#F1F5F9}
.sb-user-role{font-size:10px;color:#64748B}

/* Main */
.main{margin-left:232px;flex:1;display:flex;flex-direction:column;min-height:100vh}
.topbar{background:#fff;border-bottom:1px solid rgba(0,0,0,.08);padding:0 24px;height:52px;
  display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:9;
  box-shadow:0 1px 3px rgba(0,0,0,.06)}
.topbar-bread{display:flex;align-items:center;gap:6px;font-size:13px}
.topbar-bread span{color:#94A3B8}
.topbar-bread b{color:#0F172A;font-weight:600}
.content{flex:1;padding:24px;max-width:1100px;width:100%}

/* Cards */
.card{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:20px}
.card-title{font-size:15px;font-weight:600;color:#0F172A;margin-bottom:16px;
  padding-bottom:12px;border-bottom:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:8px}
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px}
.kpi{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:16px;position:relative;overflow:hidden}
.kpi-val{font-size:22px;font-weight:700;color:#0F172A}
.kpi-label{font-size:11px;color:#94A3B8;margin:2px 0;font-weight:500}
.kpi-sub{font-size:11px;color:#94A3B8}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:8px;
  font-size:13px;font-weight:500;cursor:pointer;border:none;transition:.15s;font-family:'Kanit',sans-serif}
.btn:hover{opacity:.85}
.btn-primary{background:#1D4ED8;color:#fff}
.btn-success{background:#16A34A;color:#fff}
.btn-danger{background:#FEF2F2;color:#E53E3E;border:1px solid rgba(229,62,62,.2)}
.btn-secondary{background:#fff;color:#475569;border:1px solid rgba(0,0,0,.12)}
.btn-gold{background:linear-gradient(135deg,#F7D37A,#C9963A);color:#1a0e00;font-weight:700}
.btn-sm{padding:4px 12px;font-size:12px}

/* Table */
.table-wrap{overflow-x:auto;border-radius:12px;border:1px solid rgba(0,0,0,.08)}
table{width:100%;border-collapse:collapse;font-size:13px}
thead tr{background:#F8FAFC;border-bottom:1px solid rgba(0,0,0,.08)}
th{text-align:left;padding:10px 14px;font-size:11px;font-weight:600;color:#94A3B8;white-space:nowrap}
td{padding:10px 14px;border-bottom:1px solid rgba(0,0,0,.05);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#F8FAFC}

/* Form */
.form-group{margin-bottom:12px}
.form-label{font-size:12px;font-weight:500;color:#475569;display:block;margin-bottom:5px}
.form-input{width:100%;height:36px;padding:0 10px;border:1px solid rgba(0,0,0,.12);border-radius:8px;
  font-size:13px;color:#0F172A;background:#fff;outline:none}
.form-input:focus{border-color:#1D4ED8;box-shadow:0 0 0 3px rgba(29,78,216,.08)}
textarea.form-input{height:auto;padding:8px 10px;resize:vertical}
.form-note{font-size:11px;color:#94A3B8;margin-top:3px}
.form-grid{display:grid;gap:12px}
.form-grid.cols-2{grid-template-columns:1fr 1fr}
.form-grid.cols-3{grid-template-columns:1fr 1fr 1fr}

/* Filters */
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.filter-tabs{display:flex;gap:4px;margin-bottom:16px}
.filter-tab{padding:5px 14px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;
  border:1px solid rgba(0,0,0,.1);background:#fff;color:#475569;font-family:'Kanit',sans-serif}
.filter-tab.active{border-color:#1D4ED8;background:#EFF6FF;color:#1D4ED8}

/* Alert/Flash */
.alert{padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.alert-success{background:#F0FDF4;border:1px solid rgba(22,163,74,.2);color:#16A34A}
.alert-error{background:#FEF2F2;border:1px solid rgba(229,62,62,.2);color:#E53E3E}
.alert-info{background:#EFF6FF;border:1px solid rgba(29,78,216,.15);color:#1D4ED8}

/* Modal */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:200;
  align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto}
.modal-overlay.open{display:flex}
.modal{background:#fff;border-radius:16px;padding:24px;width:100%;max-width:520px;
  box-shadow:0 12px 48px rgba(0,0,0,.15);margin:auto}
.modal-title{font-size:15px;font-weight:600;color:#0F172A;margin-bottom:18px;
  display:flex;align-items:center;justify-content:space-between}
.modal-close{background:none;border:none;cursor:pointer;color:#94A3B8;font-size:18px}

/* Pagination */
.pagination{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:16px}
.page-btn{width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,0,0,.1);
  background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;font-family:'Kanit',sans-serif}
.page-btn.active{background:#1D4ED8;color:#fff;border-color:#1D4ED8}
.page-btn:disabled{opacity:.4;cursor:default}
.page-info{font-size:13px;color:#475569}

/* Toast */
#toast{position:fixed;top:16px;right:16px;z-index:999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast-item{padding:10px 16px;border-radius:10px;font-size:13px;font-weight:500;color:#fff;
  box-shadow:0 4px 16px rgba(0,0,0,.15);animation:slideIn .3s ease;pointer-events:auto}
.toast-ok{background:#16A34A}
.toast-err{background:#E53E3E}
@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin 1s linear infinite}

/* Double Win Verifier */
.dw-box{background:linear-gradient(145deg,#FFFBEB,#FEF3C7);border:2px solid rgba(180,83,9,.2);border-radius:14px;padding:20px}
.dw-code-input{height:52px;font-size:28px;font-family:monospace;font-weight:900;letter-spacing:8px;
  text-align:center;border:2px solid rgba(180,83,9,.3);border-radius:10px;width:200px;color:#B45309;outline:none}
.dw-code-input:focus{border-color:#B45309;box-shadow:0 0 0 4px rgba(180,83,9,.1)}
.dw-result{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.dw-card{border-radius:10px;padding:14px}
.dw-merchant{background:#FFFBEB;border:1px solid rgba(180,83,9,.2)}
.dw-customer{background:#F0FDF4;border:1px solid rgba(22,163,74,.2)}
</style>
</head>
<body>
<div id="toast"></div>
<?php
}

function render_sidebar(string $active = ''): void {
    $user = $_SESSION['admin_user'] ?? 'admin';
    $pending_receipts = (int)(db_val("SELECT COUNT(*) FROM Receipt WHERE status='pending'") ?: 0);
    $pending_merchants = (int)(db_val("SELECT COUNT(*) FROM Merchant WHERE status='pending'") ?: 0);
    ?>
<nav class="sidebar">
  <div class="sb-logo">
    <div class="sb-logo-inner">
      <div class="sb-icon">ป</div>
      <div><div class="sb-title">ปังจัง</div><div class="sb-sub">LUCKY DRAW ADMIN</div></div>
    </div>
  </div>
  <div class="sb-nav">
    <div class="sb-section">ภาพรวม</div>
    <a href="/hengheng/admin/" class="sb-item <?= $active==='dashboard'?'active':'' ?>"><i class="fa fa-chart-bar"></i> Dashboard</a>

    <div class="sb-section">แคมเปญ</div>
    <a href="/hengheng/admin/entries.php" class="sb-item <?= $active==='entries'?'active':'' ?>"><i class="fa fa-users"></i> ผู้เข้าร่วม</a>
    <a href="/hengheng/admin/luckydraw.php" class="sb-item <?= $active==='luckydraw'?'active':'' ?>"><i class="fa fa-trophy"></i> จับรางวัล</a>

    <div class="sb-section">ฉลากดิจิทัล</div>
    <a href="/hengheng/admin/tickets.php" class="sb-item <?= $active==='tickets'?'active':'' ?>"><i class="fa fa-ticket"></i> ฉลาก + Wallet</a>

    <div class="sb-section">ร้านค้า</div>
    <a href="/hengheng/admin/merchants.php" class="sb-item <?= $active==='merchants'?'active':'' ?>">
      <i class="fa fa-store"></i> ร้านค้า
      <?php if($pending_merchants>0): ?><span class="sb-badge"><?= $pending_merchants ?></span><?php endif ?>
    </a>
    <a href="/hengheng/admin/receipts.php" class="sb-item <?= $active==='receipts'?'active':'' ?>">
      <i class="fa fa-file-invoice"></i> ใบเสร็จ
      <?php if($pending_receipts>0): ?><span class="sb-badge"><?= $pending_receipts ?></span><?php endif ?>
    </a>

    <div class="sb-section">ระบบ</div>
    <a href="/hengheng/admin/settings.php" class="sb-item <?= $active==='settings'?'active':'' ?>"><i class="fa fa-gear"></i> ตั้งค่า</a>
    <a href="/hengheng/admin/content.php" class="sb-item <?= $active==='content'?'active':'' ?>"><i class="fa fa-bell"></i> เนื้อหา</a>
    <a href="/hengheng/admin/banners.php" class="sb-item <?= $active==='banners'?'active':'' ?>"><i class="fa fa-image"></i> แบนเนอร์</a>
    <a href="/hengheng/admin/qrrules.php" class="sb-item <?= $active==='qrrules'?'active':'' ?>"><i class="fa fa-qrcode"></i> Smart QR</a>
  </div>
  <div class="sb-footer">
    <div class="sb-user">
      <div class="sb-user-icon">A</div>
      <div><div class="sb-user-name"><?= htmlspecialchars($user) ?></div><div class="sb-user-role">Administrator</div></div>
    </div>
    <a href="/hengheng/admin/logout.php" class="sb-item" style="color:#64748B"><i class="fa fa-sign-out-alt"></i> ออกจากระบบ</a>
  </div>
</nav>
<?php
}

function render_topbar(string $page = ''): void { ?>
<div class="topbar">
  <div class="topbar-bread">
    <span>Admin</span><span>/</span><b><?= htmlspecialchars($page) ?></b>
  </div>
</div>
<?php
}

function flash_html(): void {
    $f = get_flash();
    if (!$f) return;
    $cls = $f['type'] === 'success' ? 'alert-success' : ($f['type'] === 'error' ? 'alert-error' : 'alert-info');
    $icon = $f['type'] === 'success' ? '✅' : ($f['type'] === 'error' ? '❌' : 'ℹ️');
    echo "<div class='alert $cls'>$icon " . htmlspecialchars($f['msg']) . "</div>";
}

function render_foot(): void { ?>
<script>
function toast(msg, ok=true){
  const d=document.getElementById('toast');
  const el=document.createElement('div');
  el.className='toast-item '+(ok?'toast-ok':'toast-err');
  el.textContent=(ok?'✅ ':'❌ ')+msg;
  d.appendChild(el);
  setTimeout(()=>el.remove(),3500);
}
function openModal(id){document.getElementById(id).classList.add('open')}
function closeModal(id){document.getElementById(id).classList.remove('open')}
function confirmAction(msg,fn){if(confirm(msg))fn()}
</script>
</body></html>
<?php
}
