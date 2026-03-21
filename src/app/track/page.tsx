"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Clock, Utensils, UtensilsCrossed, CheckCircle, Truck, MapPin,
  Phone, User, Loader2, Package, Star, Search, ArrowLeft, Navigation
} from "lucide-react";

type TrackData = {
  order: {
    id: number; orderNo: string; custName: string; status: string;
    kitchenStatus: string; total: number; createdAt: string; estimatedMins: number | null;
    items: { id: number; qty: number; price: number; menuItem: { name: string } }[];
  };
  timeline: { id: number; status: string; label: string; createdAt: string }[];
  rider: { id: number; name: string; phone: string; lat: number; lng: number } | null;
  eta: number | null;
  shop: { name: string; lat: number; lng: number };
};

const ALL_STEPS = [
  { key: "order_placed", label: "สั่งอาหารแล้ว", icon: Package, color: "bg-brand text-white" },
  { key: "preparing", label: "เตรียมวัตถุดิบ", icon: UtensilsCrossed, color: "bg-blue-500 text-white" },
  { key: "cooking", label: "กำลังปรุง", icon: Utensils, color: "bg-orange-500 text-white" },
  { key: "plating", label: "จัดจาน", icon: Star, color: "bg-purple-500 text-white" },
  { key: "ready", label: "อาหารพร้อม", icon: CheckCircle, color: "bg-emerald-500 text-white" },
  { key: "rider_accepted", label: "คนขับรับงาน", icon: Truck, color: "bg-cyan-500 text-white" },
  { key: "picked_up", label: "รับอาหารแล้ว", icon: Truck, color: "bg-indigo-500 text-white" },
  { key: "delivered", label: "ส่งสำเร็จ!", icon: CheckCircle, color: "bg-brand text-white" },
];

function TrackContent() {
  const searchParams = useSearchParams();
  const [orderNo, setOrderNo] = useState(searchParams.get("no") || "");
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (orderNo) { fetchTrack(); const i = setInterval(fetchTrack, 5000); return () => clearInterval(i); }
  }, [orderNo]);

  const fetchTrack = async () => {
    if (!orderNo) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/track?no=${orderNo}`);
      const d = await res.json();
      if (d.error) { setError(d.error); setData(null); } else setData(d);
    } catch { setError("เกิดข้อผิดพลาด"); }
    setLoading(false);
  };

  const doSearch = () => { if (searchInput.trim()) setOrderNo(searchInput.trim().replace("#", "")); };

  const getCurrentStep = () => {
    if (!data) return -1;
    const { order, rider, timeline } = data;
    if (order.status === "delivered") return 7;
    if (timeline.some(t => t.status === "picked_up")) return 6;
    if (rider) return 5;
    if (order.kitchenStatus === "ready") return 4;
    if (order.kitchenStatus === "plating") return 3;
    if (order.kitchenStatus === "cooking") return 2;
    if (order.kitchenStatus === "preparing") return 1;
    return 0;
  };

  const currentStep = getCurrentStep();

  // Search screen
  if (!orderNo || error) return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 h-14 flex items-center gap-3">
        <a href="/" className="p-2 rounded-lg hover:bg-gray-100 transition"><ArrowLeft size={18} className="text-gray-500" /></a>
        <UtensilsCrossed size={20} className="text-brand" />
        <span className="font-bold text-brand">ตลาดปัง</span>
      </nav>
      <div className="flex items-center justify-center p-6 min-h-[80vh]">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-brand" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">ติดตามออเดอร์</h1>
          <p className="text-sm text-gray-400 mb-6">ใส่หมายเลขออเดอร์เพื่อดูสถานะอาหาร</p>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2 mb-4">{error}</p>}
          <div className="flex gap-2">
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="เช่น TP0301-XXXX" className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-brand shadow-sm" />
            <button onClick={doSearch} className="px-5 py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition shadow-sm">ค้นหา</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && !data) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>
  );
  if (!data) return null;

  const { order, timeline, rider, eta } = data;
  const isDelivered = order.status === "delivered";
  const isDelivering = !!rider && !isDelivered;
  const currentStepData = ALL_STEPS[currentStep];
  const progress = ((currentStep + 1) / ALL_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-gradient-to-br from-brand to-brand-light text-white px-4 pt-4 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <a href="/" className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition"><ArrowLeft size={18} /></a>
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={18} />
              <span className="font-bold text-sm">ตลาดปัง</span>
            </div>
            <button onClick={() => { setOrderNo(""); setData(null); }} className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition"><Search size={18} /></button>
          </div>
          <p className="text-white/60 text-xs mb-0.5">ออเดอร์ #{order.orderNo}</p>
          <h1 className="text-xl font-bold mb-2">
            {isDelivered ? "ส่งอาหารสำเร็จ! 🎉" :
             isDelivering ? "กำลังจัดส่ง... 🏍️" :
             currentStep >= 4 ? "อาหารพร้อมแล้ว! ✅" :
             "กำลังเตรียมอาหาร... 🔥"}
          </h1>
          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-2 mt-3">
            <div className="bg-white rounded-full h-2 transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/50">สั่งแล้ว</span>
            <span className="text-[10px] text-white/50">ส่งสำเร็จ</span>
          </div>
          {(eta || order.estimatedMins) && !isDelivered && (
            <div className="flex items-center gap-2 mt-3 bg-white/15 rounded-xl px-3 py-2 w-fit">
              <Clock size={14} />
              <span className="text-xs font-medium">
                {eta ? `ถึงในอีก ~${eta} นาที` : `เวลาทำอาหาร ~${order.estimatedMins} นาที`}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 -mt-1">
        {/* Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-3 shadow-sm">
          <div className="space-y-0">
            {ALL_STEPS.map((step, i) => {
              const isDone = i <= currentStep;
              const isCurrent = i === currentStep;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isCurrent ? `${step.color} ring-4 ring-brand/10 shadow-md` : isDone ? step.color : "bg-gray-100 text-gray-300"
                    }`}>
                      <Icon size={14} />
                    </div>
                    {i < ALL_STEPS.length - 1 && <div className={`w-0.5 h-6 ${isDone ? "bg-brand" : "bg-gray-200"}`} />}
                  </div>
                  <div className={`pt-1.5 ${isCurrent ? "font-bold text-gray-800" : isDone ? "text-gray-600" : "text-gray-300"}`}>
                    <p className="text-sm leading-none">{step.label}</p>
                    {isCurrent && !isDelivered && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                        </span>
                        <span className="text-[10px] text-brand font-medium">กำลังดำเนินการ</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rider Info */}
        {rider && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-brand/10 rounded-full flex items-center justify-center">
                  <Truck size={20} className="text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{rider.name}</p>
                  <p className="text-xs text-gray-400">คนขับของคุณ</p>
                </div>
              </div>
              <a href={`tel:${rider.phone}`} className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center hover:bg-brand/20 transition">
                <Phone size={16} />
              </a>
            </div>
            {rider.lat && (
              <div className="mt-3 bg-gradient-to-br from-brand-bg to-gray-50 rounded-xl h-28 flex items-center justify-center border border-gray-100 relative overflow-hidden">
                <div className="text-center">
                  <MapPin size={24} className="text-brand mx-auto mb-1 animate-bounce" />
                  <p className="text-[10px] text-gray-400">GPS ติดตาม</p>
                  {eta && <p className="text-sm font-bold text-brand">~{eta} นาทีถึง</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-400 mb-3">รายการอาหาร</h3>
          <div className="space-y-2">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.menuItem.name} ×{item.qty}</span>
                <span className="text-gray-400 font-medium">฿{(Number(item.price) * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
            <span className="font-bold text-gray-800 text-sm">รวม</span>
            <span className="font-bold text-brand text-lg">฿{Number(order.total).toLocaleString()}</span>
          </div>
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 mb-3">ประวัติ</h3>
            <div className="space-y-2.5">
              {timeline.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                  <span className="text-sm text-gray-600 flex-1">{t.label}</span>
                  <span className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="pb-6">
          <a href="/" className="block w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-medium text-sm text-center hover:bg-gray-50 transition">
            ← กลับหน้าสั่งอาหาร
          </a>
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>}>
      <TrackContent />
    </Suspense>
  );
}
