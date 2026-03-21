"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

/* ── PHP API ── */
const PHP_API = process.env.NEXT_PUBLIC_PHP_API_URL ||
  "https://xn--72ca9ib1gc.xn--72cac8e8ec.com/hengheng/api";

/* ── Types ── */
type Merchant = {
  id: number; name: string; address: string;
  lat: number; lng: number; phone: string;
  qrTotal: number; qrUsed: number; qrRemaining: number;
  hasQr: boolean; todayScans: number; hasWinner: boolean;
};
type MapStats = { total: number; withQr: number; todayScans: number };
type FeedItem = {
  id: number; code: string; customerName: string;
  merchantName: string; merchantId: number;
  isWinner: boolean; timeAgo: string;
};
type StatItem = { total: number; withQr: number; todayScans: number; daysLeft: number };

/* ── Theme ── */
const T = {
  bg:"#0d1117", bg2:"#161b22", bg3:"#1f2937",
  g:"#E8B820", g2:"#F5D78E", g3:"#A67208",
  r:"#FD1803", rd:"#7a0000",
  grn:"#3fb950", red:"#f85149", blue:"#58a6ff",
  txt:"#e6edf3", sub:"rgba(200,220,255,0.6)", mut:"rgba(150,170,210,0.4)",
  bor:"rgba(255,255,255,0.08)", bor2:"rgba(232,184,32,0.4)",
};

/* ── Helpers ── */
function dotColor(m: Merchant) {
  if (m.hasWinner) return T.g;
  if (!m.hasQr) return T.red;
  return T.grn;
}

/* ══════════════════════════════════════════
   MAP TAB (Leaflet — client-only)
══════════════════════════════════════════ */
const MapTab = dynamic(() => import("./MapTab"), { ssr: false, loading: () => (
  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:T.mut}}>
    <div style={{fontSize:32}}>🗺️</div>
    <p style={{fontSize:13,fontWeight:700}}>กำลังโหลดแผนที่...</p>
  </div>
)});

/* ══════════════════════════════════════════
   FEED TAB
══════════════════════════════════════════ */
function FeedTab({ feed, loading }: { feed: FeedItem[]; loading: boolean }) {
  return (
    <div style={{ paddingBottom: 80, paddingTop: 8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px 8px" }}>
        <span style={{ fontSize:12, fontWeight:700, color:T.sub }}>กิจกรรมล่าสุด</span>
        <div style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(248,81,73,.1)", border:"1px solid rgba(248,81,73,.25)", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:T.red }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:T.red, display:"inline-block", animation:"blink 1s infinite" }}/>
          LIVE
        </div>
      </div>

      {loading && <p style={{ textAlign:"center", color:T.mut, fontSize:13, padding:"20px 0" }}>กำลังโหลด...</p>}

      <AnimatePresence>
        {feed.map((f, i) => (
          <motion.div key={f.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.03 }}
            style={{
              margin:"0 12px 8px", borderRadius:13, padding:"11px 13px",
              display:"flex", alignItems:"center", gap:10,
              background: f.isWinner ? "rgba(232,184,32,0.04)" : T.bg2,
              border: `1px solid ${f.isWinner ? "rgba(232,184,32,.45)" : T.bor}`,
            }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
              {f.isWinner ? "🏆" : "🎫"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.customerName}</div>
              <div style={{ fontSize:11, color:T.sub, marginTop:1 }}>📍 {f.merchantName}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:12, fontWeight:800, color:T.g, letterSpacing:".08em", fontFamily:"monospace" }}>{f.code}</div>
              <div style={{ fontSize:10, color: f.isWinner ? T.g : T.mut, marginTop:2, fontWeight: f.isWinner ? 700 : 400 }}>
                {f.isWinner ? "🏆 ได้รางวัล!" : f.timeAgo}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════
   REPORT / NEARBY TAB
══════════════════════════════════════════ */
function ReportTab({ merchants, onSelect }: { merchants: Merchant[]; onSelect: (m: Merchant) => void }) {
  const sorted = [...merchants].sort((a,b) => {
    if (a.hasQr && !b.hasQr) return -1;
    if (!a.hasQr && b.hasQr) return 1;
    return b.todayScans - a.todayScans;
  });

  return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ padding:"12px 14px 6px" }}>
        <p style={{ fontSize:12, color:T.sub, fontWeight:600 }}>ร้านค้าพาร์ทเนอร์ทั้งหมด — เรียงตาม QR คงเหลือ</p>
      </div>

      {sorted.map(m => (
        <div key={m.id} onClick={() => onSelect(m)}
          style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"12px 14px", borderBottom:`1px solid ${T.bor}`, cursor:"pointer",
          }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:dotColor(m), flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>{m.name}</div>
            <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>{m.address || "—"}</div>
            <div style={{ display:"flex", gap:4, marginTop:4 }}>
              <span style={{
                fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:4,
                background: m.hasQr ? "rgba(63,185,80,.15)" : "rgba(248,81,73,.12)",
                color: m.hasQr ? T.grn : T.red,
              }}>QR {m.hasQr ? `${m.qrRemaining} คงเหลือ` : "หมดแล้ว"}</span>
              {m.hasWinner && <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:4, background:"rgba(232,184,32,.15)", color:T.g }}>🏆 ผู้โชคดี</span>}
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.g }}>{m.todayScans}</div>
            <div style={{ fontSize:9, color:T.mut }}>สแกนวันนี้</div>
          </div>
          <span style={{ color:T.mut, fontSize:14 }}>›</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   GALLERY TAB
══════════════════════════════════════════ */
function GalleryTab({ merchants }: { merchants: Merchant[] }) {
  const [filter, setFilter] = useState<"all"|"hasQr"|"noQr"|"winner">("all");
  const chips: {key: typeof filter; label: string}[] = [
    {key:"all", label:"ทั้งหมด"}, {key:"hasQr", label:"มี QR"},
    {key:"noQr", label:"QR หมด"}, {key:"winner", label:"🏆 ผู้โชคดี"},
  ];
  const filtered = merchants.filter(m => {
    if (filter === "hasQr")  return m.hasQr;
    if (filter === "noQr")   return !m.hasQr;
    if (filter === "winner") return m.hasWinner;
    return true;
  });
  const emojis = ["🍗","🍜","🌶️","🦐","🍚","🍲","🥗","🥩","🍝","🐟","🫕","🍛"];

  return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ padding:"12px 14px 6px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:18, fontWeight:900 }}>คลัง<span style={{color:T.g}}>ภาพ</span></div>
        <div style={{ fontSize:12, fontWeight:700, color:T.sub, background:"rgba(255,255,255,.06)", border:`1px solid ${T.bor}`, borderRadius:20, padding:"3px 10px" }}>
          {filtered.length} ร้าน
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", padding:"0 14px 10px", scrollbarWidth:"none" }}>
        {chips.map(c => (
          <button key={c.key} onClick={() => setFilter(c.key)}
            style={{
              flexShrink:0, padding:"5px 12px", borderRadius:20,
              fontSize:11, fontWeight:700, fontFamily:"'Kanit',sans-serif",
              border: `1px solid ${filter===c.key ? "rgba(232,184,32,.4)" : T.bor}`,
              background: filter===c.key ? "rgba(232,184,32,.08)" : "rgba(255,255,255,.04)",
              color: filter===c.key ? T.g : T.sub, cursor:"pointer",
            }}>{c.label}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2, padding:"0 2px" }}>
        {filtered.map((m, i) => (
          <div key={m.id} style={{ position:"relative", aspectRatio:"3/4", borderRadius:6, overflow:"hidden", background:T.bg2, cursor:"pointer" }}>
            <div style={{
              width:"100%", height:"100%", display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:36,
              background:`linear-gradient(135deg,${T.bg3},${T.bg2})`,
            }}>{emojis[i % emojis.length]}</div>
            {/* overlay */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,.75) 40%,transparent 70%)" }}/>
            {/* status badge top-left */}
            <div style={{ position:"absolute", top:6, left:6, display:"flex", flexDirection:"column", gap:3 }}>
              <span style={{
                fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:5,
                display:"flex", alignItems:"center", gap:3,
                background: m.hasQr ? "rgba(63,185,80,.85)" : "rgba(248,81,73,.85)",
                color:"#fff",
              }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor" }}/>
                {m.hasQr ? "มี QR" : "QR หมด"}
              </span>
              {m.hasWinner && <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:5, background:"rgba(232,184,32,.85)", color:"#3d1f00" }}>🏆 ผู้โชคดี</span>}
            </div>
            {/* bottom info */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:6 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.name}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.6)", marginTop:1 }}>{m.todayScans} สแกนวันนี้</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STATS TAB
══════════════════════════════════════════ */
const CHART_LABELS = ["จ","อ","พ","พฤ","ศ","ส","อา"];
function StatsTab({ merchants, stats }: { merchants: Merchant[]; stats: StatItem }) {
  const chartData = CHART_LABELS.map((l, i) => ({
    l, v: Math.round(stats.todayScans * (0.4 + Math.random() * 0.8))
  }));
  const mx = Math.max(...chartData.map(d => d.v), 1);
  const top = [...merchants].sort((a,b) => b.todayScans - a.todayScans).slice(0, 5);

  const statCards = [
    { ico:"🏪", v: stats.total, l:"ร้านพาร์ทเนอร์" },
    { ico:"🎫", v: `${(merchants.reduce((s,m)=>s+m.qrTotal,0)).toLocaleString()}`, l:"QR ทั้งหมด" },
    { ico:"📅", v: stats.todayScans.toLocaleString(), l:"สแกนวันนี้" },
    { ico:"🟢", v: stats.withQr, l:"ร้านมี QR" },
  ];

  return (
    <div style={{ padding:"14px 14px 80px" }}>
      <div style={{ fontSize:18, fontWeight:900, marginBottom:14 }}>
        ข้อมูล<span style={{color:T.g}}>สถิติ</span>
      </div>

      {/* Stat grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {statCards.map((s,i) => (
          <div key={i} style={{ background:T.bg2, border:`1px solid ${T.bor}`, borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{s.ico}</div>
            <div style={{ fontSize:24, fontWeight:900, color:T.g }}>{s.v}</div>
            <div style={{ fontSize:11, color:T.sub, marginTop:3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background:T.bg2, border:`1px solid ${T.bor}`, borderRadius:14, padding:14, marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.sub, marginBottom:14 }}>📈 การสแกน 7 วันล่าสุด</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
          {chartData.map((d, i) => {
            const h = Math.max(Math.round((d.v/mx)*70), 4);
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                <div style={{ fontSize:9, fontWeight:700, color:T.g }}>{d.v > 999 ? (d.v/1000).toFixed(1)+"k" : d.v}</div>
                <div style={{ width:"100%", height:h, borderRadius:"3px 3px 0 0", background:`linear-gradient(180deg,${T.g},${T.g3})` }}/>
                <div style={{ fontSize:9, color:T.mut }}>{d.l}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top merchants */}
      <div style={{ background:T.bg2, border:`1px solid ${T.bor}`, borderRadius:14, padding:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.sub, marginBottom:12 }}>🥇 ร้านยอดนิยมวันนี้</div>
        {top.map((m, i) => (
          <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom: i < top.length-1 ? `1px solid ${T.bor}` : "none" }}>
            <span style={{ fontSize:11, fontWeight:700, color:T.mut, width:16 }}>{i+1}</span>
            <div style={{ width:10, height:10, borderRadius:"50%", background:dotColor(m) }}/>
            <span style={{ fontSize:12, fontWeight:600, flex:1 }}>{m.name}</span>
            <span style={{ fontSize:12, fontWeight:700, color:T.g }}>{m.todayScans} สแกน</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
type TabKey = "map" | "feed" | "report" | "gallery" | "stats";

export default function MapPage() {
  const [tab, setTab] = useState<TabKey>("map");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [mapStats, setMapStats] = useState<MapStats>({ total:0, withQr:0, todayScans:0 });
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  /* Fetch merchants */
  useEffect(() => {
    fetch(`${PHP_API}/merchants.php`)
      .then(r => r.json())
      .then(d => {
        if (d.merchants) setMerchants(d.merchants);
        if (d.stats)     setMapStats(d.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Fetch feed */
  const loadFeed = useCallback(async () => {
    if (feedLoading) return;
    setFeedLoading(true);
    try {
      const r = await fetch(`${PHP_API}/feed.php?limit=30`);
      const d = await r.json();
      if (d.feed) setFeed(d.feed);
    } catch {}
    setFeedLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "feed") loadFeed();
    const interval = setInterval(() => { if (tab === "feed") loadFeed(); }, 15000);
    return () => clearInterval(interval);
  }, [tab]);

  /* Select merchant from report → switch to map */
  const handleSelectMerchant = (m: Merchant) => {
    setSelectedMerchant(m);
    setTab("map");
  };

  const NAV: { key: TabKey; label: string; icon: string }[] = [
    { key:"map",     label:"แผนที่",   icon:"🗺️" },
    { key:"feed",    label:"ฟีด",      icon:"📋" },
    { key:"report",  label:"ร้านค้า",  icon:"🎯" },
    { key:"gallery", label:"คลังภาพ",  icon:"🖼️" },
    { key:"stats",   label:"ข้อมูล",   icon:"📊" },
  ];

  const statItem: StatItem = {
    total:      mapStats.total,
    withQr:     mapStats.withQr,
    todayScans: mapStats.todayScans,
    daysLeft:   12,
  };

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100dvh",
      maxWidth:480, margin:"0 auto", position:"relative",
      background:T.bg, color:T.txt, fontFamily:"'Kanit',sans-serif",
      overflow:"hidden",
    }}>

      {/* ── Header ── */}
      <div style={{
        flexShrink:0, zIndex:100,
        background:T.bg2, borderBottom:`1px solid ${T.bor}`,
        padding:"10px 14px", display:"flex", alignItems:"center", gap:10,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
          <div style={{
            width:34, height:34, borderRadius:9,
            background:"linear-gradient(135deg,#c00,#7a0000)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:900, color:"#fff",
            boxShadow:"0 0 12px rgba(253,24,3,.35)",
          }}>ป</div>
          <div>
            <div style={{ fontSize:15, fontWeight:800 }}>
              เฮงเฮง<span style={{color:T.g}}>Lucky</span>
            </div>
            <div style={{ fontSize:9, color:T.mut, fontWeight:500 }}>แผนที่ร้านค้าพาร์ทเนอร์</div>
          </div>
        </div>
        {/* live stat */}
        <div style={{
          background:"rgba(232,184,32,.1)", border:`1px solid rgba(232,184,32,.3)`,
          borderRadius:20, padding:"4px 10px",
          display:"flex", alignItems:"center", gap:4,
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:T.grn, animation:"blink 2s infinite", display:"inline-block" }}/>
          <span style={{ fontSize:11, fontWeight:700, color:T.g }}>
            {loading ? "..." : `${mapStats.total} ร้าน`}
          </span>
        </div>
        <a href="/" style={{
          width:34, height:34, borderRadius:9, border:`1px solid ${T.bor}`,
          background:"rgba(255,255,255,.04)", display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:16, color:T.sub, textDecoration:"none",
        }}>←</a>
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.15}}
            style={{ position:"absolute", inset:0, overflowY: tab==="map" ? "hidden" : "auto" }}>

            {tab === "map" && (
              <MapTab
                merchants={merchants}
                stats={mapStats}
                loading={loading}
                initialSelected={selectedMerchant}
                onClearSelected={() => setSelectedMerchant(null)}
              />
            )}
            {tab === "feed"    && <FeedTab feed={feed} loading={feedLoading}/>}
            {tab === "report"  && <ReportTab merchants={merchants} onSelect={handleSelectMerchant}/>}
            {tab === "gallery" && <GalleryTab merchants={merchants}/>}
            {tab === "stats"   && <StatsTab merchants={merchants} stats={statItem}/>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom Nav ── */}
      <div style={{
        flexShrink:0, background:"rgba(13,17,23,.97)",
        borderTop:`1px solid ${T.bor}`,
        display:"flex",
        paddingBottom:"max(6px,env(safe-area-inset-bottom))",
        zIndex:200,
      }}>
        {NAV.map((n, i) => {
          const isCenter = i === 2; // report = center
          const active = tab === n.key;
          if (isCenter) return (
            <div key={n.key} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", position:"relative", top:-8 }}>
              <button onClick={() => setTab(n.key)}
                style={{
                  width:52, height:52, borderRadius:"50%", border:"none", cursor:"pointer",
                  background:`linear-gradient(135deg,${T.g3},${T.g},#F5D78E)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:22, boxShadow:"0 4px 20px rgba(232,184,32,.5)",
                  animation:"glow-btn 2s ease-in-out infinite",
                }}>🎯</button>
              <span style={{ fontSize:9, fontWeight:700, marginTop:2, color: active ? T.g : T.mut }}>{n.label}</span>
            </div>
          );
          return (
            <button key={n.key} onClick={() => setTab(n.key)}
              style={{
                flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                padding:"7px 4px 3px", background:"none", border:"none", cursor:"pointer",
                fontFamily:"'Kanit',sans-serif", fontSize:9, fontWeight:700,
                color: active ? T.g : T.mut, gap:2, position:"relative",
              }}>
              {active && <div style={{ position:"absolute", top:0, left:"25%", right:"25%", height:2, background:T.g, borderRadius:"0 0 2px 2px" }}/>}
              <span style={{ fontSize:20 }}>{n.icon}</span>
              {n.label}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes glow-btn{0%,100%{box-shadow:0 4px 16px rgba(232,184,32,.4)}50%{box-shadow:0 4px 28px rgba(232,184,32,.75)}}
      `}</style>
    </div>
  );
}
