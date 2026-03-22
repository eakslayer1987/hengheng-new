<?php
session_start();
session_destroy();
header('Location: /hengheng/admin/index.php');
exit;
