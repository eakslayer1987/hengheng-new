"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Merchant = {
  id: number; name: string; address: string;
  lat: number; lng: number; phone: string;
  status: string; isActive: boolean;
  qrTotal: number; qrUsed: number; qrRemaining: number;
  todayScans: number; winners: number;
};

const T = {
  bg2:"#161b22", g:"#E8B820", g3:"#A67208",
  grn:"#3fb950", red:"#f85149", blue:"#58a6ff",
  sub:"rgba(200,220,255,0.6)", mut:"rgba(150,170,210,0.4)",
  bor:"rgba(255,255,255,0.08)", bor2:"rgba(232,184,32,0.4)",
};

function dotColor(m: Merchant) {
  if (m.status !== "approved") return "#888";
  if (m.winners > 0)           return T.g;
  if (m.qrRemaining <= 0)      return T.red;
  return T.grn;
}

export default function AdminMapLeaflet({
  merchants, onSelect,
}: {
  merchants: Merchant[];
  onSelect: (m: Merchant) => void;
}) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapObj     = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;
    const L = require("leaflet");

    const map = L.map(mapRef.current, {
      center: [13.745, 100.561], zoom: 11,
      zoomControl: true, attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom:19 }).addTo(map);
    mapObj.current = map;
    return () => { map.remove(); mapObj.current = null; };
  }, []);

  useEffect(() => {
    const map = mapObj.current;
    if (!map || !merchants.length) return;
    const L = require("leaflet");

    markersRef.current.forEach(mk => mk.remove());
    markersRef.current = [];

    merchants.forEach(m => {
      const col = dotColor(m);
      const statusLabel = m.status === "approved" ? "✅ อนุมัติ" : m.status === "pending" ? "⏳ รอ" : "❌ ปฏิเสธ";

      const html = `
        <div style="
          background:rgba(22,27,34,.95);border:1.5px solid ${col};
          border-radius:8px;padding:4px 8px;
          font-family:'Kanit',sans-serif;font-size:11px;font-weight:700;color:#fff;
          display:flex;align-items:center;gap:5px;white-space:nowrap;cursor:pointer;
          box-shadow:0 2px 8px rgba(0,0,0,.4);
        ">
          <span style="width:7px;height:7px;border-radius:50%;background:${col};flex-shrink:0"></span>
          ${m.name.length > 9 ? m.name.slice(0,8)+"…" : m.name}
          <span style="
            font-size:8px;padding:1px 4px;border-radius:3px;
            background:${m.qrRemaining>0?"rgba(63,185,80,.8)":"rgba(248,81,73,.8)"};
            color:#fff;font-weight:800;
          ">${m.qrRemaining>0?m.qrRemaining:"หมด"}</span>
          ${m.winners>0?'<span style="font-size:9px">🏆</span>':''}
        </div>`;

      const icon = L.divIcon({ className:"", html, iconSize:[0,0], iconAnchor:[0,26] });
      const mk   = L.marker([m.lat, m.lng], { icon }).addTo(map);

      mk.bindPopup(`
        <div style="font-family:'Kanit',sans-serif;min-width:180px">
          <p style="font-size:14px;font-weight:800;margin:0 0 4px;color:#fff">${m.name}</p>
          <p style="font-size:11px;color:${T.sub};margin:0 0 8px">📍 ${m.address || "—"}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            <span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:5px;
              background:${m.status==="approved"?"rgba(63,185,80,.15)":"rgba(248,81,73,.12)"};
              color:${m.status==="approved"?T.grn:T.red}">${statusLabel}</span>
            <span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:5px;
              background:rgba(232,184,32,.1);color:${T.g}">🎫 QR ${m.qrRemaining}</span>
            ${m.winners>0?`<span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:5px;background:rgba(232,184,32,.1);color:${T.g}">🏆 ${m.winners} รางวัล</span>`:""}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
            <div style="background:rgba(255,255,255,.05);border-radius:7px;padding:6px;text-align:center">
              <div style="font-size:16px;font-weight:900;color:${T.g}">${m.qrRemaining}</div>
              <div style="font-size:9px;color:${T.mut}">QR เหลือ</div>
            </div>
            <div style="background:rgba(255,255,255,.05);border-radius:7px;padding:6px;text-align:center">
              <div style="font-size:16px;font-weight:900;color:${T.blue}">${m.todayScans}</div>
              <div style="font-size:9px;color:${T.mut}">สแกนวันนี้</div>
            </div>
          </div>
          <button onclick="window.__adminSelectMerchant(${m.id})" style="
            width:100%;padding:8px 0;border-radius:9px;border:none;cursor:pointer;
            background:linear-gradient(135deg,${T.g3},${T.g});
            font-family:'Kanit',sans-serif;font-size:12px;font-weight:700;color:#3d1f00;
          ">⚙️ จัดการร้านนี้</button>
        </div>
      `, {
        className:"admin-popup",
        maxWidth:220,
      });

      mk.on("click", () => {});
      markersRef.current.push(mk);
    });

    // Global handler for popup button
    (window as any).__adminSelectMerchant = (id: number) => {
      const m = merchants.find(x => x.id === id);
      if (m) { onSelect(m); map.closePopup(); }
    };

    // Leaflet popup styles
    const style = document.getElementById("admin-popup-style") || document.createElement("style");
    style.id = "admin-popup-style";
    style.textContent = `
      .admin-popup .leaflet-popup-content-wrapper {
        background:rgba(22,27,34,.97)!important;
        border:1px solid rgba(232,184,32,.4)!important;
        border-radius:12px!important;
        box-shadow:0 8px 32px rgba(0,0,0,.6)!important;
      }
      .admin-popup .leaflet-popup-tip { background:rgba(22,27,34,.97)!important; }
      .admin-popup .leaflet-popup-content { margin:12px 14px!important; color:#fff!important; }
      .leaflet-control-zoom a { background:rgba(22,27,34,.9)!important; color:${T.g}!important; border-color:${T.bor}!important; }
    `;
    document.head.appendChild(style);
  }, [merchants, onSelect]);

  return (
    <div ref={mapRef} style={{ flex:1, width:"100%", height:"100%" }}/>
  );
}
