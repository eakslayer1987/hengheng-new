"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function ReceiptContent() {
  const sp = useSearchParams();
  const orderNo = sp.get("no") || "";
  const type = sp.get("type") || "receipt"; // receipt | kitchen
  const [order, setOrder] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNo) return;
    (async () => {
      try {
        const [oRes, sRes] = await Promise.all([
          fetch(`/api/track?no=${orderNo}`),
          fetch("/api/admin/settings"),
        ]);
        setOrder(await oRes.json());
        setSettings(await sRes.json());
      } catch {}
      setLoading(false);
    })();
  }, [orderNo]);

  useEffect(() => {
    if (order && !loading) setTimeout(() => window.print(), 500);
  }, [order, loading]);

  if (!orderNo) return <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>ไม่พบเลขออเดอร์</div>;
  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>กำลังโหลด...</div>;
  if (!order || order.error) return <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>ไม่พบออเดอร์ {orderNo}</div>;

  const items = order.items || [];
  const total = Number(order.total);
  const discount = Number(order.discount || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.price) * i.qty, 0);
  const shopName = settings.shop_name || "ตลาดปัง";
  const shopPhone = settings.shop_phone || "";
  const shopAddress = settings.shop_address || "";
  const now = new Date(order.createdAt).toLocaleString("th-TH");

  // Kitchen slip (compact)
  if (type === "kitchen") return (
    <div style={{ width: 280, margin: "0 auto", padding: "12px 0", fontFamily: "'Kanit', sans-serif", fontSize: 12 }}>
      <style>{`@media print { body { margin: 0; } @page { size: 80mm auto; margin: 0; } }`}</style>
      <div style={{ textAlign: "center", borderBottom: "2px dashed #333", paddingBottom: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>🍳 ใบสั่งครัว</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#00B900", margin: "4px 0" }}>#{order.orderNo}</div>
        <div style={{ fontSize: 10, color: "#888" }}>{now}</div>
      </div>
      <div style={{ marginBottom: 8 }}>
        {items.map((i: any, idx: number) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dotted #ddd", fontSize: 14 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 18, marginRight: 8 }}>×{i.qty}</span>
              <span style={{ fontWeight: 600 }}>{i.menuItem?.name || i.name}</span>
            </div>
          </div>
        ))}
      </div>
      {order.note && <div style={{ background: "#fff3cd", padding: "6px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>📝 {order.note}</div>}
      <div style={{ borderTop: "2px dashed #333", paddingTop: 8, textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#888" }}>👤 {order.custName || "-"} | 📞 {order.custPhone}</div>
        {order.custAddress && <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>📍 {order.custAddress}</div>}
      </div>
    </div>
  );

  // Customer receipt
  return (
    <div style={{ width: 320, margin: "0 auto", padding: "16px 0", fontFamily: "'Kanit', sans-serif", fontSize: 12 }}>
      <style>{`@media print { body { margin: 0; } @page { size: 80mm auto; margin: 0; } }`}</style>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{shopName}</div>
        {shopPhone && <div style={{ fontSize: 10, color: "#888" }}>📞 {shopPhone}</div>}
        {shopAddress && <div style={{ fontSize: 10, color: "#888" }}>📍 {shopAddress}</div>}
        <div style={{ margin: "8px 0", borderTop: "2px dashed #333" }} />
        <div style={{ fontSize: 11, fontWeight: 600 }}>ใบเสร็จรับเงิน</div>
      </div>

      {/* Order info */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 8 }}>
        <span>ออเดอร์ <b style={{ color: "#00B900" }}>#{order.orderNo}</b></span>
        <span style={{ color: "#888" }}>{now}</span>
      </div>
      <div style={{ fontSize: 11, marginBottom: 8, color: "#555" }}>
        👤 {order.custName || "-"} | 📞 {order.custPhone}
      </div>

      {/* Items */}
      <div style={{ borderTop: "1px solid #eee", borderBottom: "1px solid #eee", marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 10, fontWeight: 700, color: "#888", borderBottom: "1px solid #eee" }}>
          <span>รายการ</span><span>รวม</span>
        </div>
        {items.map((i: any, idx: number) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px dotted #eee" }}>
            <div><span>{i.menuItem?.name || i.name}</span><span style={{ color: "#888", marginLeft: 6 }}>×{i.qty}</span></div>
            <span style={{ fontWeight: 600 }}>฿{(Number(i.price) * i.qty).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ fontSize: 11, marginBottom: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
          <span style={{ color: "#888" }}>รวมรายการ</span><span>฿{subtotal.toLocaleString()}</span>
        </div>
        {deliveryFee > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
          <span style={{ color: "#888" }}>ค่าจัดส่ง</span><span>฿{deliveryFee.toLocaleString()}</span>
        </div>}
        {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#ef4444" }}>
          <span>ส่วนลด{order.couponCode ? ` (${order.couponCode})` : ""}</span><span>-฿{discount.toLocaleString()}</span>
        </div>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #333", paddingTop: 6, fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
        <span>รวมทั้งสิ้น</span><span style={{ color: "#00B900" }}>฿{total.toLocaleString()}</span>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", borderTop: "2px dashed #333", paddingTop: 8, color: "#888", fontSize: 10 }}>
        <div>ขอบคุณที่ใช้บริการ ❤️</div>
        <div style={{ marginTop: 2 }}>{shopName}</div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>โหลด...</div>}><ReceiptContent /></Suspense>;
}
