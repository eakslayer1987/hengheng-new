<?php
/**
 * includes/auth.php
 * CORS headers + admin session auth
 */

if (!function_exists('cors_headers')) {
    function cors_headers(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        // อนุญาต Vercel domain และ local dev
        $allowed = [
            'https://xn--72ca9ib1gc.xn--72cac8e8ec.com',
            'https://fooddash-h2jw.vercel.app',
            'http://localhost:3000',
            'http://localhost:3001',
        ];
        if (in_array($origin, $allowed) || str_ends_with($origin, '.vercel.app')) {
            header("Access-Control-Allow-Origin: {$origin}");
        } else {
            header("Access-Control-Allow-Origin: *");
        }
        header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Content-Type: application/json; charset=utf-8");
    }
}

if (!function_exists('require_admin')) {
    function require_admin(): void {
        session_start();
        if (empty($_SESSION['admin_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
    }
}
