// @ts-nocheck
export async function sendLineNotify(message: string) {
  const token = process.env.LINE_NOTIFY_TOKEN;
  if (!token) { console.log("[LINE Notify] No token:", message); return; }
  try {
    await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Bearer ${token}` },
      body: `message=${encodeURIComponent(message)}`,
    });
  } catch (e) { console.error("[LINE Notify] Error:", e); }
}
