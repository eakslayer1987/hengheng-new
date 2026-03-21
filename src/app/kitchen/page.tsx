"use client";
import { useState, useEffect, useRef } from "react";
import {
  Clock, Utensils, Star, UtensilsCrossed, CheckCircle, Loader2,
  ArrowRight, Timer, AlertTriangle, Volume2, VolumeX, RefreshCw
} from "lucide-react";

type Item = { id: number; qty: number; menuItem: { name: string } };
type Timeline = { id: number; status: string; label: string; createdAt: string };
type Order = {
  id: number; orderNo: string; custName: string; custPhone: string; note: string;
  kitchenStatus: string; createdAt: string; kitchenStartAt: string | null; items: Item[]; timeline: Timeline[];
};

const STEPS = [
  { key: "waiting", label: "รอรับ", icon: Clock, color: "bg-amber-500" },
  { key: "preparing", label: "เตรียมของ", icon: UtensilsCrossed, color: "bg-blue-500" },
  { key: "cooking", label: "ปรุง", icon: Utensils, color: "bg-orange-500" },
  { key: "plating", label: "จัดจาน", icon: Star, color: "bg-purple-500" },
  { key: "ready", label: "พร้อมส่ง", icon: CheckCircle, color: "bg-emerald-500" },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [now, setNow] = useState(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevRef = useRef(0);

  useEffect(() => {
    fetchOrders();
    const i1 = setInterval(fetchOrders, 5000);
    const i2 = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/kitchen");
      const data = await res.json();
      const o = data.orders || [];
      const wc = o.filter((x: Order) => x.kitchenStatus === "waiting").length;
      if (wc > prevRef.current && soundOn) try { audioRef.current?.play(); } catch {}
      prevRef.current = wc;
      setOrders(o);
    } catch {}
    setLoading(false);
  };

  const advance = async (id: number) => {
    await fetch("/api/kitchen", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: id, action: "next" }) });
    fetchOrders();
  };

  const elapsed = (d: string) => Math.floor((now - new Date(d).getTime()) / 60000);
  const grouped = STEPS.map(s => ({ ...s, orders: orders.filter(o => o.kitchenStatus === s.key) }));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <audio ref={audioRef} preload="auto"><source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdA==" /></audio>

      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center"><Utensils size={18} /></div>
            <div>
              <h1 className="font-bold text-sm">ครัว ตลาดปัง</h1>
              <p className="text-[10px] text-gray-500">Kitchen Display System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-5 text-sm">
              {[
                { v: orders.filter(o => o.kitchenStatus !== "ready").length, l: "กำลังทำ", c: "text-brand" },
                { v: grouped[0].orders.length, l: "รอรับ", c: "text-amber-400" },
                { v: grouped[4].orders.length, l: "เสร็จ", c: "text-emerald-400" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-[9px] text-gray-500">{s.l}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setSoundOn(!soundOn)} className={`p-2 rounded-lg ${soundOn ? "bg-brand/20 text-brand" : "bg-gray-700 text-gray-500"}`}>
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <a href="/admin" className="text-[10px] text-gray-500 hover:text-gray-300 transition">Admin →</a>
          </div>
        </div>
      </header>

      <div className="p-3">
        {loading && !orders.length ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>
        ) : (
          <div className="grid grid-cols-5 gap-2 h-[calc(100vh-80px)]">
            {grouped.map((step, si) => (
              <div key={step.key} className="flex flex-col min-h-0">
                <div className={`${step.color} rounded-t-lg px-3 py-2 flex items-center justify-between shrink-0`}>
                  <div className="flex items-center gap-1.5"><step.icon size={14} /><span className="font-bold text-xs">{step.label}</span></div>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">{step.orders.length}</span>
                </div>
                <div className="flex-1 bg-gray-800/50 rounded-b-lg p-1.5 space-y-1.5 overflow-y-auto">
                  {step.orders.length === 0 ? (
                    <div className="text-center py-6 text-gray-700 text-xs">ว่าง</div>
                  ) : step.orders.map(order => {
                    const mins = elapsed(order.kitchenStartAt || order.createdAt);
                    const slow = mins > 15 && step.key !== "ready";
                    return (
                      <div key={order.id} className={`bg-gray-800 rounded-xl border ${slow ? "border-red-500/50" : "border-gray-700"} p-3`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-brand font-bold text-sm">#{order.orderNo}</span>
                          <span className={`flex items-center gap-1 text-[10px] ${slow ? "text-red-400" : "text-gray-500"}`}>
                            {slow && <AlertTriangle size={10} />}<Timer size={10} />{mins}น.
                          </span>
                        </div>
                        <div className="space-y-0.5 mb-2">
                          {order.items.map((i: any) => (
                            <div key={i.id} className="flex justify-between text-xs">
                              <span className="text-gray-300 truncate">{i.menuItem.name}</span>
                              <span className="text-brand font-bold ml-2">×{i.qty}</span>
                            </div>
                          ))}
                        </div>
                        {order.note && <div className="text-[10px] text-yellow-400 bg-yellow-400/10 rounded-lg px-2 py-1 mb-2 truncate">📝 {order.note}</div>}
                        <div className="text-[10px] text-gray-600 mb-2">{order.custName} • {order.custPhone}</div>
                        {step.key !== "ready" ? (
                          <button onClick={() => advance(order.id)} className={`w-full py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${STEPS[si + 1]?.color || "bg-gray-600"} hover:opacity-90`}>
                            <ArrowRight size={12} />{STEPS[si + 1]?.label || "ถัดไป"}
                          </button>
                        ) : (
                          <div className="text-center text-emerald-400 text-[10px] font-medium py-1">✅ รอคนขับ</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
