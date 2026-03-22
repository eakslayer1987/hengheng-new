<?php
/**
 * includes/functions.php
 * Helper functions ที่ใช้ทั่วไปใน PHP API
 */

if (!function_exists('haversine_m')) {
    /**
     * คำนวณระยะทางระหว่าง 2 จุด GPS (เมตร)
     */
    function haversine_m(float $lat1, float $lng1, float $lat2, float $lng2): float {
        $R = 6371000;
        $dLat = ($lat2 - $lat1) * M_PI / 180;
        $dLng = ($lng2 - $lng1) * M_PI / 180;
        $a = sin($dLat / 2) ** 2
           + cos($lat1 * M_PI / 180) * cos($lat2 * M_PI / 180) * sin($dLng / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}

if (!function_exists('paginate')) {
    /**
     * Simple pagination helper
     */
    function paginate(int $page, int $perPage = 20): array {
        $page = max(1, $page);
        return [
            'limit'  => $perPage,
            'offset' => ($page - 1) * $perPage,
            'page'   => $page,
        ];
    }
}

if (!function_exists('safe_str')) {
    /**
     * Truncate + sanitize string
     */
    function safe_str(string $s, int $maxLen = 255): string {
        return substr(trim($s), 0, $maxLen);
    }
}
