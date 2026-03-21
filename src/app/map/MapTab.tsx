"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";

/* ── Types ── */
type Merchant = {
  id: number; name: string; address: string;
  lat: number; lng: number; phone: string;
  qrTotal: number; qrUsed: number; qrRemaining: number;
  hasQr: boolean; todayScans: number; hasWinner: boolean;
};
type MapStats = { total: number; withQr: number; todayScans: number };
type Filter = "all" | "hasQr" | "noQr" | "winner";

const T = {
  bg:"#0d1117", bg2:"#161b22", g:"#E8B820", g2:"#F5D78E", g3:"#A67208",
  r:"#FD1803", grn:"#3fb950", red:"#f85149", blue:"#58a6ff",
  txt:"#e6edf3", sub:"rgba(200,220,255,0.6)", mut:"rgba(150,170,210,0.4)",
  bor:"rgba(255,255,255,0.08)", bor2:"rgba(232,184,32,0.4)",
};

function dotColor(m: Merchant) {
  if (m.hasWinner) return T.g;
  if (!m.hasQr)    return T.red;
  return T.grn;
}

export default function MapTab({
  merchants, stats, loading, initialSelected, onClearSelected,
}: {
  merchants: Merchant[];
  stats: MapStats;
  loading: boolean;
  initialSelected: Merchant | null;
  onClearSelected: () => void;
}) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapObj     = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [filter, setFilter]     = useState<Filter>("all");
  const [radius, setRadius]     = useState(5);
  const [sheet, setSheet]       = useState<Merchant | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  /* ── Init Leaflet ── */
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    const L = require("leaflet");
    // CSS already imported at top of file

    const map = L.map(mapRef.current, {
      center: [13.745, 100.561], zoom: 11,
      zoomControl: true, attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom:19 }).addTo(map);
    map.on("click", () => { setSheetOpen(false); });
    mapObj.current = map;

    // Custom zoom control style
    const zoomCtrl = document.querySelector(".leaflet-control-zoom") as HTMLElement;
    if (zoomCtrl) {
      zoomCtrl.style.border = "none";
      Array.from(zoomCtrl.querySelectorAll("a")).forEach((a: any) => {
        a.style.background = "rgba(22,27,34,.9)";
        a.style.color = T.g;
        a.style.borderColor = T.bor;
      });
    }

    return () => { map.remove(); mapObj.current = null; };
  }, []);

  /* ── Place markers when merchants load ── */
  useEffect(() => {
    const map = mapObj.current;
    if (!map || !merchants.length) return;
    const L = require("leaflet");

    // Clear old
    markersRef.current.forEach(mk => mk.remove());
    markersRef.current = [];

    merchants.forEach(m => {
      const col    = dotColor(m);
      const qrText = m.hasQr ? `${m.qrRemaining}` : "หมด";
      const qrBg   = m.hasQr ? "rgba(63,185,80,.85)" : "rgba(248,81,73,.85)";
      const html = `
        <div style="
          background:rgba(22,27,34,.92);border:1px solid ${col}40;
          border-radius:8px;padding:4px 8px;
          font-family:'Kanit',sans-serif;font-size:11px;font-weight:700;color:#fff;
          display:flex;align-items:center;gap:4px;white-space:nowrap;cursor:pointer;
        ">
          <span style="color:${col};font-size:15px">●</span>
          ${m.name.length > 10 ? m.name.slice(0,9)+"…" : m.name}
          <span style="font-size:9px;font-weight:800;padding:1px 5px;border-radius:4px;background:${qrBg};color:#fff">
            ${m.hasWinner ? "🏆" : qrText}
          </span>
        </div>`;
      const icon = L.divIcon({ className:"", html, iconSize:[0,0], iconAnchor:[0,24] });
      const mk   = L.marker([m.lat, m.lng], { icon }).addTo(map);
      mk.on("click", (e: any) => { e.originalEvent.stopPropagation(); openSheet(m, map); });
      markersRef.current.push(mk);
    });

    setVisibleCount(merchants.length);
  }, [merchants]);

  /* ── Handle initial selected (from Report tab) ── */
  useEffect(() => {
    if (!initialSelected || !mapObj.current) return;
    openSheet(initialSelected, mapObj.current);
    onClearSelected();
  }, [initialSelected]);

  /* ── Apply filter ── */
  useEffect(() => {
    if (!mapObj.current || !markersRef.current.length) return;
    const L = require("leaflet");
    let count = 0;
    markersRef.current.forEach((mk, i) => {
      const m = merchants[i];
      if (!m) return;
      const show =
        filter === "all"    ||
        (filter === "hasQr"  && m.hasQr) ||
        (filter === "noQr"   && !m.hasQr) ||
        (filter === "winner" && m.hasWinner);
      if (show) { mk.addTo(mapObj.current); count++; }
      else       { mk.remove(); }
    });
    setVisibleCount(count);
  }, [filter, merchants]);

  function openSheet(m: Merchant, map: any) {
    setSheet(m);
    setSheetOpen(true);
    map.setView([m.lat - 0.007, m.lng], 14, { animate:true });
  }

  function locateMe() {
    navigator.geolocation?.getCurrentPosition(pos => {
      mapObj.current?.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate:true });
    });
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key:"all",    label:"🗺️ ทั้งหมด" },
    { key:"hasQr",  label:"● มี QR" },
    { key:"noQr",   label:"● QR หมด" },
    { key:"winner", label:"🏆 ผู้โชคดี" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", position:"relative" }}>

      {/* Map */}
      <div ref={mapRef} style={{ flex:1 }}/>

      {/* Filter overlay */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:500,
        padding:"8px 10px 6px",
        background:"linear-gradient(to bottom,rgba(13,17,23,.95) 60%,transparent)",
        pointerEvents:"auto",
      }}>
        {/* Status filter */}
        <div style={{ fontSize:9, fontWeight:700, color:T.mut, marginBottom:4, paddingLeft:2 }}>สถานะ QR</div>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" as any }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                flexShrink:0, padding:"5px 12px", borderRadius:20,
                fontSize:12, fontWeight:700, fontFamily:"'Kanit',sans-serif",
                border: `1px solid ${filter===f.key ? "rgba(232,184,32,.5)" : T.bor}`,
                background: filter===f.key ? "rgba(232,184,32,.15)" : "rgba(30,37,48,.85)",
                color: filter===f.key ? T.g : T.sub, cursor:"pointer",
              }}>{f.label}</button>
          ))}
        </div>

        {/* Radius slider */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 2px 0" }}>
          <span style={{ fontSize:11, color:T.sub, flexShrink:0, fontWeight:600 }}>รัศมี</span>
          <input type="range" min={1} max={20} value={radius} onChange={e => setRadius(+e.target.value)}
            style={{ flex:1, accentColor:T.g, height:2 }}/>
          <span style={{ fontSize:11, fontWeight:800, color:T.g, minWidth:36, textAlign:"right" }}>{radius} กม.</span>
        </div>
      </div>

      {/* CTA banner */}
      <div style={{
        position:"absolute", bottom:108, left:12, right:12, zIndex:500,
        background:"rgba(22,27,34,.94)", border:`1px solid ${T.bor}`,
        borderRadius:14, padding:"10px 14px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        backdropFilter:"blur(8px)",
      }}>
        <p style={{ fontSize:12, fontWeight:600, color:T.sub }}>เห็นร้านไหน QR หมด?</p>
        <button style={{
          background:`linear-gradient(135deg,${T.g3},${T.g})`,
          border:"none", borderRadius:10, padding:"7px 14px",
          fontFamily:"'Kanit',sans-serif", fontSize:12, fontWeight:700,
          color:"#3d1f00", cursor:"pointer",
        }}>แจ้งเลย!</button>
      </div>

      {/* Merchant count + locate */}
      <div style={{ position:"absolute", bottom:56, right:12, zIndex:500, display:"flex", gap:8 }}>
        <button onClick={locateMe}
          style={{
            width:38, height:38, borderRadius:12,
            background:"rgba(22,27,34,.9)", border:`1px solid ${T.bor2}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:T.g, fontSize:16,
          }}>📍</button>
        <div style={{
          background:`linear-gradient(135deg,${T.g3},${T.g})`,
          border:"none", borderRadius:20, padding:"8px 14px",
          display:"flex", alignItems:"center", gap:6,
          fontSize:12, fontWeight:700, color:"#3d1f00",
          boxShadow:"0 4px 16px rgba(232,184,32,.35)",
        }}>
          ☰ ดูรายการ ({visibleCount})
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
          background:"rgba(22,27,34,.9)", border:`1px solid ${T.bor}`,
          borderRadius:12, padding:"12px 20px", zIndex:600,
          fontSize:13, fontWeight:700, color:T.sub,
        }}>⏳ กำลังโหลดร้านค้า...</div>
      )}

      {/* Merchant bottom sheet */}
      <AnimatePresence>
        {sheetOpen && sheet && (
          <motion.div
            initial={{ y:"105%" }} animate={{ y:0 }} exit={{ y:"105%" }}
            transition={{ type:"spring", stiffness:320, damping:32 }}
            style={{
              position:"absolute", bottom:0, left:0, right:0, zIndex:600,
              background:T.bg2, border:`1px solid ${T.bor}`,
              borderRadius:"18px 18px 0 0", padding:"10px 16px 28px",
            }}>
            {/* grip */}
            <div style={{ width:32, height:3, borderRadius:2, background:T.bor, margin:"0 auto 12px" }}/>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{
                width:46, height:46, borderRadius:12, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
                background:"rgba(253,24,3,.12)", border:"1px solid rgba(253,24,3,.25)",
              }}>🏪</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800 }}>{sheet.name}</div>
                <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>📍 {sheet.address || "—"}</div>
              </div>
              <button onClick={() => setSheetOpen(false)}
                style={{ background:"none", border:`1px solid ${T.bor}`, borderRadius:8, padding:"4px 10px", cursor:"pointer", color:T.sub, fontSize:11 }}>✕</button>
            </div>

            {/* Badges */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              <span style={{ padding:"3px 9px", borderRadius:8, fontSize:10, fontWeight:700, background: sheet.hasQr ? "rgba(63,185,80,.1)" : "rgba(248,81,73,.1)", border:`1px solid ${sheet.hasQr ? "rgba(63,185,80,.3)" : "rgba(248,81,73,.3)"}`, color: sheet.hasQr ? T.grn : T.red }}>
                {sheet.hasQr ? "🟢 มี QR" : "🔴 QR หมด"}
              </span>
              <span style={{ padding:"3px 9px", borderRadius:8, fontSize:10, fontWeight:700, background:"rgba(232,184,32,.1)", border:`1px solid rgba(232,184,32,.3)`, color:T.g }}>
                🎫 {sheet.qrRemaining} โค้ดเหลือ
              </span>
              {sheet.hasWinner && <span style={{ padding:"3px 9px", borderRadius:8, fontSize:10, fontWeight:700, background:"rgba(88,166,255,.1)", border:`1px solid rgba(88,166,255,.3)`, color:T.blue }}>🏆 มีผู้โชคดี</span>}
              <span style={{ padding:"3px 9px", borderRadius:8, fontSize:10, fontWeight:700, background:"rgba(88,166,255,.1)", border:`1px solid rgba(88,166,255,.3)`, color:T.blue }}>✅ Verified</span>
            </div>

            {/* Stats row */}
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {[
                { l:"QR คงเหลือ", v:sheet.qrRemaining, c:T.g },
                { l:"สแกนวันนี้",  v:sheet.todayScans,  c:T.sub },
                { l:"ใช้ไปแล้ว",  v:sheet.qrUsed,      c:T.mut },
              ].map((s, i) => (
                <div key={i} style={{ flex:1, background:"rgba(255,255,255,.04)", border:`1px solid ${T.bor}`, borderRadius:10, padding:8, textAlign:"center" }}>
                  <div style={{ fontSize:9, color:T.mut, fontWeight:600 }}>{s.l}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:s.c, marginTop:2 }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:8 }}>
              <a href={`/?tab=scan&shop=${sheet.phone}`}
                style={{
                  flex:1, height:42, borderRadius:12,
                  background:"linear-gradient(135deg,#FD1803,#a00000)",
                  color:"#fff", fontFamily:"'Kanit',sans-serif", fontSize:13, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  textDecoration:"none",
                }}>
                📱 สแกน QR รับโค้ด
              </a>
              <a href={`https://maps.google.com/?q=${sheet.lat},${sheet.lng}`} target="_blank" rel="noreferrer"
                style={{
                  width:42, height:42, borderRadius:12,
                  border:`1px solid ${T.bor2}`, background:"rgba(232,184,32,.06)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18, textDecoration:"none",
                }}>🗺️</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
