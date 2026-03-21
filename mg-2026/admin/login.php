<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

session_start_once();
if (is_admin()) { header('Location: /hengheng/admin/'); exit; }

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (admin_login(post('username'), post('password'))) {
        header('Location: /hengheng/admin/');
        exit;
    }
    $error = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>เข้าสู่ระบบ — เฮงเฮงปังจัง Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'Kanit',sans-serif}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F1F5F9}
.box{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:32px 28px;
  width:100%;max-width:360px;box-shadow:0 4px 24px rgba(0,0,0,.06)}
.logo{width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,#F7D37A,#C9963A);
  display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:22px;font-weight:800;color:#1a0e00}
h1{text-align:center;font-size:20px;font-weight:700;color:#0F172A;margin-bottom:4px}
p{text-align:center;font-size:13px;color:#94A3B8;margin-bottom:24px}
label{font-size:12px;font-weight:500;color:#475569;display:block;margin-bottom:5px}
input{width:100%;height:38px;padding:0 10px;border:1px solid rgba(0,0,0,.12);border-radius:8px;
  font-size:13px;color:#0F172A;outline:none;margin-bottom:12px}
input:focus{border-color:#C9963A;box-shadow:0 0 0 3px rgba(201,150,58,.1)}
.err{background:#FEF2F2;border:1px solid rgba(229,62,62,.2);color:#E53E3E;border-radius:8px;
  padding:8px 12px;font-size:12px;margin-bottom:12px}
button{width:100%;height:40px;background:linear-gradient(135deg,#C9963A,#F7D37A);color:#1a0e00;
  border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-top:4px;font-family:'Kanit',sans-serif}
button:hover{opacity:.9}
</style>
</head>
<body>
<div class="box">
  <div class="logo">🐻</div>
  <h1>เฮงเฮงปังจัง</h1>
  <p>Lucky Draw Admin Panel</p>
  <?php if ($error): ?><div class="err">❌ <?= htmlspecialchars($error) ?></div><?php endif ?>
  <form method="post">
    <label>ชื่อผู้ใช้</label>
    <input name="username" placeholder="admin" autocomplete="username" required>
    <label>รหัสผ่าน</label>
    <input name="password" type="password" placeholder="••••••" autocomplete="current-password" required>
    <button type="submit">เข้าสู่ระบบ</button>
  </form>
</div>
</body>
</html>
