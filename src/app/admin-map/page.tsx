"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const PHP_API = process.env.NEXT_PUBLIC_PHP_API_URL ||
  "https://xn--72ca9ib1gc.xn--72cac8e8ec.com/hengheng/api";

type AdminUser = { lineUserId: string; displayName: string; avatarUrl: string; isAdmin: boolean };
type Merchant  = {
  id: number; name: string; address: string; lat: number; lng: number; phone: string;
  status: string; isActive: boolean;
  qrTotal: number; qrUsed: number; qrRemaining: number;
  todayScans: number; winners: number;
};
type Summary = { pending: number; todayScans: number; totalWinners: number };

const T = {
  bg:"#0d1117", bg2:"#161b22", bg3:"#1f2937",
  g:"#E8B820", g2:"#F5D78E", g3:"#A67208",
  r:"#FD1803", grn:"#3fb950", red:"#f85149", blue:"#58a6ff",
  txt:"#e6edf3", sub:"rgba(200,220,255,0.6)", mut:"rgba(150,170,210,0.4)",
  bor:"rgba(255,255,255,0.08)", bor2:"rgba(232,184,32,0.4)",
};

function dotColor(m: Merchant) {
  if (m.status !== "approved") return T.mut;
  if (m.winners > 0) return T.g;
  if (m.qrRemaining <= 0) return T.red;
  return T.grn;
}

/* ── LINE Login Screen ── */
function LoginScreen({ onLogin }: { onLogin: (u: AdminUser, t: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  async function loginWithLine() {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${PHP_API}/admin_map.php`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"get_line_url" }),
      });
      const d = await r.json();
      if (d.url) {
        sessionStorage.setItem("line_oauth_state", d.state || "");
        window.location.href = d.url;
      } else setErr("ไม่สามารถเชื่อมต่อ LINE ได้");
    } catch { setErr("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
    setLoading(false);
  }

  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      height:"100dvh", maxWidth:480, margin:"0 auto",
      background:T.bg, fontFamily:"'Kanit',sans-serif", padding:24,
    }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ width:"100%", maxWidth:360, textAlign:"center" }}>

        <div style={{ fontSize:56, marginBottom:16 }}>🗺️</div>
        <h1 style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>
          Admin <span style={{color:T.g}}>Map</span>
        </h1>
        <p style={{ fontSize:13, color:T.sub, marginBottom:32 }}>เข้าสู่ระบบด้วย LINE เพื่อจัดการแผนที่ร้านค้า</p>

        <div style={{ background:T.bg2, border:`1px solid ${T.bor}`, borderRadius:20, padding:24 }}>
          <button onClick={loginWithLine} disabled={loading}
            style={{
              width:"100%", height:50, borderRadius:14, border:"none", cursor:"pointer",
              background:"#00B900", color:"#fff",
              fontFamily:"'Kanit',sans-serif", fontSize:15, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              boxShadow:"0 4px 20px rgba(0,185,0,.35)",
            }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            {loading ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย LINE"}
          </button>

          {err && <p style={{ fontSize:12, color:T.red, marginTop:12, fontWeight:700 }}>⚠️ {err}</p>}

          <p style={{ fontSize:11, color:T.mut, marginTop:16 }}>
            เฉพาะ Admin ที่ได้รับสิทธิ์เท่านั้น<br/>ติดต่อ Super Admin เพื่อขอสิทธิ์
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Admin Map Component (Leaflet) ── */
const AdminMapLeaflet = dynamic(() => import("./AdminMapLeaflet"), { ssr:false, loading:()=>(
  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:T.mut,flexDirection:"column",gap:8}}>
    <span style={{fontSize:28}}>🗺️</span><p style={{fontSize:13}}>กำลังโหลดแผนที่...</p>
  </div>
)});

/* ── Merchant Detail Sheet ── */
function MerchantSheet({
  merchant, token, onClose, onRefresh,
}: {
  merchant: Merchant; token: string;
  onClose: () => void; onRefresh: () => void;
}) {
  const [addQr, setAddQr]   = useState(30);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");

  async function call(action: string, extra: object = {}) {
    setLoading(true); setMsg("");
    const r = await fetch(`${PHP_API}/admin_map.php`, {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
      body:JSON.stringify({ action, merchantId:merchant.id, ...extra }),
    });
    const d = await r.json();
    setMsg(r.ok ? (d.message || "✅ สำเร็จ") : (d.error || "เกิดข้อผิดพลาด"));
    if (r.ok) setTimeout(() => { onRefresh(); onClose(); }, 1200);
    setLoading(false);
  }

  const iS: React.CSSProperties = {
    background:"rgba(255,255,255,.04)", border:`1px solid ${T.bor}`,
    color:T.txt, width:"100%", padding:"8px 12px", borderRadius:10,
    outline:"none", fontSize:13, fontFamily:"'Kanit',sans-serif",
  };

  return (
    <motion.div initial={{ y:"105%" }} animate={{ y:0 }} exit={{ y:"105%" }}
      transition={{ type:"spring", stiffness:320, damping:32 }}
      style={{
        position:"absolute", bottom:0, left:0, right:0, zIndex:700,
        background:T.bg2, border:`1px solid ${T.bor}`,
        borderRadius:"18px 18px 0 0", padding:"10px 16px 28px",
        maxHeight:"70vh", overflowY:"auto",
      }}>
      <div style={{ width:32, height:3, background:T.bor, borderRadius:2, margin:"0 auto 12px" }}/>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div>
          <p style={{ fontSize:15, fontWeight:800 }}>{merchant.name}</p>
          <p style={{ fontSize:11, color:T.sub, marginTop:1 }}>📍 {merchant.address || "—"}</p>
        </div>
        <button onClick={onClose}
          style={{ background:"none", border:`1px solid ${T.bor}`, borderRadius:8, padding:"4px 10px", cursor:"pointer", color:T.sub, fontSize:11 }}>✕</button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        {[
          { l:"QR เหลือ",   v:merchant.qrRemaining, c:T.g },
          { l:"สแกนวันนี้", v:merchant.todayScans,  c:T.blue },
          { l:"ผู้โชคดี",  v:merchant.winners,      c:merchant.winners>0?T.g:T.mut },
        ].map((s,i) => (
          <div key={i} style={{ background:"rgba(255,255,255,.04)", border:`1px solid ${T.bor}`, borderRadius:10, padding:"8px 10px", textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:9, color:T.mut, marginTop:1 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Status control */}
      <div style={{ marginBottom:12 }}>
        <p style={{ fontSize:11, fontWeight:700, color:T.sub, marginBottom:8 }}>สถานะร้านค้า</p>
        <div style={{ display:"flex", gap:6 }}>
          {(["approved","rejected","pending"] as const).map(s => (
            <button key={s} onClick={() => call("set_status", { status:s })}
              disabled={loading || merchant.status===s}
              style={{
                flex:1, padding:"7px 0", borderRadius:10, cursor:"pointer",
                fontFamily:"'Kanit',sans-serif", fontSize:11, fontWeight:700, border:"none",
                background: merchant.status===s
                  ? (s==="approved"?"rgba(63,185,80,.2)":s==="rejected"?"rgba(248,81,73,.15)":"rgba(232,184,32,.12)")
                  : "rgba(255,255,255,.05)",
                color: s==="approved"?T.grn:s==="rejected"?T.red:T.g,
                opacity: merchant.status===s ? 1 : .6,
              }}>
              {s==="approved"?"✅ อนุมัติ":s==="rejected"?"❌ ปฏิเสธ":"⏳ รอ"}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle active */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, padding:"10px 12px", background:"rgba(255,255,255,.03)", borderRadius:10, border:`1px solid ${T.bor}` }}>
        <div>
          <p style={{ fontSize:13, fontWeight:700 }}>เปิด/ปิดร้าน</p>
          <p style={{ fontSize:11, color:T.sub }}>ปิดร้านจะซ่อนจากแผนที่ผู้ใช้</p>
        </div>
        <button onClick={() => call("toggle_active", { isActive:!merchant.isActive })}
          style={{
            width:48, height:26, borderRadius:13, border:"none", cursor:"pointer",
            background: merchant.isActive ? T.grn : "rgba(255,255,255,.1)",
            position:"relative", transition:"background .2s",
          }}>
          <div style={{
            width:20, height:20, borderRadius:"50%", background:"#fff",
            position:"absolute", top:3, left: merchant.isActive ? 25 : 3,
            transition:"left .2s",
          }}/>
        </button>
      </div>

      {/* Add QR */}
      <div style={{ marginBottom:14 }}>
        <p style={{ fontSize:11, fontWeight:700, color:T.sub, marginBottom:8 }}>เพิ่ม QR Quota</p>
        <div style={{ display:"flex", gap:8 }}>
          <input type="number" value={addQr} min={1} max={999}
            onChange={e => setAddQr(+e.target.value)}
            style={{ ...iS, flex:1 }}/>
          <button onClick={() => call("add_quota", { codes:addQr })} disabled={loading}
            style={{
              padding:"8px 16px", borderRadius:10, border:"none", cursor:"pointer",
              background:`linear-gradient(135deg,${T.g3},${T.g})`,
              fontFamily:"'Kanit',sans-serif", fontSize:12, fontWeight:700, color:"#3d1f00",
              flexShrink:0,
            }}>+ เพิ่ม QR</button>
        </div>
      </div>

      {msg && (
        <div style={{
          padding:"8px 12px", borderRadius:10, fontSize:12, fontWeight:700,
          background: msg.startsWith("✅") ? "rgba(63,185,80,.1)" : "rgba(248,81,73,.1)",
          border:`1px solid ${msg.startsWith("✅") ? "rgba(63,185,80,.3)" : "rgba(248,81,73,.25)"}`,
          color: msg.startsWith("✅") ? T.grn : T.red,
        }}>{msg}</div>
      )}
    </motion.div>
  );
}

/* ── MAIN ── */
export default function AdminMapPage() {
  const [user, setUser]           = useState<AdminUser | null>(null);
  const [token, setToken]         = useState("");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [summary, setSummary]     = useState<Summary>({ pending:0, todayScans:0, totalWinners:0 });
  const [selected, setSelected]   = useState<Merchant | null>(null);
  const [loading, setLoading]     = useState(false);
  const [searchQ, setSearchQ]     = useState("");
  const [tab, setTab]             = useState<"map"|"list">("map");

  // Handle LINE callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const saved  = sessionStorage.getItem("line_oauth_state");
    if (!code) return;

    // clear URL
    window.history.replaceState({}, "", "/admin-map");

    async function doLogin() {
      const r = await fetch(`${PHP_API}/admin_map.php`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ action:"line_verify", code }),
      });
      const d = await r.json();
      if (r.ok && d.token) {
        const u: AdminUser = { lineUserId:"", displayName:d.displayName, avatarUrl:d.avatarUrl, isAdmin:true };
        localStorage.setItem("admin_map_token", d.token);
        localStorage.setItem("admin_map_user", JSON.stringify(u));
        setUser(u); setToken(d.token);
      } else {
        alert(d.error || "เข้าสู่ระบบไม่สำเร็จ");
      }
    }
    doLogin();
  }, []);

  // Restore session
  useEffect(() => {
    const t = localStorage.getItem("admin_map_token");
    const u = localStorage.getItem("admin_map_user");
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
  }, []);

  // Load merchants
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const r = await fetch(`${PHP_API}/admin_map.php`, {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
      body:JSON.stringify({ action:"get_overview" }),
    });
    const d = await r.json();
    if (r.ok) {
      setMerchants(d.merchants || []);
      setSummary(d.summary || { pending:0, todayScans:0, totalWinners:0 });
    } else if (r.status === 401) {
      localStorage.removeItem("admin_map_token");
      localStorage.removeItem("admin_map_user");
      setUser(null); setToken("");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  function logout() {
    localStorage.removeItem("admin_map_token");
    localStorage.removeItem("admin_map_user");
    setUser(null); setToken("");
  }

  if (!user) return <LoginScreen onLogin={(u,t)=>{ setUser(u); setToken(t); }}/>;

  const filtered = merchants.filter(m =>
    !searchQ || m.name.toLowerCase().includes(searchQ.toLowerCase()) || m.phone.includes(searchQ)
  );

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100dvh", maxWidth:480, margin:"0 auto",
      background:T.bg, color:T.txt, fontFamily:"'Kanit',sans-serif", overflow:"hidden",
    }}>

      {/* Header */}
      <div style={{ flexShrink:0, background:T.bg2, borderBottom:`1px solid ${T.bor}`, padding:"10px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <a href="/map" style={{ width:32, height:32, borderRadius:9, border:`1px solid ${T.bor}`, background:"rgba(255,255,255,.04)", display:"flex", alignItems:"center", justifyContent:"center", color:T.sub, textDecoration:"none", fontSize:14 }}>←</a>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:800 }}>Admin <span style={{color:T.g}}>Map</span></p>
          </div>
          {user.avatarUrl && <img src={user.avatarUrl} style={{ width:32, height:32, borderRadius:"50%", border:`1px solid ${T.bor2}` }}/>}
          <div>
            <p style={{ fontSize:11, fontWeight:700 }}>{user.displayName}</p>
            <button onClick={logout} style={{ fontSize:9, color:T.red, background:"none", border:"none", cursor:"pointer", fontFamily:"'Kanit',sans-serif", padding:0 }}>ออกจากระบบ</button>
          </div>
        </div>

        {/* Summary chips */}
        <div style={{ display:"flex", gap:6 }}>
          {[
            { l:"รอดำเนินการ", v:summary.pending, c:T.g, bg:"rgba(232,184,32,.1)", bo:"rgba(232,184,32,.3)" },
            { l:"สแกนวันนี้",  v:summary.todayScans, c:T.blue, bg:"rgba(88,166,255,.1)", bo:"rgba(88,166,255,.3)" },
            { l:"ผู้โชคดีรวม", v:summary.totalWinners, c:T.grn, bg:"rgba(63,185,80,.1)", bo:"rgba(63,185,80,.3)" },
          ].map((s,i) => (
            <div key={i} style={{ flex:1, background:s.bg, border:`1px solid ${s.bo}`, borderRadius:10, padding:"6px 8px", textAlign:"center" }}>
              <div style={{ fontSize:16, fontWeight:900, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:8, color:T.mut, marginTop:1 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab + Search */}
      <div style={{ flexShrink:0, background:T.bg2, borderBottom:`1px solid ${T.bor}`, padding:"8px 12px", display:"flex", gap:8 }}>
        {(["map","list"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding:"6px 16px", borderRadius:20, cursor:"pointer",
              fontFamily:"'Kanit',sans-serif", fontSize:11, fontWeight:700, border:"none",
              background: tab===t ? T.g : "rgba(255,255,255,.05)",
              color: tab===t ? "#3d1f00" : T.sub,
            }}>{t==="map" ? "🗺️ แผนที่" : "📋 รายการ"}</button>
        ))}
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="🔍 ค้นหาร้าน..."
          style={{
            flex:1, background:"rgba(255,255,255,.04)", border:`1px solid ${T.bor}`,
            color:T.txt, padding:"6px 12px", borderRadius:20, outline:"none",
            fontSize:12, fontFamily:"'Kanit',sans-serif",
          }}/>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
        {loading && !merchants.length && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, color:T.mut }}>
            <span style={{ fontSize:28 }}>⏳</span>
            <p style={{ fontSize:13 }}>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* MAP */}
        {tab === "map" && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column" }}>
            <AdminMapLeaflet
              merchants={filtered}
              onSelect={m => setSelected(m)}
            />
            <AnimatePresence>
              {selected && (
                <MerchantSheet
                  merchant={selected} token={token}
                  onClose={() => setSelected(null)}
                  onRefresh={loadData}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* LIST */}
        {tab === "list" && (
          <div style={{ position:"absolute", inset:0, overflowY:"auto", paddingBottom:16 }}>
            {filtered.map(m => (
              <div key={m.id} onClick={() => { setSelected(m); setTab("map"); }}
                style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"11px 14px", borderBottom:`1px solid ${T.bor}`, cursor:"pointer",
                }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:dotColor(m), flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700 }}>{m.name}</p>
                  <p style={{ fontSize:10, color:T.sub, marginTop:1 }}>{m.address || "—"}</p>
                  <div style={{ display:"flex", gap:4, marginTop:3 }}>
                    <span style={{ fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:4,
                      background: m.status==="approved" ? "rgba(63,185,80,.15)" : "rgba(248,81,73,.12)",
                      color: m.status==="approved" ? T.grn : T.red,
                    }}>{m.status==="approved"?"✅ อนุมัติ":m.status==="pending"?"⏳ รอ":"❌ ปฏิเสธ"}</span>
                    <span style={{ fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:4, background:"rgba(232,184,32,.1)", color:T.g }}>
                      QR {m.qrRemaining}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontSize:14, fontWeight:800, color:T.g }}>{m.todayScans}</p>
                  <p style={{ fontSize:9, color:T.mut }}>สแกนวันนี้</p>
                </div>
                <span style={{ color:T.mut }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
