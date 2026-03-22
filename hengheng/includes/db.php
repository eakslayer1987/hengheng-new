<?php
// includes/db.php — Database connection
define('DB_HOST', 'localhost');
define('DB_NAME', 'xnca_hengheng_merchant');
define('DB_USER', 'xnca_hengheng_merchant');
define('DB_PASS', 'BntaXSk96yAkGEUmhA9T');

try {
    $pdo = new PDO(
        "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'DB connection failed: '.$e->getMessage()]));
}

function db_all(string $sql, array $params = []): array {
    global $pdo;
    $st = $pdo->prepare($sql);
    $st->execute($params);
    return $st->fetchAll();
}
function db_row(string $sql, array $params = []): ?array {
    $rows = db_all($sql, $params);
    return $rows[0] ?? null;
}
function db_val(string $sql, array $params = []) {
    global $pdo;
    $st = $pdo->prepare($sql);
    $st->execute($params);
    return $st->fetchColumn();
}
function db_run(string $sql, array $params = []): void {
    global $pdo;
    $pdo->prepare($sql)->execute($params);
}
function last_id(): int {
    global $pdo;
    return (int)$pdo->lastInsertId();
}
function json_ok(array $data): void {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function json_err(string $msg, int $code = 400): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}
function get_config(string $key, string $default = ''): string {
    $v = db_val("SELECT value FROM SystemConfig WHERE `key`=?", [$key]);
    return $v !== false ? (string)$v : $default;
}
