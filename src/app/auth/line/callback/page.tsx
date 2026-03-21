"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("กำลังเข้าสู่ระบบด้วย LINE...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage("ยกเลิกการเข้าสู่ระบบ");
      setTimeout(() => window.close(), 2000);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("ไม่พบ authorization code");
      return;
    }

    fetch("/api/auth/line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirectUri: "https://xn--72czcz2c3de.com/auth/line/callback",
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus("error"); setMessage(data.error); return; }
        if (data.token) localStorage.setItem("tp_customer_token", data.token);
        if (data.customer) localStorage.setItem("tp_customer", JSON.stringify(data.customer));
        setStatus("success");
        setMessage(`สวัสดี ${data.customer?.name || "คุณ"}!`);
        setTimeout(() => { window.location.href = "/"; }, 1500);
      })
      .catch(() => { setStatus("error"); setMessage("ไม่สามารถเชื่อมต่อ LINE ได้"); });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        {status === "loading" && (<><Loader2 size={48} className="animate-spin text-[#06C755] mx-auto mb-4" /><p className="text-gray-600 font-medium">{message}</p></>)}
        {status === "success" && (<><div className="w-16 h-16 bg-[#06C755]/10 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-[#06C755]" /></div><p className="text-lg font-bold text-gray-800">{message}</p><p className="text-sm text-gray-400 mt-2">กำลังกลับไปหน้าสั่งอาหาร...</p></>)}
        {status === "error" && (<><div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><XCircle size={32} className="text-red-500" /></div><p className="text-lg font-bold text-gray-800">เกิดข้อผิดพลาด</p><p className="text-sm text-red-500 mt-2">{message}</p><a href="/" className="inline-block mt-4 px-6 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition">กลับหน้าหลัก</a></>)}
      </div>
    </div>
  );
}

export default function LineCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center p-6"><div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center"><Loader2 size={48} className="animate-spin text-[#06C755] mx-auto mb-4" /><p className="text-gray-600 font-medium">กำลังเข้าสู่ระบบด้วย LINE...</p></div></div>}>
      <CallbackContent />
    </Suspense>
  );
}
