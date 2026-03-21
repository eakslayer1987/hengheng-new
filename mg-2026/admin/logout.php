<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
admin_logout();
header('Location: /hengheng/admin/login.php');
exit;
