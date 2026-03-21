"use client";
import { useState, useEffect, useCallback } from "react";

const PHP_API = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PHP_API_URL)
  || "https://xn--72ca9ib1gc.xn--72cac8e8ec.com/hengheng/api";

export type BannerData = {
  id: number;
  position: string;
  type: string;
  title?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  linkUrl?: string | null;
  linkTarget: string;
  bgColor: string;
  textColor: string;
  ctaText?: string | null;
  delayMs: number;
  dismissDays: number;
  priority: number;
};

function track(id: number, event: "impression" | "click") {
  fetch("/api/banners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, event }),
  }).catch(() => {});
}

function isDismissed(id: number, days: number): boolean {
  if (days < 0) return false;
  const key = `banner_dismissed_${id}`;
  const stored = localStorage.getItem(key);
  if (!stored) return false;
  const ts = Number(stored);
  return Date.now() - ts < days * 86400_000;
}

function dismiss(id: number) {
  localStorage.setItem(`banner_dismissed_${id}`, String(Date.now()));
}

/* ─── Announcement (top bar) ─── */
function AnnouncementBanner({ b, onClose }: { b: BannerData; onClose: () => void }) {
  const handleClick = () => {
    track(b.id, "click");
    if (b.linkUrl) window.open(b.linkUrl, b.linkTarget);
  };
  return (
    <div style={{
      background: b.bgColor, color: b.textColor,
      padding: "8px 16px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 12, fontSize: 13, fontWeight: 500,
      cursor: b.linkUrl ? "pointer" : "default",
    }} onClick={handleClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        {b.title && <span style={{ fontWeight: 700 }}>{b.title}</span>}
        {b.body  && <span style={{ opacity: .9 }}>{b.body}</span>}
        {b.ctaText && (
          <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
            {b.ctaText}
          </span>
        )}
      </div>
      <button onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ background: "none", border: "none", color: b.textColor, cursor: "pointer", opacity: .7, padding: 0, fontSize: 16, lineHeight: 1 }}>
        ✕
      </button>
    </div>
  );
}

/* ─── Hero / Image banner ─── */
function ImageBanner({ b, onClose }: { b: BannerData; onClose: () => void }) {
  const handleClick = () => {
    track(b.id, "click");
    if (b.linkUrl) window.open(b.linkUrl, b.linkTarget);
  };
  return (
    <div style={{ position: "relative", width: "100%", cursor: b.linkUrl ? "pointer" : "default" }} onClick={handleClick}>
      {b.imageUrl && (
        <img src={b.imageUrl} alt={b.title || ""} style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
      )}
      {(b.title || b.body) && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
          padding: "16px 14px 10px", color: "#fff",
        }}>
          {b.title && <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{b.title}</p>}
          {b.body  && <p style={{ fontSize: 12, margin: "2px 0 0", opacity: .85 }}>{b.body}</p>}
          {b.ctaText && (
            <span style={{ display: "inline-block", marginTop: 6, background: b.bgColor, color: b.textColor, borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
              {b.ctaText}
            </span>
          )}
        </div>
      )}
      <button onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 24, height: 24, color: "#fff", cursor: "pointer", fontSize: 12 }}>
        ✕
      </button>
    </div>
  );
}

/* ─── Card banner (in-feed) ─── */
function CardBanner({ b, onClose }: { b: BannerData; onClose: () => void }) {
  const handleClick = () => {
    track(b.id, "click");
    if (b.linkUrl) window.open(b.linkUrl, b.linkTarget);
  };
  return (
    <div style={{
      background: b.bgColor, borderRadius: 14, overflow: "hidden",
      cursor: b.linkUrl ? "pointer" : "default", position: "relative",
    }} onClick={handleClick}>
      {b.imageUrl && <img src={b.imageUrl} alt={b.title || ""} style={{ width: "100%", maxHeight: 120, objectFit: "cover", display: "block" }} />}
      <div style={{ padding: "12px 14px", color: b.textColor }}>
        {b.title && <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>{b.title}</p>}
        {b.body  && <p style={{ fontSize: 12, margin: 0, opacity: .85 }}>{b.body}</p>}
        {b.ctaText && (
          <span style={{ display: "inline-block", marginTop: 8, background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
            {b.ctaText} →
          </span>
        )}
      </div>
      <button onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 22, height: 22, color: "#fff", cursor: "pointer", fontSize: 11 }}>
        ✕
      </button>
    </div>
  );
}

/* ─── Sticky bar (bottom) ─── */
function StickyBanner({ b, onClose }: { b: BannerData; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)",
      width: "min(480px, calc(100vw - 24px))", zIndex: 80,
      background: b.bgColor, color: b.textColor, borderRadius: 14,
      padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)", cursor: b.linkUrl ? "pointer" : "default",
    }} onClick={() => { track(b.id, "click"); if (b.linkUrl) window.open(b.linkUrl, b.linkTarget); }}>
      <div style={{ flex: 1 }}>
        {b.title && <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{b.title}</p>}
        {b.body  && <p style={{ fontSize: 11, margin: "2px 0 0", opacity: .85 }}>{b.body}</p>}
      </div>
      {b.ctaText && (
        <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          {b.ctaText}
        </span>
      )}
      <button onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ background: "none", border: "none", color: b.textColor, cursor: "pointer", opacity: .7, fontSize: 16, padding: 0, flexShrink: 0 }}>
        ✕
      </button>
    </div>
  );
}

/* ─── Popup / Interstitial ─── */
function PopupBanner({ b, onClose }: { b: BannerData; onClose: () => void }) {
  const isInterstitial = b.type === "interstitial";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 150,
      background: isInterstitial ? b.bgColor : "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      {isInterstitial ? (
        <div style={{ textAlign: "center", color: b.textColor, maxWidth: 400, padding: 24 }}>
          {b.imageUrl && <img src={b.imageUrl} alt="" style={{ width: "100%", borderRadius: 16, marginBottom: 16 }} />}
          {b.title && <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>{b.title}</p>}
          {b.body  && <p style={{ fontSize: 14, opacity: .85, margin: "0 0 16px" }}>{b.body}</p>}
          {b.ctaText && b.linkUrl && (
            <a href={b.linkUrl} target={b.linkTarget} onClick={() => track(b.id, "click")}
              style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", color: b.textColor, borderRadius: 12, padding: "10px 24px", fontWeight: 700, textDecoration: "none" }}>
              {b.ctaText}
            </a>
          )}
          <button onClick={onClose} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: b.textColor, cursor: "pointer", opacity: .6, fontSize: 14 }}>
            ข้ามไปก่อน ✕
          </button>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", maxWidth: 360, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>
          {b.imageUrl && <img src={b.imageUrl} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />}
          <div style={{ padding: 20 }}>
            {b.title && <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 6px", color: "#0F172A" }}>{b.title}</p>}
            {b.body  && <p style={{ fontSize: 13, margin: "0 0 14px", color: "#64748B" }}>{b.body}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              {b.ctaText && b.linkUrl && (
                <a href={b.linkUrl} target={b.linkTarget} onClick={() => track(b.id, "click")}
                  style={{ flex: 1, background: b.bgColor, color: b.textColor, borderRadius: 10, padding: "9px 0", fontWeight: 700, fontSize: 13, textAlign: "center", textDecoration: "none" }}>
                  {b.ctaText}
                </a>
              )}
              <button onClick={onClose}
                style={{ flex: 1, background: "#F1F5F9", border: "none", borderRadius: 10, padding: "9px 0", fontWeight: 500, fontSize: 13, cursor: "pointer", color: "#64748B" }}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ MAIN BannerSlot ═══ */
export function BannerSlot({ position, className = "" }: { position: string; className?: string }) {
  const [banners, setBanners]   = useState<BannerData[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [idx, setIdx]           = useState(0);

  useEffect(() => {
    fetch(`${PHP_API}/banners.php?position=${position}`)
      .then(r => r.json())
      .then(d => {
        const list: BannerData[] = (d.banners || []).filter((b: BannerData) => !isDismissed(b.id, b.dismissDays));
        if (!list.length) return;
        setBanners(list);
        list.forEach(b => { track(b.id, "impression"); });
      })
      .catch(() => {});
  }, [position]);

  const handleClose = useCallback((id: number) => {
    const b = banners.find(x => x.id === id);
    if (b) dismiss(id);
    setDismissed(prev => new Set([...prev, id]));
  }, [banners]);

  const visible = banners.filter(b => !dismissed.has(b.id));
  if (!visible.length) return null;

  // Carousel for image/card types with multiple banners
  const isCarousel = visible.length > 1 && ["image","card"].includes(visible[0]?.type);
  const cur = visible[Math.min(idx, visible.length - 1)];

  if (!cur) return null;
  const props = { b: cur, onClose: () => handleClose(cur.id) };

  const renderBanner = (b: BannerData, onClose: () => void) => {
    const p = { b, onClose };
    switch (b.type) {
      case "announcement":  return <AnnouncementBanner {...p} />;
      case "image":         return <ImageBanner {...p} />;
      case "card":          return <CardBanner {...p} />;
      case "sticky":        return <StickyBanner {...p} />;
      case "popup":         return <PopupBanner {...p} />;
      case "interstitial":  return <PopupBanner {...p} />;
      default:              return <AnnouncementBanner {...p} />;
    }
  };

  if (cur.type === "sticky" || cur.type === "popup" || cur.type === "interstitial") {
    return renderBanner(cur, () => handleClose(cur.id));
  }

  return (
    <div className={className}>
      {renderBanner(cur, () => handleClose(cur.id))}
      {isCarousel && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
          {visible.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, border: "none", cursor: "pointer", padding: 0,
                background: i === idx ? "#FD1803" : "rgba(255,255,255,0.3)", transition: "all .2s" }}/>
          ))}
        </div>
      )}
    </div>
  );
}
