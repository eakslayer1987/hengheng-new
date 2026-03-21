"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Plus, Pencil, Trash2, Loader2,
  ChevronLeft, ChevronRight, Save, Eye, EyeOff,
  ToggleLeft, ToggleRight,
} from "lucide-react";

/* ── Theme ── */
const C = {
  bg: "#F1F5F9", card: "#FFFFFF", cardAlt: "#F8FAFC",
  border: "rgba(0,0,0,0.08)", borderMid: "rgba(0,0,0,0.12)",
  text: "#0F172A", sub: "#475569", muted: "#94A3B8",
  red: "#E53E3E", redLight: "#FFF5F5", redBorder: "rgba(229,62,62,0.2)",
  green: "#16A34A", greenLight: "#F0FDF4", greenBorder: "rgba(22,163,74,0.2)",
  gold: "#B45309", goldLight: "#FFFBEB", goldBorder: "rgba(180,83,9,0.2)",
  blue: "#1D4ED8", blueLight: "#EFF6FF", blueBorder: "rgba(29,78,216,0.15)",
};

/* ── Constants ── */
const POSITIONS = [
  { value: "user_topbar",    label: "👤 User — Top bar" },
  { value: "user_hero",      label: "👤 User — Hero" },
  { value: "user_infeed",    label: "👤 User — In-feed" },
  { value: "user_popup",     label: "👤 User — Popup" },
  { value: "user_sticky",    label: "👤 User — Sticky" },
  { value: "merchant_hero",  label: "🏪 Merchant — Hero" },
  { value: "merchant_card",  label: "🏪 Merchant — Card" },
  { value: "merchant_popup", label: "🏪 Merchant — Popup" },
  { value: "admin_alert",    label: "⚙️ Admin — Alert" },
];

const BTYPES = [
  { value: "announcement", label: "Announcement (แถบบน)" },
  { value: "image",        label: "Image Banner" },
  { value: "card",         label: "Card (In-feed)" },
  { value: "sticky",       label: "Sticky Bar" },
  { value: "popup",        label: "Popup" },
  { value: "interstitial", label: "Interstitial (เต็มจอ)" },
];

const EMPTY_FORM = {
  position: "user_hero", type: "announcement",
  title: "", body: "", imageUrl: "", linkUrl: "",
  linkTarget: "_blank", ctaText: "",
  bgColor: "#FD1803", textColor: "#FFFFFF",
  targetAudience: "all", showMobile: true, showDesktop: true,
  startsAt: "", endsAt: "",
  priority: "0", delayMs: "0", dismissDays: "1", isActive: false,
};

/* ── Shared UI ── */
function Badge({ children, color = C.blue, bg }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: bg || `${color}15`, color, border: `1px solid ${color}30`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1rem 1.25rem", ...style }}>{children}</div>;
}
function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: C.muted, margin: "3px 0 0" }}>{sub}</p>}
      </div>
      {children && <div style={{ display: "flex", gap: 8 }}>{children}</div>}
    </div>
  );
}
function Btn({ children, onClick, variant = "primary", disabled = false, size = "md" }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean; size?: "sm" | "md";
}) {
  const s = {
    primary:   { background: C.blue,        color: "#fff",    border: `1px solid ${C.blue}` },
    secondary: { background: C.card,        color: C.sub,     border: `1px solid ${C.border}` },
    danger:    { background: C.redLight,     color: C.red,     border: `1px solid ${C.redBorder}` },
    ghost:     { background: "transparent", color: C.muted,   border: `1px solid ${C.border}` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...s[variant], borderRadius: 8, padding: size === "sm" ? "4px 12px" : "7px 16px", fontSize: 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", transition: "opacity .15s" }}>
      {children}
    </button>
  );
}
function InputField({ label, value, onChange, type = "text", placeholder = "", required = false, note = "" }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; note?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: C.sub, display: "block", marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
        style={{ width: "100%", boxSizing: "border-box", height: 36, padding: "0 10px", border: `1px solid ${C.borderMid}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.card, outline: "none" }} />
      {note && <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0" }}>{note}</p>}
    </div>
  );
}
function ToggleSwitch({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: C.text, margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>{sub}</p>}
      </div>
      <button onClick={() => onChange(!value)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        {value ? <ToggleRight size={28} style={{ color: C.blue }} /> : <ToggleLeft size={28} style={{ color: C.muted }} />}
      </button>
    </div>
  );
}

/* ── Select helper ── */
function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: C.sub, display: "block", marginBottom: 5 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", height: 36, padding: "0 8px", border: `1px solid ${C.borderMid}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.card, outline: "none" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ══════════════════════════════════════
   BANNERS TAB
══════════════════════════════════════ */
export function BannersTab({ toast }: { toast: (m: string, ok?: boolean) => void }) {
  const [banners,    setBanners]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [posFilter,  setPosFilter]  = useState("all");
  const [editing,    setEditing]    = useState<any | null>(null);
  const [form,       setForm]       = useState<any>({ ...EMPTY_FORM });
  const [saving,     setSaving]     = useState(false);
  const [showForm,   setShowForm]   = useState(false);

  const sf = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = async (p = 1) => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(p), ...(posFilter !== "all" && { position: posFilter }) });
    const r = await fetch(`/api/admin/banners?${q}`);
    const d = await r.json();
    if (r.ok) { setBanners(d.banners); setTotal(d.total); setPages(d.pages); setPage(p); }
    setLoading(false);
  };

  useEffect(() => { load(1); }, [posFilter]);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      position: b.position, type: b.type,
      title: b.title || "", body: b.body || "",
      imageUrl: b.imageUrl || "", linkUrl: b.linkUrl || "",
      linkTarget: b.linkTarget, ctaText: b.ctaText || "",
      bgColor: b.bgColor, textColor: b.textColor,
      targetAudience: b.targetAudience,
      showMobile: b.showMobile, showDesktop: b.showDesktop,
      startsAt: b.startsAt ? b.startsAt.slice(0, 16) : "",
      endsAt: b.endsAt ? b.endsAt.slice(0, 16) : "",
      priority: String(b.priority), delayMs: String(b.delayMs),
      dismissDays: String(b.dismissDays), isActive: b.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      ...form,
      priority: Number(form.priority),
      delayMs: Number(form.delayMs),
      dismissDays: Number(form.dismissDays),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    };
    const r = await fetch(editing ? `/api/admin/banners?id=${editing.id}` : "/api/admin/banners", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (r.ok) { toast(editing ? "✅ อัปเดตแล้ว" : "✅ สร้างแล้ว"); setShowForm(false); load(page); }
    else toast(d.error || "เกิดข้อผิดพลาด", false);
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบ banner นี้?")) return;
    const r = await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
    if (r.ok) { toast("✅ ลบแล้ว"); load(page); }
  };

  const toggleActive = async (b: any) => {
    await fetch(`/api/admin/banners?id=${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    load(page);
  };

  const posLabel = (v: string) => POSITIONS.find(p => p.value === v)?.label || v;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>

      <PageHeader title="แบนเนอร์" sub={`${total} รายการ — จัดการทุก position บนหน้าแอป`}>
        <Btn variant="secondary" onClick={() => load(page)}><RefreshCw size={13} /> รีเฟรช</Btn>
        <Btn onClick={openNew}><Plus size={13} /> สร้าง Banner</Btn>
      </PageHeader>

      {/* Filter */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setPosFilter("all")}
          style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: `1px solid ${posFilter === "all" ? C.blue : C.border}`, background: posFilter === "all" ? C.blueLight : C.card, color: posFilter === "all" ? C.blue : C.sub }}>
          ทั้งหมด
        </button>
        {POSITIONS.map(pos => (
          <button key={pos.value} onClick={() => setPosFilter(pos.value)}
            style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: `1px solid ${posFilter === pos.value ? C.blue : C.border}`, background: posFilter === pos.value ? C.blueLight : C.card, color: posFilter === pos.value ? C.blue : C.sub }}>
            {pos.label.split("—")[1]?.trim() || pos.value}
          </button>
        ))}
      </div>

      {/* List */}
      {loading
        ? <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: C.muted }} /></div>
        : banners.length === 0
          ? <Card><p style={{ textAlign: "center", color: C.muted, padding: 20 }}>ยังไม่มี banner</p></Card>
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {banners.map(b => (
                <Card key={b.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Color swatch */}
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: b.bgColor, flexShrink: 0, border: `1px solid ${C.border}` }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{b.title || "(ไม่มีชื่อ)"}</span>
                        <Badge color={b.isActive ? C.green : C.muted}>{b.isActive ? "Active" : "Inactive"}</Badge>
                        <Badge color={C.blue}>{posLabel(b.position)}</Badge>
                        <Badge color={C.gold}>{b.type}</Badge>
                      </div>
                      {b.body && <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.body}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <Btn variant="ghost" size="sm" onClick={() => toggleActive(b)}>
                        {b.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                      </Btn>
                      <Btn variant="secondary" size="sm" onClick={() => openEdit(b)}><Pencil size={13} /></Btn>
                      <Btn variant="danger" size="sm" onClick={() => handleDelete(b.id)}><Trash2 size={13} /></Btn>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
      }

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <Btn variant="secondary" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}><ChevronLeft size={14} /></Btn>
          <span style={{ fontSize: 13, color: C.sub }}>หน้า {page}/{pages}</span>
          <Btn variant="secondary" size="sm" disabled={page >= pages} onClick={() => load(page + 1)}><ChevronRight size={14} /></Btn>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              style={{ background: C.card, borderRadius: 16, padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{editing ? "แก้ไข Banner" : "สร้าง Banner ใหม่"}</h2>
                <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Sel label="Position *" value={form.position} onChange={v => sf("position", v)} options={POSITIONS} />
                  <Sel label="ประเภท *" value={form.type} onChange={v => sf("type", v)} options={BTYPES} />
                </div>
                <InputField label="หัวข้อ" value={form.title} onChange={v => sf("title", v)} placeholder="ข้อความหัวข้อ" />
                <InputField label="คำอธิบาย" value={form.body} onChange={v => sf("body", v)} placeholder="ข้อความเพิ่มเติม" />
                <InputField label="URL รูปภาพ" value={form.imageUrl} onChange={v => sf("imageUrl", v)} placeholder="https://..." />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <InputField label="สี Background" value={form.bgColor} onChange={v => sf("bgColor", v)} type="color" />
                  <InputField label="สีตัวอักษร" value={form.textColor} onChange={v => sf("textColor", v)} type="color" />
                </div>
                <InputField label="Link URL" value={form.linkUrl} onChange={v => sf("linkUrl", v)} placeholder="https://..." />
                <InputField label="ข้อความปุ่ม (CTA)" value={form.ctaText} onChange={v => sf("ctaText", v)} placeholder="คลิกดูเพิ่มเติม" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <InputField label="เริ่ม" value={form.startsAt} onChange={v => sf("startsAt", v)} type="datetime-local" />
                  <InputField label="สิ้นสุด" value={form.endsAt} onChange={v => sf("endsAt", v)} type="datetime-local" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <InputField label="Priority" value={form.priority} onChange={v => sf("priority", v)} type="number" />
                  <InputField label="Delay (ms)" value={form.delayMs} onChange={v => sf("delayMs", v)} type="number" />
                  <InputField label="Dismiss (วัน)" value={form.dismissDays} onChange={v => sf("dismissDays", v)} type="number" />
                </div>
                <ToggleSwitch value={form.isActive} onChange={v => sf("isActive", v)} label="เปิดใช้งาน" sub="แสดง banner บนหน้าแอป" />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
                <Btn variant="secondary" onClick={() => setShowForm(false)}>ยกเลิก</Btn>
                <Btn onClick={handleSave} disabled={saving}>
                  {saving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> บันทึก...</> : <><Save size={14} /> บันทึก</>}
                </Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </motion.div>
  );
}

export default BannersTab;
