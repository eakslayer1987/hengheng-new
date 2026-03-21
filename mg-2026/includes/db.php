<?php
// ─── DB CONFIG ───────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'xnca_hengheng_merchant');  // เปลี่ยนเป็นชื่อ DB บน Hostneverdie
define('DB_USER', 'xnca_hengheng_merchant');  // เปลี่ยน username
define('DB_PASS', 'BntaXSk96yAkGEUmhA9T');   // เปลี่ยน password
define('DB_CHARSET', 'utf8mb4');

// ─── JWT SECRET ───────────────────────────────────────────────
define('JWT_SECRET', 'hengheng-lucky-2026-change-me');
define('ADMIN_SECRET_PATH', 'mg2026');
define('TICKETS_PER_BAG', 20);

// ─── URL ─────────────────────────────────────────────────────
define('BASE_URL', 'https://เฮงเฮง.ปังจัง.com');  // เปลี่ยนตาม domain จริง
define('NEXT_JS_URL', 'https://เฮงเฮง.ปังจัง.com'); // Next.js frontend URL

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

// ─── HELPERS ─────────────────────────────────────────────────
function db_row(string $sql, array $params = []): ?array {
    $st = db()->prepare($sql);
    $st->execute($params);
    $r = $st->fetch();
    return $r ?: null;
}

function db_all(string $sql, array $params = []): array {
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st->fetchAll();
}

function db_run(string $sql, array $params = []): PDOStatement {
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function db_val(string $sql, array $params = []): mixed {
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st->fetchColumn();
}

function last_id(): string {
    return db()->lastInsertId();
}

function json_ok(array $data = [], int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_err(string $message, int $code = 400): never {
    json_ok(['error' => $message], $code);
}

function get_config(string $key, string $default = ''): string {
    static $cache = [];
    if (!isset($cache[$key])) {
        $r = db_val("SELECT value FROM SystemConfig WHERE `key`=?", [$key]);
        $cache[$key] = $r !== false ? $r : $default;
    }
    return $cache[$key];
}

function set_config(string $key, string $value, string $label = ''): void {
    db_run(
        "INSERT INTO SystemConfig (`key`,value,label,updatedAt) VALUES (?,?,?,NOW())
         ON DUPLICATE KEY UPDATE value=VALUES(value), updatedAt=NOW()",
        [$key, $value, $label]
    );
}
