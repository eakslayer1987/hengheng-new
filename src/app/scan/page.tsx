"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Step = "form" | "loading" | "success" | "blocked";

interface ScanResult {
  code?: string;
  merchantName?: string;
  campaignName?: string;
  campaignEndDate?: string;
  todayUsed?: number;
  dailyLimit?: number;
  remainingToday?: number;
  error?: string;
}

function ScanForm() {
  const params = useSearchParams();
  const router = useRouter();
  const merchantPhone = params.get("shop") || params.get("m") || "";

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "ok" | "denied">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!merchantPhone) {
      router.replace("/");
    }
    // Auto-request GPS on mount
    requestGps();
    setTimeout(() => nameRef.current?.focus(), 300);
  }, []);

  function requestGps() {
    if (!navigator.geolocation) return;
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("ok");
      },
      () => setGpsStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit() {
    if (!name.trim()) { setErrMsg("กรุณากรอกชื่อ"); return; }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 9) { setErrMsg("กรุณากรอกเบอร์โทรให้ถูกต้อง"); return; }
    setErrMsg("");
    setStep("loading");

    try {
      const res = await fetch("/api/lucky/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantPhone,
          customerName: name.trim(),
          customerPhone: cleanPhone,
          customerLat: coords?.lat,
          customerLng: coords?.lng,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data);
        setStep("success");
      } else {
        setResult({ error: data.error || "เกิดข้อผิดพลาด" });
        setStep("blocked");
      }
    } catch {
      setResult({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
      setStep("blocked");
    }
  }

  // ─── Loading ──────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <Screen>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16, animation: "spin 1s linear infinite" }}>⚙️</div>
          <p style={{ color: "rgba(232,184,32,0.8)", fontSize: 16 }}>กำลังตรวจสอบ...</p>
          <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
        </div>
      </Screen>
    );
  }

  // ─── Success ──────────────────────────────────────────────────
  if (step === "success" && result) {
    return (
      <Screen>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 8, animation: "pop .4s ease" }}>🎉</div>
          <h2 style={{ color: "#FFD700", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            รับโค้ดสำเร็จ!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 20 }}>
            {result.campaignName}
          </p>

          {/* Code card */}
          <div style={{
            background: "rgba(255,255,255,0.1)",
            border: "2px dashed rgba(255,215,0,0.5)",
            borderRadius: 16,
            padding: "20px 32px",
            marginBottom: 20,
          }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 6 }}>รหัสโชคของคุณ</p>
            <p style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 900,
              color: "#FFD700",
              letterSpacing: 6,
            }}>
              {result.code}
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
            <StatBadge label="วันนี้" value={`${result.todayUsed}/${result.dailyLimit}`} />
            <StatBadge label="คงเหลือ" value={`${result.remainingToday} ครั้ง`} />
          </div>

          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 24 }}>
            จาก {result.merchantName} • หมดเขต {result.campaignEndDate ? new Date(result.campaignEndDate).toLocaleDateString("th-TH") : "-"}
          </p>

          <button onClick={() => router.replace("/")} style={btnStyle("#FD1803")}>
            กลับหน้าหลัก
          </button>
          <style>{`@keyframes pop { 0%{transform:scale(0)} 80%{transform:scale(1.2)} 100%{transform:scale(1)} }`}</style>
        </div>
      </Screen>
    );
  }

  // ─── Blocked ──────────────────────────────────────────────────
  if (step === "blocked" && result) {
    return (
      <Screen>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🚫</div>
          <h2 style={{ color: "#FF6B6B", fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
            ไม่สามารถรับโค้ดได้
          </h2>
          <div style={{
            background: "rgba(255,107,107,0.15)",
            border: "1px solid rgba(255,107,107,0.3)",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
          }}>
            <p style={{ color: "#FFB3B3", fontSize: 15, lineHeight: 1.6 }}>{result.error}</p>
          </div>
          <button onClick={() => setStep("form")} style={btnStyle("rgba(255,255,255,0.15)")}>
            ← ลองใหม่
          </button>
        </div>
      </Screen>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────
  return (
    <Screen>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>📱</div>
        <h1 style={{ color: "#FFD700", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
          สแกน QR รับโค้ดลุ้นโชค
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          กรอกข้อมูลเพื่อรับโค้ดสะสมแต้ม
        </p>
      </div>

      {/* GPS Status bar */}
      <GpsBar status={gpsStatus} onRetry={requestGps} />

      {/* Form fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        <Field
          ref={nameRef}
          label="ชื่อ-นามสกุล"
          placeholder="กรุณากรอกชื่อ"
          value={name}
          onChange={setName}
          icon="👤"
        />
        <Field
          label="เบอร์โทรศัพท์"
          placeholder="0812345678"
          value={phone}
          onChange={setPhone}
          icon="📞"
          type="tel"
          maxLength={10}
        />
      </div>

      {errMsg && (
        <p style={{ color: "#FF6B6B", fontSize: 13, textAlign: "center", marginBottom: 12 }}>
          ⚠️ {errMsg}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!name.trim() || phone.replace(/\D/g, "").length < 9}
        style={{
          ...btnStyle("#FD1803"),
          opacity: !name.trim() || phone.replace(/\D/g, "").length < 9 ? 0.5 : 1,
          width: "100%",
        }}
      >
        รับโค้ดเลย 🎯
      </button>

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", marginTop: 16 }}>
        🔒 ข้อมูลของคุณปลอดภัย ใช้เพื่อการจับรางวัลเท่านั้น
      </p>
    </Screen>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#2a0202 0%,#4a0808 50%,#1a0101 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Kanit', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,215,0,0.2)",
        borderRadius: 24,
        padding: "32px 24px",
        backdropFilter: "blur(12px)",
      }}>
        {children}
      </div>
    </div>
  );
}

function GpsBar({ status, onRetry }: { status: string; onRetry: () => void }) {
  const configs: Record<string, { icon: string; text: string; color: string }> = {
    idle:    { icon: "📍", text: "รอตรวจสอบ GPS...",     color: "rgba(255,255,255,0.2)" },
    loading: { icon: "🔄", text: "กำลังหาตำแหน่ง...",   color: "rgba(255,215,0,0.3)" },
    ok:      { icon: "✅", text: "ตรวจสอบตำแหน่งแล้ว", color: "rgba(100,220,100,0.2)" },
    denied:  { icon: "⚠️", text: "ไม่สามารถเข้าถึง GPS",color: "rgba(255,107,107,0.2)" },
  };
  const c = configs[status] || configs.idle;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: c.color,
      borderRadius: 10,
      padding: "10px 14px",
      marginBottom: 20,
      fontSize: 13,
      color: "rgba(255,255,255,0.8)",
    }}>
      <span>{c.icon} {c.text}</span>
      {status === "denied" && (
        <button onClick={onRetry} style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          borderRadius: 6,
          color: "#fff",
          padding: "4px 10px",
          fontSize: 12,
          cursor: "pointer",
        }}>
          ลองใหม่
        </button>
      )}
    </div>
  );
}

const Field = ({ label, placeholder, value, onChange, icon, type = "text", maxLength, ref }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; icon: string;
  type?: string; maxLength?: number;
  ref?: React.RefObject<HTMLInputElement>;
}) => (
  <div>
    <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 6, display: "block" }}>
      {icon} {label}
    </label>
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,215,0,0.3)",
        borderRadius: 12,
        padding: "13px 16px",
        color: "#fff",
        fontSize: 16,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "'Kanit', sans-serif",
      }}
    />
  </div>
);

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.1)",
      borderRadius: 10,
      padding: "8px 16px",
      textAlign: "center",
    }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>{label}</p>
      <p style={{ color: "#FFD700", fontWeight: 700, fontSize: 16, margin: 0 }}>{value}</p>
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Kanit', sans-serif",
    transition: "transform .15s",
  };
}

export default function ScanPage() {
  return (
    <Suspense>
      <ScanForm />
    </Suspense>
  );
}
