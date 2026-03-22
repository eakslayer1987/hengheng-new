<?php
session_start();
require_once __DIR__.'/../includes/db.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $u = trim($_POST['username'] ?? '');
    $p = $_POST['password'] ?? '';
    $user = db_row("SELECT * FROM AdminUser WHERE username=?", [$u]);
    if ($user && password_verify($p, $user['password'])) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_user'] = $u;
        header('Location: /hengheng/admin/dashboard.php');
        exit;
    }
    $error = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
}
if (!empty($_SESSION['admin_logged_in'])) {
    header('Location: /hengheng/admin/dashboard.php'); exit;
}
?><!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Login — เฮงเฮง ปังจัง</title>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Kanit',sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;
     display:flex;align-items:center;justify-content:center;padding:24px}
.card{width:100%;max-width:380px;background:#161b22;border:1px solid rgba(255,255,255,.08);
      border-radius:20px;padding:32px 28px}
.logo{text-align:center;margin-bottom:28px}
.logo .emoji{font-size:48px;display:block;margin-bottom:8px}
.logo h1{font-size:22px;font-weight:900}
.logo h1 span{color:#E8B820}
.logo p{font-size:13px;color:rgba(150,170,210,.5);margin-top:4px}
label{font-size:11px;font-weight:700;color:rgba(150,170,210,.5);display:block;margin-bottom:6px}
input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.08);
      background:rgba(255,255,255,.04);color:#e6edf3;font-family:'Kanit',sans-serif;
      font-size:14px;outline:none;margin-bottom:14px}
input:focus{border-color:rgba(232,184,32,.4)}
.error{background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);border-radius:10px;
       padding:10px 14px;font-size:13px;font-weight:700;color:#f85149;margin-bottom:14px}
button{width:100%;height:48px;border-radius:14px;border:none;cursor:pointer;
       background:linear-gradient(135deg,#A67208,#E8B820);color:#3d1f00;
       font-family:'Kanit',sans-serif;font-size:15px;font-weight:900;letter-spacing:.5px}
button:hover{opacity:.9}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <span class="emoji">⚙️</span>
    <h1>Admin <span>Panel</span></h1>
    <p>เฮงเฮง ปังจัง Lucky Draw</p>
  </div>
  <?php if($error): ?>
  <div class="error">⚠️ <?= htmlspecialchars($error) ?></div>
  <?php endif; ?>
  <form method="POST">
    <label>Username</label>
    <input name="username" placeholder="admin" value="<?= htmlspecialchars($_POST['username']??'') ?>" required>
    <label>Password</label>
    <input name="password" type="password" placeholder="••••••••" required>
    <button type="submit">🔐 เข้าสู่ระบบ</button>
  </form>
</div>
</body>
</html>
