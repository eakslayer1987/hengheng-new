<?php
// includes/auth.php — Admin session management
session_start();

function admin_login(string $username, string $password): bool {
    require_once __DIR__.'/db.php';
    $user = db_row("SELECT * FROM AdminUser WHERE username=?", [$username]);
    if (!$user) return false;
    return password_verify($password, $user['password']);
}

function require_login(): void {
    if (empty($_SESSION['admin_logged_in'])) {
        header('Location: /hengheng/admin/index.php');
        exit;
    }
}

function cors_headers(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET,POST,PATCH,DELETE,OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type,X-Admin-Token,Authorization');
}
