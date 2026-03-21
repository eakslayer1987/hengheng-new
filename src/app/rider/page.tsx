"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Phone, Package, Navigation, CheckCircle, LogOut,
  Loader2, Truck, Clock, AlertCircle, UtensilsCrossed, User,
  ChevronRight, Zap, History, DollarSign, Camera, Settings,
  ChevronLeft, ChevronDown, TrendingUp, Calendar, X
} from "lucide-react";

type Item = { id: number; qty: number; price: number; menuItem: { name: string } };
type Order = {
  id: number; orderNo: string; custName: string; custPhone: string;
  custAddress: string; total: number; status: string; createdAt: string;
  pickedUpAt: string | null; deliveredAt: string | null; items: Item[];
};
type Rider = { id: number; name: string; phone: string; photo?: string | null };
type EarnPeriod = { trips: number; sales: number; commission: number };
type Earnings = { today: EarnPeriod; week: EarnPeriod; month: EarnPeriod; all: EarnPeriod };

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const scaleIn = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

export default function RiderPage() {
  const [rider, setRider] = useState<Rider | null>(null);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [available, setAvailable] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"available" | "my" | "history" | "profile">("available");
  const [gpsOn, setGpsOn] = useState(false);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const gpsRef = useRef<number | null>(null);

  // History & Earnings
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [commPercent, setCommPercent] = useState(10);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [earnPeriod, setEarnPeriod] = useState<"today" | "week" | "month">("today");

  // Profile
  const [showProfile, setShowProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const s = typeof window !== "undefined" ? localStorage.getItem("tp_rider") : null;
    if (s) try { setRider(JSON.parse(s)); } catch {}
  }, []);

  useEffect(() => {
    if (rider) { fetchOrders(); const i = setInterval(fetchOrders, 8000); return () => clearInterval(i); }
  }, [rider]);

  useEffect(() => {
    if (rider && tab === "history") fetchHistory(1);
  }, [rider, tab]);

  useEffect(() => {
    if (rider && !gpsRef.current) {
      if (navigator.geolocation) {
        gpsRef.current = navigator.geolocation.watchPosition(
          p => { setGpsOn(true); api({ action: "update-location", riderId: rider.id, lat: p.coords.latitude, lng: p.coords.longitude }); },
          () => setGpsOn(false), { enableHighAccuracy: true, maximumAge: 5000 }
        );
      }
    }
    return () => { if (gpsRef.current) navigator.geolocation.clearWatch(gpsRef.current); };
  }, [rider]);

  const api = async (body: any) => {
    const res = await fetch("/api/rider", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  };

  const login = async () => {
    setLoginError("");
    const d = await api({ action: "login", phone, pin });
    if (d.error) return setLoginError(d.error);
    setRider(d); localStorage.setItem("tp_rider", JSON.stringify(d));
  };

  const logout = async () => {
    if (rider) await api({ action: "offline", riderId: rider.id });
    setRider(null); localStorage.removeItem("tp_rider"); setGpsOn(false);
    if (gpsRef.current) navigator.geolocation.clearWatch(gpsRef.current);
  };

  const fetchOrders = async () => {
    if (!rider) return;
    setLoading(true);
    const [a, m] = await Promise.all([api({ action: "available-orders" }), api({ action: "my-orders", riderId: rider.id })]);
    setAvailable(Array.isArray(a) ? a : []); setMyOrders(Array.isArray(m) ? m : []);
    setLoading(false);
  };

  const fetchHistory = async (page: number) => {
    if (!rider) return;
    setHistoryLoading(true);
    const d = await api({ action: "history", riderId: rider.id, page });
    if (d.orders) {
      setHistoryOrders(d.orders);
      setHistoryPage(d.page);
      setHistoryPages(d.pages);
      setEarnings(d.earnings);
      setCommPercent(d.commPercent || 10);
    }
    setHistoryLoading(false);
  };

  const accept = async (id: number) => { setAccepting(id); await api({ action: "accept", orderId: id, riderId: rider!.id }); setTab("my"); fetchOrders(); setTimeout(() => setAccepting(null), 500); };
  const pickUp = async (id: number) => { setActionLoading(id); await api({ action: "picked-up", orderId: id, riderId: rider!.id }); fetchOrders(); setActionLoading(null); };
  const deliver = async (id: number) => { setActionLoading(id); await api({ action: "delivered", orderId: id, riderId: rider!.id }); fetchOrders(); setActionLoading(null); };

  const uploadPhoto = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { alert("ไฟล์ใหญ่เกิน 10MB"); return; }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(new Error("อ่านไฟล์ไม่ได้"));
        r.readAsDataURL(file);
      });

      const compressed = await new Promise<string>((res) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 150; canvas.height = 150;
          const ctx = canvas.getContext("2d")!;
          const size = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 150, 150);
          res(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.src = base64;
      });

      const d = await api({ action: "update-profile", riderId: rider!.id, photo: compressed });
      if (d.error) { alert(d.error); }
      else if (d.id) {
        const updated = { ...rider!, photo: d.photo };
        setRider(updated);
        localStorage.setItem("tp_rider", JSON.stringify(updated));
      }
    } catch (e: any) {
      alert("อัพโหลดไม่สำเร็จ: " + (e.message || ""));
    }
    setUploading(false);
  };

  const timeAgo = (d: string | null) => {
    if (!d) return "-";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "เมื่อกี้";
    if (mins < 60) return `${mins} นาที`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ชม.`;
    return `${Math.floor(hrs / 24)} วัน`;
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

  // ─── LOGIN ───
  if (!rider) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 flex items-center justify-center p-6">
      <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <motion.div className="text-center mb-10" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}>
          <motion.div className="w-20 h-20 bg-gradient-to-br from-brand to-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand/30"
            animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}>
            <Truck size={36} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white">Rider App</h1>
          <p className="text-gray-500 text-sm mt-2">แอพคนขับ • ตลาดปัง</p>
        </motion.div>
        <AnimatePresence>
          {loginError && <motion.div {...scaleIn} className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-2xl px-4 py-3 mb-4 border border-red-400/20"><AlertCircle size={14} />{loginError}</motion.div>}
        </AnimatePresence>
        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="relative"><Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="เบอร์โทร" className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-800/80 border border-gray-700/50 text-white text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder-gray-600" /></div>
          <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">#</span>
            <input value={pin} onChange={e => setPin(e.target.value)} type="password" placeholder="PIN 4 หลัก" maxLength={4} onKeyDown={e => e.key === "Enter" && login()} className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-800/80 border border-gray-700/50 text-white text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder-gray-600 tracking-[0.3em] text-center font-mono" /></div>
        </motion.div>
        <motion.button onClick={login} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand to-emerald-500 text-white font-bold text-lg mt-6 shadow-lg shadow-brand/30">เข้าสู่ระบบ</motion.button>
      </motion.div>
    </div>
  );

  const orders = tab === "available" ? available : myOrders;
  const ep = earnings?.[earnPeriod];

  // ─── MAIN ───
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <motion.header className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700/50 px-4 py-3 sticky top-0 z-30"
        initial={{ y: -50 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div whileTap={{ scale: 0.9 }} onClick={() => setTab("profile")}
              className="w-10 h-10 bg-gradient-to-br from-brand to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 overflow-hidden cursor-pointer">
              {rider.photo ? <img src={rider.photo} alt="" className="w-full h-full object-cover" /> : <Truck size={18} />}
            </motion.div>
            <div>
              <p className="font-bold text-sm">{rider.name}</p>
              <motion.span className={`flex items-center gap-1.5 text-[10px] ${gpsOn ? "text-emerald-400" : "text-red-400"}`}
                animate={gpsOn ? {} : { opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <motion.span className={`w-2 h-2 rounded-full ${gpsOn ? "bg-emerald-400" : "bg-red-400"}`}
                  animate={gpsOn ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 2, repeat: Infinity }} />
                {gpsOn ? "GPS เปิด" : "GPS ปิด"}
              </motion.span>
            </div>
          </div>
          <motion.button onClick={logout} whileTap={{ scale: 0.9 }} className="p-2.5 rounded-xl bg-gray-700/50 text-gray-400 hover:bg-gray-700 transition-colors"><LogOut size={16} /></motion.button>
        </div>
      </motion.header>

      {/* ─── HISTORY TAB ─── */}
      {tab === "history" && (
        <div className="px-3 pb-32">
          {/* Earnings Summary */}
          {earnings && (
            <motion.div {...fadeUp} className="mb-4">
              <div className="flex gap-1 mb-3 bg-gray-800/50 rounded-xl p-0.5">
                {(["today", "week", "month"] as const).map(p => (
                  <button key={p} onClick={() => setEarnPeriod(p)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${earnPeriod === p ? "bg-gray-700 text-white" : "text-gray-500"}`}>
                    {p === "today" ? "วันนี้" : p === "week" ? "7 วัน" : "เดือนนี้"}
                  </button>
                ))}
              </div>
              {ep && (
                <div className="grid grid-cols-3 gap-2">
                  <motion.div {...scaleIn} className="bg-gray-800/80 rounded-2xl p-3 text-center border border-gray-700/30">
                    <Package size={16} className="text-blue-400 mx-auto mb-1" />
                    <p className="text-xl font-bold">{ep.trips}</p>
                    <p className="text-[10px] text-gray-500">งานที่ส่ง</p>
                  </motion.div>
                  <motion.div {...scaleIn} transition={{ delay: 0.05 }} className="bg-gray-800/80 rounded-2xl p-3 text-center border border-gray-700/30">
                    <DollarSign size={16} className="text-amber-400 mx-auto mb-1" />
                    <p className="text-xl font-bold">฿{ep.sales.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">ยอดขาย</p>
                  </motion.div>
                  <motion.div {...scaleIn} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-brand/20 to-emerald-500/20 rounded-2xl p-3 text-center border border-brand/20">
                    <TrendingUp size={16} className="text-brand mx-auto mb-1" />
                    <p className="text-xl font-bold text-brand">฿{ep.commission.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">ค่าคอม {commPercent}%</p>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* History List */}
          {historyLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
          ) : historyOrders.length === 0 ? (
            <motion.div {...fadeUp} className="text-center py-16"><History size={40} className="text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm">ยังไม่มีประวัติ</p></motion.div>
          ) : (
            <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2">
              {historyOrders.map((o, idx) => (
                <motion.div key={o.id} variants={fadeUp} transition={{ delay: idx * 0.03 }}
                  className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0"><CheckCircle size={16} className="text-emerald-400" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-brand">#{o.orderNo}</span>
                      <span className="text-xs font-bold text-emerald-400">฿{Number(o.total).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                      <span>{o.items.length} รายการ</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Calendar size={9} /> {formatDate(o.deliveredAt)}</span>
                    </div>
                    <p className="text-[10px] text-gray-600 truncate mt-0.5">{o.items.map(i => i.menuItem.name).join(", ")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-brand">+฿{Math.round(Number(o.total) * commPercent / 100)}</p>
                    <p className="text-[9px] text-gray-600">ค่าคอม</p>
                  </div>
                </motion.div>
              ))}

              {/* Pagination */}
              {historyPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3">
                  <button onClick={() => fetchHistory(historyPage - 1)} disabled={historyPage <= 1} className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs text-gray-400 disabled:opacity-30"><ChevronLeft size={14} /></button>
                  <span className="text-xs text-gray-500">{historyPage}/{historyPages}</span>
                  <button onClick={() => fetchHistory(historyPage + 1)} disabled={historyPage >= historyPages} className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs text-gray-400 disabled:opacity-30"><ChevronRight size={14} /></button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ─── PROFILE TAB ─── */}
      {tab === "profile" && (
        <div className="px-3 pb-32">
          <motion.div {...fadeUp} className="flex flex-col items-center py-8">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center overflow-hidden shadow-xl shadow-brand/20">
                {rider.photo ? <img src={rider.photo} alt="" className="w-full h-full object-cover" /> : <User size={40} className="text-white" />}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer border-2 border-gray-900 hover:bg-gray-600 transition">
                {uploading ? <Loader2 size={14} className="animate-spin text-white" /> : <Camera size={14} className="text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </label>
            </div>
            <h2 className="text-xl font-bold">{rider.name}</h2>
            <p className="text-gray-500 text-sm flex items-center gap-1.5"><Phone size={12} /> {rider.phone}</p>
          </motion.div>

          {/* Stats Cards */}
          {earnings && (
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="space-y-3">
              <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/30">
                <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1.5"><TrendingUp size={12} /> สรุปผลงาน</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700/30 rounded-xl p-3">
                    <p className="text-2xl font-bold">{earnings.all.trips}</p>
                    <p className="text-[10px] text-gray-500">ส่งทั้งหมด</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-3">
                    <p className="text-2xl font-bold text-brand">฿{earnings.all.commission.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">รายได้รวม ({commPercent}%)</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-3">
                    <p className="text-2xl font-bold">{earnings.month.trips}</p>
                    <p className="text-[10px] text-gray-500">เดือนนี้</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-3">
                    <p className="text-2xl font-bold text-emerald-400">฿{earnings.month.commission.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">รายได้เดือนนี้</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/30">
                <h3 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1.5"><Settings size={12} /> ข้อมูลบัญชี</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-gray-700/30"><span className="text-gray-500">เบอร์โทร</span><span>{rider.phone}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-gray-700/30"><span className="text-gray-500">ค่าคอมมิชชั่น</span><span className="text-brand font-bold">{commPercent}%</span></div>
                  <div className="flex justify-between py-1.5"><span className="text-gray-500">สถานะ GPS</span><span className={gpsOn ? "text-emerald-400" : "text-red-400"}>{gpsOn ? "เปิด" : "ปิด"}</span></div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button {...fadeUp} transition={{ delay: 0.2 }} onClick={logout} className="w-full mt-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2">
            <LogOut size={16} /> ออกจากระบบ
          </motion.button>
        </div>
      )}

      {/* ─── ORDERS TAB (available + my) ─── */}
      {(tab === "available" || tab === "my") && (
        <div className="px-3 pb-32">
          <AnimatePresence mode="wait">
            {loading && !orders.length ? (
              <motion.div key="loading" {...fadeIn} className="flex justify-center py-20">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader2 className="w-8 h-8 text-brand" /></motion.div>
              </motion.div>
            ) : orders.length === 0 ? (
              <motion.div key="empty" {...fadeUp} className="text-center py-20">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}><Package size={48} className="text-gray-700 mx-auto mb-4" /></motion.div>
                <p className="text-gray-500 text-sm">{tab === "available" ? "ยังไม่มีงาน" : "ยังไม่มีงานที่รับ"}</p>
                <p className="text-gray-600 text-xs mt-1">ระบบตรวจสอบทุก 8 วินาที</p>
              </motion.div>
            ) : (
              <motion.div key={tab} variants={stagger} initial="initial" animate="animate" className="space-y-3">
                {orders.map((order: any, idx: number) => {
                  const picked = !!order.pickedUpAt;
                  const isMyOrder = tab === "my";
                  return (
                    <motion.div key={order.id} variants={fadeUp} transition={{ delay: idx * 0.05 }} layout
                      className={`bg-gray-800/80 backdrop-blur-sm rounded-2xl border overflow-hidden ${isMyOrder ? (picked ? "border-blue-500/30" : "border-amber-500/30") : "border-gray-700/50"}`}>
                      {isMyOrder && (
                        <motion.div className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 ${picked ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                          <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>{picked ? "🏍️" : "📦"}</motion.span>
                          {picked ? "กำลังส่งให้ลูกค้า" : "ไปรับอาหารที่ร้าน"}
                        </motion.div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-brand font-bold text-sm">#{order.orderNo}</span>
                            <span className="text-gray-600 text-[10px] flex items-center gap-1"><Clock size={9} /> {timeAgo(order.createdAt)}</span>
                          </div>
                          <span className="font-bold text-brand text-lg">฿{Number(order.total).toLocaleString()}</span>
                        </div>
                        {isMyOrder && (
                          <motion.div {...fadeUp} className="bg-gray-700/30 rounded-xl p-3 mb-3 space-y-2 border border-gray-700/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs"><User size={12} className="text-gray-500" /><span className="text-gray-300">{order.custName || "-"}</span></div>
                              <motion.a href={`tel:${order.custPhone}`} whileTap={{ scale: 0.9 }} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand/20 text-brand text-xs font-semibold"><Phone size={10} /> โทร</motion.a>
                            </div>
                            {order.custAddress && <div className="flex items-start gap-2 text-xs"><MapPin size={12} className="text-gray-500 mt-0.5 shrink-0" /><span className="text-gray-400">{order.custAddress}</span></div>}
                          </motion.div>
                        )}
                        <div className="space-y-1 mb-4">
                          {order.items.map((i: any) => (
                            <div key={i.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-400 flex items-center gap-1.5"><UtensilsCrossed size={10} className="text-gray-600" /> {i.menuItem.name}</span>
                              <span className="text-gray-500">×{i.qty}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {!isMyOrder ? (
                            <motion.button onClick={() => accept(order.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} disabled={!!accepting}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand to-emerald-500 text-white font-bold text-sm shadow-lg shadow-brand/20 flex items-center justify-center gap-2 disabled:opacity-50">
                              {accepting === order.id ? <Loader2 size={16} className="animate-spin" /> : <><Truck size={16} /> รับงานนี้</>}
                            </motion.button>
                          ) : !picked ? (
                            <motion.button onClick={() => pickUp(order.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} disabled={!!actionLoading}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                              {actionLoading === order.id ? <Loader2 size={16} className="animate-spin" /> : <><Package size={16} /> รับอาหารแล้ว</>}
                            </motion.button>
                          ) : (
                            <motion.button onClick={() => deliver(order.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} disabled={!!actionLoading}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                              {actionLoading === order.id ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> ส่งสำเร็จแล้ว</>}
                            </motion.button>
                          )}
                          {isMyOrder && order.custAddress && (
                            <motion.a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.custAddress)}`} target="_blank" whileTap={{ scale: 0.97 }}
                              className="w-full py-2.5 rounded-xl bg-gray-700/50 text-gray-300 text-xs font-medium flex items-center justify-center gap-2 hover:bg-gray-700 transition border border-gray-700/30">
                              <Navigation size={13} /> นำทาง Google Maps <ChevronRight size={12} className="text-gray-600" />
                            </motion.a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ═══ BOTTOM NAVIGATION BAR ═══ */}
      <motion.nav className="fixed bottom-0 left-0 right-0 z-30 safe-area-bottom"
        initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        {/* Status bar */}
        <div className="bg-gray-900/80 backdrop-blur-sm px-4 py-1 flex items-center justify-between text-[9px] text-gray-600 border-t border-gray-800/50">
          <span className="flex items-center gap-1">
            <motion.span className={`w-1.5 h-1.5 rounded-full ${gpsOn ? "bg-emerald-400" : "bg-red-400"}`} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            {gpsOn ? "GPS เปิด" : "GPS ปิด"} • Auto-refresh 8s
          </span>
          <span>{new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
        </div>
        {/* Nav items */}
        <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/50 px-2 pt-1.5 pb-2">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {([
              { key: "available" as const, icon: Package, label: "งานว่าง", badge: available.length },
              { key: "my" as const, icon: Truck, label: "งานของฉัน", badge: myOrders.length },
              { key: "history" as const, icon: History, label: "ประวัติ", badge: 0 },
              { key: "profile" as const, icon: User, label: "โปรไฟล์", badge: 0 },
            ]).map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <motion.button key={t.key} onClick={() => setTab(t.key)} whileTap={{ scale: 0.85 }}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all relative ${active ? "text-brand" : "text-gray-500"}`}>
                  <div className="relative">
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                    {t.badge > 0 && (
                      <motion.span key={t.badge} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center px-1">
                        {t.badge}
                      </motion.span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${active ? "text-brand" : "text-gray-500"}`}>{t.label}</span>
                  {active && <motion.div layoutId="navIndicator" className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand rounded-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
