// @ts-nocheck
/**
 * PHP API URL — ชี้ไปที่ VPS ผ่าน Cloudflare Worker
 * Set NEXT_PUBLIC_PHP_API_URL ใน Vercel Environment Variables
 */
export const PHP_API =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PHP_API_URL) ||
  "https://xn--72ca9ib1gc.xn--72cac8e8ec.com/hengheng/api";
