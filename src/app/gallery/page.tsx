"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PHP_API = process.env.NEXT_PUBLIC_PHP_API_URL ||
  "https://xn--72ca9ib1gc.xn--72cac8e8ec.com/hengheng/api";

type Photo = {
  id: number; imageUrl: string; qrStatus: "available" | "empty";
  hasWinner: boolean; caption: string; reporterName: string; timeAgo: string;
  merchantId: number; merchantName: string; merchantAddr: string;
  lat: number; lng: number;
};
type Merchant = { id: number; name: string; phone: string; address: string };

const T = {
  bg:"#0d1117", bg2:"#161b22", bg3:"#1f2937",
  g:"#E8B820", g3:"#A67208",
  r:"#FD1803", grn:"#3fb950", red:"#f85149", blue:"#58a6ff",
  txt:"#e6edf3", sub:"rgba(200,220,255,0.6)", mut:"rgba(150,170,210,0.4)",
  bor:"rgba(255,255,255,0.08)", bor2:"rgba(232,184,32,0.4)",
};

type Filter = "all" | "hasQr" | "noQr" | "winner";
const FILTERS: { key: Filter; label: string }[] = [
  { key:"all",    label:"ทั้งหมด" },
  { key:"hasQr",  label:"มี QR" },
  { key:"noQr",   label:"QR หมด" },
  { key:"winner", label:"🏆 ผู้โชคดี" },
];

/* ── Upload Sheet ── */
function UploadSheet({ merchants, onClose, onUploaded }: {
  merchants: Merchant[]; onClose: () => void; onUploaded: () => void;
}) {
  const fileRef    = useRef<HTMLInputElement>(null);
  const [preview, setPreview]       = useState("");
  const [file, setFile]             = useState<File | null>(null);
  const [merchantId, setMerchantId] = useState<number | null>(null);
  const [phone, setPhone]           = useState("");
  const [qrStatus, setQrStatus]     = useState<"available"|"empty">("available");
  const [caption, setCaption]       = useState("");
  const [reporterName, setReporterName] = useState("");
  const [uploading, setUploading]   = useState(false);
  const [err, setErr]               = useState("");
  const [success, setSuccess]       = useState(false);

  // filter merchant by phone search
  const filtered = phone.length >= 2
    ? merchants.filter(m => m.name.includes(phone) || m.phone.includes(phone))
    : merchants;

  function pickFile(f: File) {
    if (f.size > 8*1024*1024) { setErr("ไฟล์ใหญ่เกิน 8MB"); return; }
    setFile(f); setErr("");
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function submit() {
    if (!file)        { setErr("กรุณาเลือกรูป"); return; }
    if (!merchantId)  { setErr("กรุณาเลือกร้านค้า"); return; }
    const m = merchants.find(x => x.id === merchantId);
    if (!m)           { setErr("ไม่พบร้านค้า"); return; }

    setUploading(true); setErr("");
    const form = new FormData();
    form.append("phone",        m.phone);
    form.append("qrStatus",     qrStatus);
    form.append("caption",      caption);
    form.append("reporterName", reporterName || "ผู้ใช้");
    form.append("image",        file);

    const r = await fetch(`${PHP_API}/gallery.php`, { method:"POST", body:form });
    const d = await r.json();
    if (r.ok) { setSuccess(true); setTimeout(() => { onUploaded(); onClose(); }, 1800); }
    else setErr(d.error || "อัปโหลดไม่สำเร็จ");
    setUploading(false);
  }

  const iS: React.CSSProperties = {
    background:"rgba(255,255,255,.04)", border:`1px solid ${T.bor}`,
    color:T.txt, width:"100%", padding:"10px 14px", borderRadius:10,
    outline:"none", fontSize:13, fontFamily:"'Kanit',sans-serif",
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
        transition={{ type:"spring", stiffness:320, damping:32 }}
        style={{
          width:"100%", maxWidth:480, margin:"0 auto",
          background:T.bg2, borderRadius:"20px 20px 0 0",
          border:`1px solid ${T.bor}`, padding:"12px 16px 32px",
          maxHeight:"90vh", overflowY:"auto",
        }}>
        <div style={{ width:32, height:3, background:T.bor, borderRadius:2, margin:"0 auto 16px" }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <p style={{ fontSize:16, fontWeight:800 }}>📷 อัปโหลดภาพ</p>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${T.bor}`, borderRadius:8, padding:"4px 10px", cursor:"pointer", color:T.sub, fontSize:11 }}>✕ ปิด</button>
        </div>

        {success ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <p style={{ fontSize:16, fontWeight:800, color:T.grn }}>อัปโหลดสำเร็จ!</p>
            <p style={{ fontSize:12, color:T.sub, marginTop:4 }}>ขอบคุณที่ช่วยอัปเดตข้อมูลครับ 🙏</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Image picker */}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }}/>
            {preview ? (
              <div style={{ position:"relative" }}>
                <img src={preview} style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:12 }}/>
                <button onClick={() => { setFile(null); setPreview(""); }}
                  style={{ position:"absolute", top:8, right:8, width:28, height:28, borderRadius:"50%", background:"rgba(0,0,0,.7)", border:"none", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                style={{
                  height:140, background:"rgba(255,255,255,.03)", border:`2px dashed ${T.bor}`,
                  borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", cursor:"pointer", gap:8,
                }}>
                <span style={{ fontSize:32 }}>📸</span>
                <p style={{ fontSize:13, fontWeight:700, color:T.sub }}>ถ่ายภาพ / เลือกรูป</p>
                <p style={{ fontSize:11, color:T.mut }}>JPG, PNG, WEBP ขนาดไม่เกิน 8MB</p>
              </button>
            )}

            {/* Merchant search */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.mut, display:"block", marginBottom:5 }}>ค้นหาร้านค้า *</label>
              <input value={phone} onChange={e => { setPhone(e.target.value); setMerchantId(null); }}
                placeholder="ชื่อร้านหรือเบอร์โทร" style={iS}/>
              {phone.length >= 2 && !merchantId && (
                <div style={{ border:`1px solid ${T.bor}`, borderRadius:10, marginTop:4, overflow:"hidden", maxHeight:160, overflowY:"auto" }}>
                  {filtered.slice(0,6).map(m => (
                    <div key={m.id} onClick={() => { setMerchantId(m.id); setPhone(m.name); }}
                      style={{ padding:"10px 12px", cursor:"pointer", borderBottom:`1px solid ${T.bor}`, fontSize:13, fontWeight:600 }}>
                      {m.name} <span style={{ fontSize:11, color:T.sub }}>{m.address}</span>
                    </div>
                  ))}
                  {filtered.length === 0 && <p style={{ padding:"10px 12px", fontSize:12, color:T.mut }}>ไม่พบร้านค้า</p>}
                </div>
              )}
              {merchantId && <p style={{ fontSize:11, color:T.grn, marginTop:4, fontWeight:700 }}>✅ เลือกแล้ว</p>}
            </div>

            {/* QR Status */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.mut, display:"block", marginBottom:8 }}>สถานะ QR ตอนนี้ *</label>
              <div style={{ display:"flex", gap:8 }}>
                {(["available","empty"] as const).map(s => (
                  <button key={s} onClick={() => setQrStatus(s)}
                    style={{
                      flex:1, padding:"10px 0", borderRadius:10, cursor:"pointer",
                      fontFamily:"'Kanit',sans-serif", fontSize:13, fontWeight:700,
                      border:`1px solid ${qrStatus===s ? (s==="available" ? "rgba(63,185,80,.5)" : "rgba(248,81,73,.5)") : T.bor}`,
                      background: qrStatus===s ? (s==="available" ? "rgba(63,185,80,.12)" : "rgba(248,81,73,.1)") : "rgba(255,255,255,.03)",
                      color: qrStatus===s ? (s==="available" ? T.grn : T.red) : T.sub,
                    }}>{s==="available" ? "🟢 มี QR" : "🔴 QR หมด"}</button>
                ))}
              </div>
            </div>

            {/* Caption + reporter */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.mut, display:"block", marginBottom:5 }}>คำบรรยาย (ไม่บังคับ)</label>
              <input value={caption} onChange={e => setCaption(e.target.value)} maxLength={200}
                placeholder="เช่น QR ยังมีเยอะครับ เพิ่งเติมใหม่" style={iS}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.mut, display:"block", marginBottom:5 }}>ชื่อผู้รายงาน (ไม่บังคับ)</label>
              <input value={reporterName} onChange={e => setReporterName(e.target.value)} maxLength={60}
                placeholder="ชื่อเล่นหรือชื่อจริง" style={iS}/>
            </div>

            {err && (
              <div style={{ padding:"8px 12px", borderRadius:10, background:"rgba(248,81,73,.1)", border:"1px solid rgba(248,81,73,.3)", fontSize:12, color:T.red, fontWeight:700 }}>
                ⚠️ {err}
              </div>
            )}

            <button onClick={submit} disabled={uploading || !file || !merchantId}
              style={{
                height:46, borderRadius:12, border:"none", cursor: file && merchantId ? "pointer" : "default",
                background: file && merchantId ? `linear-gradient(135deg,${T.r},#a00000)` : "rgba(255,255,255,.06)",
                color: file && merchantId ? "#fff" : T.mut,
                fontFamily:"'Kanit',sans-serif", fontSize:14, fontWeight:700,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}>
              {uploading ? "⏳ กำลังอัปโหลด..." : "📤 อัปโหลดภาพ"}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Photo Lightbox ── */
function Lightbox({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,.9)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <motion.div initial={{ scale:.9 }} animate={{ scale:1 }} exit={{ scale:.9 }}
        onClick={e => e.stopPropagation()}
        style={{ width:"100%", maxWidth:420, background:T.bg2, border:`1px solid ${T.bor}`, borderRadius:16, overflow:"hidden" }}>
        <img src={`${PHP_API.replace("/api","")}${photo.imageUrl}`} alt={photo.merchantName}
          style={{ width:"100%", maxHeight:280, objectFit:"cover" }}
          onError={e => { (e.target as HTMLImageElement).style.display="none"; }}/>
        <div style={{ padding:"12px 14px 16px" }}>
          <div style={{ display:"flex", gap:6, marginBottom:8 }}>
            <span style={{
              fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6,
              background: photo.qrStatus==="available" ? "rgba(63,185,80,.12)" : "rgba(248,81,73,.1)",
              border:`1px solid ${photo.qrStatus==="available" ? "rgba(63,185,80,.3)" : "rgba(248,81,73,.3)"}`,
              color: photo.qrStatus==="available" ? T.grn : T.red,
            }}>{photo.qrStatus==="available" ? "🟢 มี QR" : "🔴 QR หมด"}</span>
            {photo.hasWinner && <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6, background:"rgba(232,184,32,.12)", border:`1px solid rgba(232,184,32,.3)`, color:T.g }}>🏆 ผู้โชคดี</span>}
          </div>
          <p style={{ fontSize:15, fontWeight:800 }}>{photo.merchantName}</p>
          <p style={{ fontSize:11, color:T.sub, marginTop:2 }}>📍 {photo.merchantAddr || "—"}</p>
          {photo.caption && <p style={{ fontSize:12, color:T.sub, marginTop:8, fontStyle:"italic" }}>"{photo.caption}"</p>}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10 }}>
            <p style={{ fontSize:11, color:T.mut }}>โดย {photo.reporterName} · {photo.timeAgo}</p>
            <button onClick={onClose}
              style={{ background:"none", border:`1px solid ${T.bor}`, borderRadius:8, padding:"4px 12px", cursor:"pointer", color:T.sub, fontSize:11 }}>ปิด</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── MAIN ── */
export default function GalleryPage() {
  const [photos, setPhotos]         = useState<Photo[]>([]);
  const [merchants, setMerchants]   = useState<Merchant[]>([]);
  const [filter, setFilter]         = useState<Filter>("all");
  const [loading, setLoading]       = useState(false);
  const [hasMore, setHasMore]       = useState(true);
  const [offset, setOffset]         = useState(0);
  const [total, setTotal]           = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [lightbox, setLightbox]     = useState<Photo | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const BASE_URL = PHP_API.replace("/api", "");

  async function loadPhotos(f: Filter, off: number, replace = false) {
    if (loading) return;
    setLoading(true);
    try {
      const r = await fetch(`${PHP_API}/gallery.php?filter=${f}&limit=18&offset=${off}`);
      const d = await r.json();
      if (d.photos) {
        setPhotos(prev => replace ? d.photos : [...prev, ...d.photos]);
        setTotal(d.total || 0);
        setOffset(d.offset || 0);
        setHasMore(d.hasMore || false);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    // load merchants for upload
    fetch(`${PHP_API}/merchants.php`)
      .then(r => r.json())
      .then(d => { if (d.merchants) setMerchants(d.merchants); });
  }, []);

  useEffect(() => {
    setPhotos([]); setOffset(0); setHasMore(true);
    loadPhotos(filter, 0, true);
  }, [filter]);

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadPhotos(filter, offset);
      }
    }, { threshold:.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, offset, filter]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", maxWidth:480, margin:"0 auto", background:T.bg, color:T.txt, fontFamily:"'Kanit',sans-serif", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ flexShrink:0, background:T.bg2, borderBottom:`1px solid ${T.bor}`, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <a href="/map" style={{ width:34, height:34, borderRadius:9, border:`1px solid ${T.bor}`, background:"rgba(255,255,255,.04)", display:"flex", alignItems:"center", justifyContent:"center", color:T.sub, textDecoration:"none", fontSize:16 }}>←</a>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:15, fontWeight:900 }}>คลัง<span style={{color:T.g}}>ภาพ</span></p>
          <p style={{ fontSize:9, color:T.mut }}>{total > 0 ? `${total} ภาพ` : "ภาพร้านค้าพาร์ทเนอร์"}</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          style={{
            display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
            borderRadius:12, border:"none", cursor:"pointer",
            background:`linear-gradient(135deg,${T.g3},${T.g})`,
            fontFamily:"'Kanit',sans-serif", fontSize:12, fontWeight:700, color:"#3d1f00",
          }}>📷 รายงาน</button>
      </div>

      {/* Filter chips */}
      <div style={{ flexShrink:0, background:T.bg2, borderBottom:`1px solid ${T.bor}`, display:"flex", gap:6, overflow:"auto", padding:"8px 12px", scrollbarWidth:"none" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              flexShrink:0, padding:"5px 14px", borderRadius:20, cursor:"pointer",
              fontFamily:"'Kanit',sans-serif", fontSize:11, fontWeight:700,
              border:`1px solid ${filter===f.key ? "rgba(232,184,32,.45)" : T.bor}`,
              background: filter===f.key ? "rgba(232,184,32,.1)" : "rgba(255,255,255,.03)",
              color: filter===f.key ? T.g : T.sub,
            }}>{f.label}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2, padding:"2px" }}>
          {photos.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay: (i%18)*0.03 }}
              onClick={() => setLightbox(p)}
              style={{ position:"relative", aspectRatio:"3/4", borderRadius:6, overflow:"hidden", background:T.bg2, cursor:"pointer" }}>

              {/* Image */}
              <img src={`${BASE_URL}${p.imageUrl}`} alt={p.merchantName}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
                loading="lazy"
                onError={e => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                  const parent = img.parentElement!;
                  parent.style.background = T.bg3;
                  parent.innerHTML += `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px">🏪</div>`;
                }}/>

              {/* Overlay */}
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,.75) 40%,transparent 70%)" }}/>

              {/* Status badge */}
              <div style={{ position:"absolute", top:5, left:5, display:"flex", flexDirection:"column", gap:2 }}>
                <span style={{
                  fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:4,
                  background: p.qrStatus==="available" ? "rgba(63,185,80,.9)" : "rgba(248,81,73,.9)",
                  color:"#fff", display:"flex", alignItems:"center", gap:2,
                }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:"currentColor" }}/>
                  {p.qrStatus==="available" ? "มี QR" : "หมด"}
                </span>
                {p.hasWinner && <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:4, background:"rgba(232,184,32,.9)", color:"#3d1f00" }}>🏆</span>}
              </div>

              {/* Bottom info */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"5px 6px" }}>
                <p style={{ fontSize:9, fontWeight:700, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.merchantName}</p>
                <p style={{ fontSize:8, color:"rgba(255,255,255,.55)" }}>{p.reporterName} · {p.timeAgo}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Loading / no more */}
        <div ref={loaderRef} style={{ padding:"20px 0", textAlign:"center" }}>
          {loading && <p style={{ fontSize:12, color:T.mut }}>⏳ กำลังโหลด...</p>}
          {!loading && !hasMore && photos.length > 0 && <p style={{ fontSize:11, color:T.mut }}>— จบแล้วครับ —</p>}
          {!loading && photos.length === 0 && (
            <div style={{ paddingTop:60 }}>
              <p style={{ fontSize:32, marginBottom:12 }}>📷</p>
              <p style={{ fontSize:14, fontWeight:700, color:T.sub }}>ยังไม่มีภาพในหมวดนี้</p>
              <p style={{ fontSize:12, color:T.mut, marginTop:4 }}>กดปุ่ม "รายงาน" เพื่ออัปโหลดภาพแรก!</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload FAB */}
      <motion.button whileTap={{ scale:.92 }} onClick={() => setShowUpload(true)}
        style={{
          position:"fixed", bottom:24, right:24, zIndex:100,
          width:56, height:56, borderRadius:"50%", border:"none", cursor:"pointer",
          background:`linear-gradient(135deg,${T.g3},${T.g})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:24, boxShadow:"0 4px 20px rgba(232,184,32,.5)",
        }}>📷</motion.button>

      <AnimatePresence>
        {showUpload && <UploadSheet merchants={merchants} onClose={() => setShowUpload(false)} onUploaded={() => { setPhotos([]); setOffset(0); loadPhotos(filter, 0, true); }}/>}
        {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)}/>}
      </AnimatePresence>
    </div>
  );
}
