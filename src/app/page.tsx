"use client";
import { BannerSlot } from "@/components/BannerSlot";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Trophy, History, MoreHorizontal, QrCode,
  Phone, Loader2, AlertCircle, ChevronRight,
  Store, Copy, Check, RotateCcw, Gift, MapPin, Navigation
} from "lucide-react";

/* ═══ TYPES ═══ */
type Campaign = {
  id: number; name: string; endDate: string; totalBudget: number;
  prizes: { id:number; name:string; value:number; quantity:number; remaining:number }[];
  totalCollected?: number;
};
type CollectPhase = "idle"|"scanning"|"gps"|"form"|"submitting"|"result";
type CodeHistory = { id:number; code:string; merchantName:string; campaignName:string; isWinner:boolean; claimStatus:string; collectedAt:string };

/* ─── PHP API URL ─── */
const PHP_API = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PHP_API_URL)
  || "https://xn--72ca9ib1gc.xn--72cac8e8ec.com/hengheng/api";

/* ─── Site Content (fetched from PHP SystemConfig) ─── */
type SiteContent = Record<string,string>;
const CONTENT_FALLBACK: SiteContent = {
  app_name:"ปังจัง Lucky Draw", app_subtitle:"ชิงโชคมูลค่ากว่า 1 ล้านบาท",
  daily_limit_title:"เก็บโค้ดได้ 3 ครั้ง/วัน",
  daily_limit_sub:"สะสมได้จากร้านค้าพาร์ทเนอร์ต่างๆ รวมกัน ไม่เกิน 3 ครั้งต่อวัน",
  scan_btn_text:"สแกน QR รับโค้ดลุ้นโชค",
  prize_section_title:"🏆 รางวัลโชคใหญ่",
  nav_home:"หน้าหลัก", nav_prizes:"รางวัล", nav_scan:"รหัสชิง", nav_check:"ตรวจสอบ", nav_more:"อื่นๆ",
  hero_slides:JSON.stringify([
    {emoji:"🎰",title:"ชิงโชคมูลค่า 2.4 ล้านบาท",sub:"สแกน QR ที่ร้านพาร์ทเนอร์"},
    {emoji:"🏪",title:"ร้านค้าพาร์ทเนอร์",sub:"ยิ่งขายซอสหมีปรุง ยิ่งได้ QR"},
    {emoji:"🎫",title:"สะสมโค้ด ลุ้นโชคใหญ่",sub:"เก็บโค้ดได้สูงสุด 3 ร้าน/วัน"},
  ]),
  how_to_steps:JSON.stringify([
    {n:1,e:"🍽️",t:"ซื้อซอสหมีปรุงที่ร้านพาร์ทเนอร์",d:"ร้านที่มีป้าย Smart QR ปังจัง"},
    {n:2,e:"📍",t:"สแกน QR ในระยะ 20 เมตร",d:"ต้องอยู่ในร้านเท่านั้น เพื่อยืนยันตัวตน"},
    {n:3,e:"📝",t:"กรอกชื่อ+เบอร์ → รับโค้ดทันที",d:"1 ร้านได้ 1 โค้ด/วัน สูงสุด 3 ร้าน/วัน"},
    {n:4,e:"🎟️",t:"สะสมโค้ด → ลุ้นโชคใหญ่",d:"ยิ่งมีโค้ดมาก ยิ่งมีสิทธิ์มาก"},
  ]),
};
function useSiteContent(){
  const [ct,setCt]=useState<SiteContent>(CONTENT_FALLBACK);
  useEffect(()=>{
    fetch(`${PHP_API}/content.php`)
      .then(r=>r.json())
      .then(d=>{if(d.content)setCt({...CONTENT_FALLBACK,...d.content});})
      .catch(()=>{
        // fallback: ลอง Next.js API route
        fetch("/api/content").then(r=>r.json()).then(d=>{if(d.content)setCt({...CONTENT_FALLBACK,...d.content});}).catch(()=>{});
      });
  },[]);
  return ct;
}

/* ═══ THEME ═══ */
const R = {
  bg:"#6d0a0a", bgDark:"#3d0404", bgDeep:"#2a0202",
  border:"rgba(200,146,12,0.35)", borderBright:"rgba(232,184,32,0.6)",
  gold:"#E8B820", goldLight:"#F5D78E", goldDark:"#A67208",
  text:"#fff", textSub:"rgba(255,220,180,0.7)", textMuted:"rgba(255,180,150,0.45)",
};

/* ─── GPS helpers ─── */
function getDistanceM(lat1:number,lng1:number,lat2:number,lng2:number){
  const R=6371000, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function getCurrentPosition():Promise<GeolocationPosition>{
  return new Promise((res,rej)=>{
    if(!navigator.geolocation){ rej(new Error("no_geolocation")); return; }
    navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:10000,maximumAge:0});
  });
}

/* ═══ CONFETTI ═══ */
function Confetti() {
  const colors=["#FD1803","#E8B820","#F5D78E","#FFD700","#fff"];
  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {Array.from({length:80}).map((_,i)=>(
        <motion.div key={i}
          initial={{y:-20,x:`${Math.random()*100}vw`,rotate:0,opacity:1}}
          animate={{y:"110vh",rotate:720*(Math.random()>.5?1:-1),opacity:[1,1,0]}}
          transition={{duration:2+Math.random()*2,delay:Math.random()*0.8,ease:"linear"}}
          style={{position:"absolute",width:5+Math.random()*9,height:5+Math.random()*9,
            background:colors[~~(Math.random()*colors.length)],borderRadius:Math.random()>.5?"50%":"3px"}}/>
      ))}
    </div>
  );
}

/* ═══ HOME TAB ═══ */
type HeroBanner={id:number;title?:string|null;body?:string|null;imageUrl?:string|null;linkUrl?:string|null;linkTarget:string;bgColor:string};

function HomeTab({campaign,onScan,ct}:{campaign:Campaign|null;onScan:()=>void;ct:SiteContent}){
  const [bi,setBi]=useState(0);
  const [heroBanners,setHeroBanners]=useState<HeroBanner[]>([]);

  // Fallback slides (ใช้เมื่อไม่มี banner จาก admin)
  const rawFB:{emoji:string;title:string;sub:string}[]=(()=>{
    try{
      const p=JSON.parse(ct.hero_slides||"[]");
      return Array.isArray(p)?p.filter(Boolean).map((s:any)=>({emoji:s.emoji??s.e??"✨",title:s.title??s.t??"",sub:s.sub??s.d??""})):[];
    }catch{return [];}
  })();
  const FB=rawFB.map((s:any)=>({...s,img:""}));

  // Fetch hero banners from PHP admin
  useEffect(()=>{
    fetch(`${PHP_API}/banners.php?position=user_hero`)
      .then(r=>r.json())
      .then(d=>{if(d.banners?.length)setHeroBanners(d.banners);})
      .catch(()=>{});
  },[]);

  // Build slides: hero banners first, then fallbacks
  const slides = heroBanners.length > 0
    ? heroBanners.map(b=>({emoji:"",title:b.title||"",sub:b.body||"",img:b.imageUrl||"",link:b.linkUrl||"",linkTarget:b.linkTarget,bg:b.bgColor}))
    : FB.map(s=>({...s,link:"",linkTarget:"_self",bg:""}));

  const total=slides.length;
  useEffect(()=>{const t=setInterval(()=>setBi(p=>(p+1)%total),4000);return()=>clearInterval(t);},[total]);

  return(
    <div className="space-y-3 px-4">
      <BannerSlot position="user_topbar"/>
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
        className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden"
        style={{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,border:`1px solid ${R.borderBright}`}}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{background:`linear-gradient(90deg,transparent,${R.gold},transparent)`}}/>
        <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-2xl flex-shrink-0"
          style={{background:"radial-gradient(circle at 30% 30%,#c01020,#7a0000)",border:`2px solid ${R.borderBright}`,boxShadow:`0 0 20px rgba(232,184,32,0.3)`}}>ป</div>
        <div className="flex-1">
          <p className="font-black text-white">{ct.app_name}</p>
          <p className="text-xs mt-0.5" style={{color:R.textMuted}}>{campaign?.name||"กำลังโหลด..."}</p>
        </div>
        <div className="text-right">
          <p className="font-black text-xl" style={{color:R.gold}}>{campaign?(campaign.totalCollected||0).toLocaleString():"—"}</p>
          <p className="text-xs" style={{color:R.textMuted}}>โค้ดทั้งหมด</p>
        </div>
      </motion.div>

      {/* Hero Carousel — แสดงรูปจาก admin หรือ fallback slides */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.05}}
        className="rounded-2xl overflow-hidden relative"
        style={{height: heroBanners.length > 0 ? "auto" : 150, minHeight:150, border:`1px solid ${R.border}`}}>
        <AnimatePresence mode="wait">
          <motion.div key={bi} initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
            transition={{duration:.35}} className="relative w-full"
            onClick={()=>{const s=slides[bi];if(s.link)window.open(s.link,s.linkTarget);}}
            style={{cursor:slides[bi]?.link?"pointer":"default"}}>
            {slides[bi]?.img
              ? <img src={slides[bi].img} alt={slides[bi].title}
                  style={{width:"100%",display:"block",objectFit:"contain",borderRadius:12}}/>
              : <div className="flex flex-col justify-end p-5" style={{height:150,
                  background:`linear-gradient(135deg,${R.bgDark},${bi===1?"rgba(30,58,138,0.7)":bi===2?"rgba(20,80,20,0.5)":R.bg})`}}>
                  <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(circle,rgba(232,184,32,0.1) 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
                  <div className="absolute inset-0" style={{background:"linear-gradient(to top,rgba(0,0,0,0.5),transparent 60%)"}}/>
                  <div className="relative z-10">
                    <span className="text-3xl block mb-1">{slides[bi].emoji}</span>
                    <p className="text-lg font-black text-white">{slides[bi].title}</p>
                    <p className="text-sm font-bold" style={{color:R.goldLight}}>{slides[bi].sub}</p>
                  </div>
                </div>
            }
            {/* Overlay text on image banner */}
            {slides[bi]?.img && (slides[bi].title||slides[bi].sub) && (
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
                style={{background:"linear-gradient(to top,rgba(0,0,0,0.65),transparent)"}}>
                {slides[bi].title&&<p className="font-black text-white text-base leading-tight">{slides[bi].title}</p>}
                {slides[bi].sub&&<p className="text-xs mt-0.5 text-white opacity-80">{slides[bi].sub}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {/* Dots */}
        {total>1&&(
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((_,i)=>(
              <motion.button key={i} onClick={()=>setBi(i)}
                animate={{width:i===bi?18:5,background:i===bi?R.gold:"rgba(255,255,255,0.5)"}}
                className="h-1.5 rounded-full"/>
            ))}
          </div>
        )}
      </motion.div>

      <motion.button initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.1}}
        onClick={onScan} whileTap={{scale:.97}}
        className="w-full h-16 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 relative overflow-hidden"
        style={{background:"linear-gradient(135deg,#FD1803,#a00000)",boxShadow:"0 6px 28px rgba(253,24,3,0.5)"}}>
        <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.12) 1px,transparent 1px)",backgroundSize:"20px 20px"}}/>
        <QrCode className="w-6 h-6 relative z-10"/>
        <span className="relative z-10">{ct.scan_btn_text}</span>
        <ChevronRight className="w-5 h-5 relative z-10"/>
      </motion.button>

      <BannerSlot position="user_infeed"/>
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.12}}
        className="rounded-2xl p-3 flex items-center gap-3"
        style={{background:"rgba(232,184,32,0.06)",border:`1px solid rgba(232,184,32,0.2)`}}>
        <span className="text-2xl">📅</span>
        <div>
          <p className="text-sm font-black text-white">{ct.daily_limit_title}</p>
          <p className="text-xs" style={{color:R.textMuted}}>{ct.daily_limit_sub}</p>
        </div>
      </motion.div>

      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.15}}
        className="rounded-2xl p-4" style={{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,border:`1px solid ${R.border}`}}>
        <p className="text-xs font-black mb-3" style={{color:R.gold}}>วิธีรับโค้ดลุ้นโชค</p>
        <div className="space-y-3">
          {(()=>{try{const p=JSON.parse(ct.how_to_steps||"[]");return Array.isArray(p)?p.filter(Boolean).map((s:any)=>({n:s.n??s.step??1,e:s.e??s.emoji??"✨",t:s.t??s.title??"",d:s.d??s.sub??""})):[];}catch{return [];}})().map(s=>(
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5"
                style={{background:`linear-gradient(135deg,${R.goldDark},${R.gold})`,color:"#3d1f00"}}>{s.n}</div>
              <span className="text-xl flex-shrink-0 mt-0.5">{s.e}</span>
              <div>
                <p className="text-sm font-black text-white">{s.t}</p>
                <p className="text-xs mt-0.5" style={{color:R.textMuted}}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {campaign&&campaign.prizes.length>0&&(
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.2}}
          className="rounded-2xl p-4" style={{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,border:`1px solid ${R.border}`}}>
          <p className="text-xs font-black mb-3" style={{color:R.gold}}>{ct.prize_section_title}</p>
          {campaign.prizes.slice(0,3).map((p,i)=>(
            <div key={p.id} className="flex items-center justify-between mb-1.5 last:mb-0">
              <div className="flex items-center gap-2">
                <span>{["🥇","🥈","🥉"][i]}</span>
                <span className="text-sm font-semibold" style={{color:R.textSub}}>{p.name}</span>
              </div>
              <span className="text-sm font-black" style={{color:R.gold}}>฿{p.value.toLocaleString()}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ═══ SCAN TAB — QR + GPS + COLLECT ═══ */
const GPS_RADIUS_M = 20;

function ScanTab({autoMerchantPhone}:{autoMerchantPhone?:string}){
  const [phase,setPhase]=useState<CollectPhase>("idle");
  const [camErr,setCamErr]=useState("");
  const [gpsStatus,setGpsStatus]=useState<"checking"|"ok"|"fail"|"no_gps">("checking");
  const [gpsMsg,setGpsMsg]=useState("");
  const [distanceM,setDistanceM]=useState<number|null>(null);
  const [merchantPhone,setMerchantPhone]=useState(autoMerchantPhone||"");
  const [merchantName,setMerchantName]=useState("");
  const [merchantLat,setMerchantLat]=useState<number|null>(null);
  const [merchantLng,setMerchantLng]=useState<number|null>(null);
  const [custName,setCustName]=useState("");
  const [custPhone,setCustPhone]=useState("");
  const [formErr,setFormErr]=useState("");
  const [collectResult,setCollectResult]=useState<{code:string;campaignName:string;remainingToday:number;todayUsed:number}|null>(null);
  const [collectErr,setCollectErr]=useState("");
  const [confetti,setConfetti]=useState(false);
  const [copied,setCopied]=useState(false);
  const [todayCount,setTodayCount]=useState(0);
  const [userGps,setUserGps]=useState<{lat:number;lng:number}|null>(null);

  const vidRef=useRef<HTMLVideoElement>(null);
  const cvRef=useRef<HTMLCanvasElement>(null);
  const stmRef=useRef<MediaStream|null>(null);
  const rafRef=useRef<number>(0);
  const scanned=useRef(false);

  const stopCam=useCallback(()=>{
    cancelAnimationFrame(rafRef.current);
    stmRef.current?.getTracks().forEach(t=>t.stop());
    stmRef.current=null; scanned.current=false;
  },[]);

  const checkGPS=useCallback(async(mLat:number|null,mLng:number|null)=>{
    setPhase("gps"); setGpsStatus("checking"); setGpsMsg("กำลังตรวจสอบตำแหน่ง GPS...");
    if(mLat===null||mLng===null){
      setGpsStatus("ok"); setGpsMsg(""); setPhase("form"); return;
    }
    try{
      const pos=await getCurrentPosition();
      setUserGps({lat:pos.coords.latitude,lng:pos.coords.longitude});
      const dist=Math.round(getDistanceM(pos.coords.latitude,pos.coords.longitude,mLat,mLng));
      setDistanceM(dist);
      if(dist<=GPS_RADIUS_M){
        setGpsStatus("ok"); setGpsMsg(`📍 คุณอยู่ในร้าน (${dist} ม.) ✅`);
        setTimeout(()=>setPhase("form"),800);
      } else {
        setGpsStatus("fail"); setGpsMsg(`📍 คุณอยู่ห่าง ${dist} เมตร — ต้องอยู่ในระยะ ${GPS_RADIUS_M} เมตรเท่านั้น`);
      }
    } catch(e:any){
      if(e?.message==="no_geolocation"||e?.code===1){
        setGpsStatus("no_gps"); setGpsMsg("กรุณาอนุญาต GPS ในเบราว์เซอร์เพื่อยืนยันว่าคุณอยู่ในร้าน");
      } else {
        setGpsStatus("fail"); setGpsMsg("ไม่สามารถอ่านตำแหน่ง GPS ได้ กรุณาลองใหม่");
      }
    }
  },[]);

  const verifyMerchant=useCallback(async(phone:string)=>{
    const r=await fetch(`${PHP_API}/merchant_status.php?phone=${encodeURIComponent(phone)}`);
    const d=await r.json();
    if(!r.ok){
      const msg=r.status===403?d.error:"QR ไม่ถูกต้อง หรือร้านนี้ยังไม่ได้รับการอนุมัติ";
      setCamErr(msg); setPhase("idle"); return;
    }
    setMerchantPhone(phone);
    setMerchantName(d.merchant.name);
    setMerchantLat(d.merchant.lat);
    setMerchantLng(d.merchant.lng);
    checkGPS(d.merchant.lat,d.merchant.lng);
  },[checkGPS]);

  const startCam=useCallback(async()=>{
    setCamErr(""); scanned.current=false; setPhase("scanning");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}});
      stmRef.current=stream;
      if(!vidRef.current)return;
      vidRef.current.srcObject=stream;
      await vidRef.current.play();
      if(!(window as any).jsQR){
        await new Promise<void>((res,rej)=>{
          const s=document.createElement("script");
          s.src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
          s.onload=()=>res(); s.onerror=()=>rej(); document.head.appendChild(s);
        });
      }
      const jsQR=(window as any).jsQR;
      const tick=()=>{
        if(scanned.current)return;
        const v=vidRef.current,c=cvRef.current;
        if(!v||!c||v.readyState!==v.HAVE_ENOUGH_DATA){rafRef.current=requestAnimationFrame(tick);return;}
        const ctx=c.getContext("2d");
        if(!ctx){rafRef.current=requestAnimationFrame(tick);return;}
        c.width=v.videoWidth; c.height=v.videoHeight;
        ctx.drawImage(v,0,0);
        const img=ctx.getImageData(0,0,c.width,c.height);
        const code=jsQR(img.data,img.width,img.height,{inversionAttempts:"dontInvert"});
        if(code){
          scanned.current=true; stopCam();
          const raw=code.data.trim();
          const phoneMatch=raw.match(/[?&](?:shop|m)=([\d]+)/)||raw.match(/^(\d{9,10})$/);
          const phone=phoneMatch?phoneMatch[1]:raw;
          verifyMerchant(phone);
          return;
        }
        rafRef.current=requestAnimationFrame(tick);
      };
      rafRef.current=requestAnimationFrame(tick);
    } catch(e:any){
      setCamErr(e?.name==="NotAllowedError"?"กรุณาอนุญาตกล้องในเบราว์เซอร์":"ต้องใช้ HTTPS เพื่อเปิดกล้อง");
      setPhase("idle");
    }
  },[stopCam,verifyMerchant]);

  useEffect(()=>{
    if(autoMerchantPhone){ verifyMerchant(autoMerchantPhone); } else { startCam(); }
  },[]);
  useEffect(()=>()=>{stopCam();},[stopCam]);

  const handleCollect=async()=>{
    if(!custName.trim()){setFormErr("กรุณากรอกชื่อ");return;}
    if(custPhone.replace(/\D/g,"").length<9){setFormErr("กรุณากรอกเบอร์โทร 9-10 หลัก");return;}
    setFormErr(""); setPhase("submitting"); setCollectErr("");
    try{
      // ── เรียก PHP claim.php ──
      const r=await fetch(`${PHP_API}/claim.php`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({merchantPhone,customerName:custName.trim(),customerPhone:custPhone.replace(/\D/g,""),
          customerLat:userGps?.lat,customerLng:userGps?.lng})});
      const d=await r.json();
      if(r.ok){
        // PHP ส่ง ticketCode | Next.js ส่ง code — รองรับทั้งสองแบบ
        const code=d.ticketCode||d.code||"";
        const dailyLimit=d.dailyLimit||3;
        const todayUsed=d.todayUsed||1;
        setCollectResult({
          code,
          campaignName:d.campaignName||"ปังจัง Lucky Draw",
          remainingToday:d.remainingToday??Math.max(0,dailyLimit-todayUsed),
          todayUsed,
        });
        setTodayCount(d.todayUsed||1);
        setConfetti(true); setTimeout(()=>setConfetti(false),4500);
        setPhase("result");
      } else {
        setCollectErr(d.error||"เกิดข้อผิดพลาด");
        setPhase("form");
      }
    } catch {
      setCollectErr("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setPhase("form");
    }
  };

  const reset=()=>{
    setPhase("idle"); setMerchantPhone(""); setMerchantName("");
    setMerchantLat(null); setMerchantLng(null);
    setCustName(""); setCustPhone(""); setCollectResult(null); setCollectErr("");
    setFormErr(""); setCamErr(""); setConfetti(false); setCopied(false);
    setGpsStatus("checking"); setGpsMsg(""); setDistanceM(null); setUserGps(null);
  };

  const copyCode=(code:string)=>{
    navigator.clipboard.writeText(code).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  const iStyle={background:"rgba(40,4,4,0.85)",border:`1px solid rgba(200,146,12,0.3)`,color:"#fff"};
  const DAILY_LIMIT=3;

  return(
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="px-4 space-y-3">
      {confetti&&<Confetti/>}

      {todayCount>0&&(
        <div className="flex items-center justify-center gap-2 py-2">
          {Array.from({length:DAILY_LIMIT}).map((_,i)=>(
            <div key={i} className="w-3 h-3 rounded-full" style={{background:i<todayCount?R.gold:"rgba(255,255,255,0.15)",
              boxShadow:i<todayCount?`0 0 6px ${R.gold}`:"none"}}/>
          ))}
          <span className="text-xs font-black ml-1" style={{color:R.textMuted}}>{todayCount}/{DAILY_LIMIT} ครั้งวันนี้</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── IDLE ── */}
        {phase==="idle"&&(
          <motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}} className="space-y-3">
            <div className="rounded-3xl overflow-hidden"
              style={{background:`linear-gradient(160deg,${R.bgDeep},${R.bgDark})`,border:`2px solid ${R.borderBright}`}}>
              <div className="h-1.5" style={{background:`linear-gradient(90deg,${R.goldDark},${R.gold},${R.goldLight},${R.gold},${R.goldDark})`,backgroundSize:"200% auto",animation:"shine 2.5s linear infinite"}}/>
              <div className="p-6 flex flex-col items-center gap-5">
                <motion.div animate={{scale:[1,1.06,1],boxShadow:["0 0 20px rgba(232,184,32,0.4)","0 0 40px rgba(232,184,32,0.8)","0 0 20px rgba(232,184,32,0.4)"]}}
                  transition={{duration:2,repeat:Infinity}}
                  className="w-28 h-28 rounded-3xl flex flex-col items-center justify-center gap-1"
                  style={{background:"radial-gradient(circle at 30% 30%,rgba(232,184,32,0.2),rgba(232,184,32,0.03))",border:`2px solid ${R.borderBright}`}}>
                  <QrCode className="w-12 h-12" style={{color:R.gold}}/>
                  <p className="text-xs font-black" style={{color:R.gold}}>QR</p>
                </motion.div>
                <div className="text-center">
                  <p className="font-black text-xl text-white">สแกน QR ที่ร้านค้า</p>
                  <p className="text-sm mt-1" style={{color:R.textMuted}}>สแกนป้าย Smart QR ปังจัง หน้าร้านพาร์ทเนอร์</p>
                </div>
                <div className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold"
                  style={{background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.2)"}}>
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{color:"#4ade80"}}/>
                  <span style={{color:"rgba(134,239,172,0.9)"}}>ต้องอยู่ในระยะ {GPS_RADIUS_M} เมตรจากร้าน เพื่อยืนยันตัวตน</span>
                </div>
                {camErr&&(
                  <div className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold"
                    style={{background:"rgba(253,24,3,0.1)",color:"#f87171",border:"1px solid rgba(253,24,3,0.25)"}}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/><span>{camErr}</span>
                  </div>
                )}
                <motion.button onClick={startCam} whileTap={{scale:.95}}
                  className="w-full h-14 rounded-2xl font-black text-base text-white flex items-center justify-center gap-3"
                  style={{background:"linear-gradient(135deg,#FD1803,#a00000)",boxShadow:"0 4px 24px rgba(253,24,3,0.5)"}}>
                  <QrCode className="w-5 h-5"/> เปิดกล้องสแกน QR
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SCANNING ── */}
        {phase==="scanning"&&(
          <motion.div key="scan" initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} className="space-y-3">
            <div className="rounded-2xl overflow-hidden relative" style={{border:`2px solid ${R.borderBright}`,aspectRatio:"4/3"}}>
              <video ref={vidRef} playsInline muted className="w-full h-full object-cover"/>
              <canvas ref={cvRef} className="hidden"/>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-56 h-56">
                  {[["top-0 left-0","border-t-2 border-l-2 rounded-tl-xl"],["top-0 right-0","border-t-2 border-r-2 rounded-tr-xl"],
                    ["bottom-0 left-0","border-b-2 border-l-2 rounded-bl-xl"],["bottom-0 right-0","border-b-2 border-r-2 rounded-br-xl"]].map(([pos,cls],i)=>(
                    <div key={i} className={`absolute w-8 h-8 ${pos} ${cls}`} style={{borderColor:R.gold}}/>
                  ))}
                  <motion.div animate={{top:["10%","85%","10%"]}} transition={{duration:2,repeat:Infinity,ease:"linear"}}
                    className="absolute left-2 right-2 h-0.5 rounded-full"
                    style={{background:`linear-gradient(90deg,transparent,${R.gold},${R.goldLight},${R.gold},transparent)`}}/>
                </div>
              </div>
              <div className="absolute inset-0" style={{boxShadow:"inset 0 0 80px rgba(0,0,0,0.65)"}}/>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{color:R.gold}}/>
              <p className="text-sm font-bold" style={{color:R.textSub}}>กำลังสแกน QR Code...</p>
            </div>
            <motion.button onClick={()=>{stopCam();setPhase("idle");}} whileTap={{scale:.97}}
              className="w-full h-11 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
              style={{background:"rgba(0,0,0,0.4)",border:`1px solid ${R.border}`,color:R.textMuted}}>
              <RotateCcw className="w-4 h-4"/> ยกเลิก
            </motion.button>
          </motion.div>
        )}

        {/* ── GPS CHECK ── */}
        {phase==="gps"&&(
          <motion.div key="gps" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-3">
            <div className="rounded-2xl p-3 flex items-center gap-3"
              style={{background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.35)"}}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl">✅</div>
              <div className="flex-1">
                <p className="text-xs font-bold" style={{color:"rgba(74,222,128,0.8)"}}>สแกน QR สำเร็จ!</p>
                <p className="font-black text-white text-sm">{merchantName}</p>
              </div>
            </div>
            <div className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
              style={{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,border:`1px solid ${R.border}`}}>
              <motion.div
                animate={gpsStatus==="checking"?{rotate:360}:{rotate:0}}
                transition={gpsStatus==="checking"?{duration:1.5,repeat:Infinity,ease:"linear"}:{}}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{background:gpsStatus==="ok"?"rgba(34,197,94,0.15)":gpsStatus==="fail"?"rgba(253,24,3,0.1)":"rgba(232,184,32,0.1)",
                  border:`2px solid ${gpsStatus==="ok"?"rgba(34,197,94,0.5)":gpsStatus==="fail"?"rgba(253,24,3,0.5)":"rgba(232,184,32,0.5)"}`}}>
                <Navigation className="w-7 h-7"
                  style={{color:gpsStatus==="ok"?"#4ade80":gpsStatus==="fail"?"#f87171":"#E8B820"}}/>
              </motion.div>
              {gpsStatus==="checking"&&(
                <><p className="font-black text-white">กำลังตรวจสอบตำแหน่ง...</p>
                  <p className="text-sm" style={{color:R.textMuted}}>กรุณาอนุญาต GPS เพื่อยืนยันว่าคุณอยู่ในร้าน</p>
                  <Loader2 className="w-6 h-6 animate-spin" style={{color:R.gold}}/></>
              )}
              {gpsStatus==="ok"&&(
                <><p className="font-black text-xl" style={{color:"#4ade80"}}>✅ ยืนยันตำแหน่งสำเร็จ!</p>
                  <p className="text-sm" style={{color:R.textMuted}}>{gpsMsg}</p></>
              )}
              {(gpsStatus==="fail"||gpsStatus==="no_gps")&&(
                <><p className="font-black text-lg" style={{color:"#f87171"}}>
                    {gpsStatus==="no_gps"?"⚠️ GPS ถูกปิด":"📍 อยู่นอกพื้นที่"}
                  </p>
                  <p className="text-sm" style={{color:R.textMuted}}>{gpsMsg}</p>
                  {distanceM!==null&&(
                    <div className="px-4 py-2 rounded-xl" style={{background:"rgba(253,24,3,0.1)",border:"1px solid rgba(253,24,3,0.25)"}}>
                      <p className="font-black" style={{color:"#f87171"}}>ห่าง {distanceM} เมตร</p>
                      <p className="text-xs" style={{color:R.textMuted}}>ต้องอยู่ภายใน {GPS_RADIUS_M} เมตร</p>
                    </div>
                  )}
                  <div className="flex gap-2 w-full">
                    <motion.button onClick={()=>checkGPS(merchantLat,merchantLng)} whileTap={{scale:.97}}
                      className="flex-1 h-11 rounded-2xl text-sm font-black flex items-center justify-center gap-2"
                      style={{background:"rgba(232,184,32,0.1)",border:`1px solid rgba(232,184,32,0.3)`,color:R.gold}}>
                      <Navigation className="w-4 h-4"/> ลองใหม่
                    </motion.button>
                    <motion.button onClick={reset} whileTap={{scale:.97}}
                      className="flex-1 h-11 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                      style={{background:"rgba(0,0,0,0.3)",border:`1px solid ${R.border}`,color:R.textMuted}}>
                      สแกนใหม่
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ── FORM ── */}
        {(phase==="form"||phase==="submitting")&&(
          <motion.div key="form" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-3">
            <div className="rounded-2xl p-3 flex items-center gap-3"
              style={{background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.35)"}}>
              <div className="flex-col flex-1">
                <p className="text-xs font-bold" style={{color:"rgba(74,222,128,0.8)"}}>✅ ยืนยันตำแหน่งสำเร็จ</p>
                <p className="font-black text-white text-sm">{merchantName}</p>
              </div>
              <div className="text-right text-xs" style={{color:R.textMuted}}>
                <p className="font-black" style={{color:R.gold}}>{DAILY_LIMIT-todayCount} สิทธิ์คงเหลือ</p>
                <p>วันนี้</p>
              </div>
              <button onClick={reset} className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{background:"rgba(255,255,255,0.05)",color:R.textMuted}}>✕</button>
            </div>
            <div className="rounded-2xl overflow-hidden"
              style={{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,border:`1px solid ${R.border}`}}>
              <div className="h-1" style={{background:`linear-gradient(90deg,${R.goldDark},${R.gold},${R.goldDark})`,backgroundSize:"200% auto",animation:"shine 2s linear infinite"}}/>
              <div className="p-5 space-y-4">
                <p className="font-black text-white">กรอกข้อมูลเพื่อรับโค้ดลุ้นโชค</p>
                <div>
                  <label className="text-xs font-bold block mb-1.5" style={{color:R.textMuted}}>ชื่อ-นามสกุล *</label>
                  <input value={custName} onChange={e=>{setCustName(e.target.value);setFormErr("");setCollectErr("");}}
                    placeholder="กรอกชื่อ-นามสกุล" maxLength={100} autoFocus
                    className="w-full px-4 h-12 rounded-2xl outline-none text-sm" style={iStyle}/>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1.5" style={{color:R.textMuted}}>เบอร์โทรศัพท์ *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:R.textMuted}}/>
                    <input value={custPhone} onChange={e=>{setCustPhone(e.target.value.replace(/\D/g,""));setFormErr("");setCollectErr("");}}
                      placeholder="0812345678" maxLength={10} type="tel"
                      className="w-full pl-10 pr-4 h-12 rounded-2xl outline-none text-sm" style={iStyle}/>
                  </div>
                </div>
                {(formErr||collectErr)&&(
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold"
                    style={{background:"rgba(253,24,3,0.1)",color:"#f87171",border:"1px solid rgba(253,24,3,0.25)"}}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0"/>{formErr||collectErr}
                  </div>
                )}
                <motion.button onClick={handleCollect} disabled={phase==="submitting"} whileTap={{scale:.97}}
                  className="w-full h-14 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-2"
                  style={{background:phase==="submitting"?"rgba(232,184,32,0.3)":"linear-gradient(135deg,#FD1803,#a00000)",
                    boxShadow:phase==="submitting"?"none":"0 4px 24px rgba(253,24,3,0.5)"}}>
                  {phase==="submitting"?<><Loader2 className="w-5 h-5 animate-spin"/> กำลังรับโค้ด...</>:"🎫 รับโค้ดลุ้นโชคเลย!"}
                </motion.button>
                <p className="text-xs text-center" style={{color:R.textMuted}}>
                  สิทธิ์คงเหลือวันนี้: {DAILY_LIMIT-todayCount}/{DAILY_LIMIT} ครั้ง
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {phase==="result"&&collectResult&&(
          <motion.div key="result" initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} className="space-y-3">
            <div className="rounded-3xl overflow-hidden flex flex-col items-center py-5 relative"
              style={{background:`linear-gradient(160deg,${R.bgDeep},${R.bgDark})`,border:`2px solid ${R.borderBright}`}}>
              <div className="h-1.5 absolute top-0 left-0 right-0" style={{background:`linear-gradient(90deg,${R.goldDark},${R.gold},${R.goldLight},${R.gold},${R.goldDark})`,backgroundSize:"200% auto",animation:"shine 2.5s linear infinite"}}/>
              <div className="mb-3 px-4 py-1 rounded-full text-xs font-black" style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",color:"#4ade80"}}>
                🏪 {merchantName}
              </div>

              <motion.div animate={{scale:[1,1.08,1],rotate:[0,5,-5,0]}} transition={{duration:.6,delay:.1}}>
                <p className="text-6xl mb-3">🎉</p>
              </motion.div>

              <div className="w-full px-5 space-y-3">
                {/* Code card */}
                <div className="rounded-2xl p-5 text-center"
                  style={{background:"rgba(253,24,3,0.08)",border:`2px solid ${R.borderBright}`,boxShadow:`0 0 30px rgba(232,184,32,0.15)`}}>
                  <p className="text-sm font-black mb-2" style={{color:R.textMuted}}>🎫 โค้ดลุ้นโชคใหญ่ของคุณ</p>
                  <p className="font-black text-3xl tracking-[0.2em] mb-1" style={{color:R.gold,textShadow:`0 0 20px ${R.gold}`}}>
                    {collectResult.code}
                  </p>
                  <p className="text-xs mb-4" style={{color:R.textMuted}}>{collectResult.campaignName}</p>
                  <motion.button onClick={()=>copyCode(collectResult.code)} whileTap={{scale:.95}}
                    className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-2xl text-sm font-black"
                    style={{background:copied?"rgba(34,197,94,0.15)":"rgba(232,184,32,0.12)",
                      border:copied?"1px solid rgba(34,197,94,0.4)":`1px solid rgba(232,184,32,0.35)`,
                      color:copied?"#4ade80":R.gold}}>
                    {copied?<><Check className="w-4 h-4"/>คัดลอกแล้ว!</>:<><Copy className="w-4 h-4"/>คัดลอกรหัส</>}
                  </motion.button>
                  <p className="text-xs mt-3 font-bold" style={{color:"rgba(253,24,3,0.8)"}}>
                    ⚠️ ดูรหัสได้ที่แท็บ ตรวจสอบ → กรอกเบอร์โทร
                  </p>
                </div>

                {/* Daily progress */}
                <div className="flex items-center justify-center gap-2 py-1">
                  {Array.from({length:DAILY_LIMIT}).map((_,i)=>(
                    <div key={i} className="w-3 h-3 rounded-full" style={{background:i<collectResult.todayUsed?R.gold:"rgba(255,255,255,0.15)",
                      boxShadow:i<collectResult.todayUsed?`0 0 6px ${R.gold}`:"none"}}/>
                  ))}
                  <span className="text-xs font-black ml-1" style={{color:R.textMuted}}>
                    เหลือ {collectResult.remainingToday} สิทธิ์วันนี้
                  </span>
                </div>

                {collectResult.remainingToday>0?(
                  <motion.button onClick={reset} whileTap={{scale:.97}}
                    className="w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                    style={{background:`linear-gradient(90deg,${R.goldDark},${R.gold})`,color:"#3d1f00"}}>
                    <QrCode className="w-4 h-4"/> สแกนร้านอื่น ({collectResult.remainingToday} สิทธิ์คงเหลือ)
                  </motion.button>
                ):(
                  <div className="rounded-2xl p-3 text-center"
                    style={{background:"rgba(0,0,0,0.3)",border:`1px solid ${R.border}`}}>
                    <p className="font-black text-white text-sm">🌟 ใช้สิทธิ์ครบ 3 ครั้งแล้ววันนี้</p>
                    <p className="text-xs mt-1" style={{color:R.textMuted}}>มาใหม่พรุ่งนี้ได้เลย!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══ CHECK TAB ═══ */
function CheckTab(){
  const [phone,setPhone]=useState("");
  const [loading,setLoading]=useState(false);
  const [codes,setCodes]=useState<CodeHistory[]|null>(null);
  const [todayCount,setTodayCount]=useState(0);
  const [err,setErr]=useState("");

  const search=async()=>{
    const clean=phone.replace(/\D/g,"");
    if(clean.length<9){setErr("กรุณากรอกเบอร์โทร 9-10 หลัก");return;}
    setErr(""); setLoading(true);
    try{
    const r=await fetch(`${PHP_API}/mycodes.php?phone=${clean}`);
      const d=await r.json();
      if(r.ok){setCodes(d.codes||[]);setTodayCount(d.todayCount||0);}
      else setErr(d.error||"เกิดข้อผิดพลาด");
    } catch{setErr("เกิดข้อผิดพลาด");}
    finally{setLoading(false);}
  };

  return(
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="px-4 space-y-3">
      <div className="rounded-2xl overflow-hidden" style={{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,border:`1px solid ${R.border}`}}>
        <div className="h-1" style={{background:`linear-gradient(90deg,${R.goldDark},${R.gold},${R.goldDark})`,backgroundSize:"200% auto",animation:"shine 2s linear infinite"}}/>
        <div className="p-5">
          <p className="font-black text-white mb-1">ตรวจสอบโค้ดสะสม</p>
          <p className="text-xs mb-4" style={{color:R.textMuted}}>ดูรหัสลุ้นโชคและสถานะรางวัลทั้งหมด</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:R.textMuted}}/>
              <input value={phone} onChange={e=>{setPhone(e.target.value.replace(/\D/g,""));setErr("");}}
                onKeyDown={e=>e.key==="Enter"&&search()}
                placeholder="กรอกเบอร์โทรของคุณ" maxLength={10} type="tel"
                className="w-full pl-10 pr-4 h-12 rounded-2xl outline-none text-sm"
                style={{background:"rgba(40,4,4,0.85)",border:`1px solid rgba(200,146,12,0.3)`,color:"#fff"}}/>
            </div>
            <motion.button onClick={search} disabled={loading} whileTap={{scale:.97}}
              className="h-12 px-5 rounded-2xl font-black text-sm text-white flex items-center gap-2"
              style={{background:"linear-gradient(135deg,#FD1803,#7a0000)"}}>
              {loading?<Loader2 className="w-4 h-4 animate-spin"/>:"ค้นหา"}
            </motion.button>
          </div>
          {err&&<p className="text-xs mt-2 font-bold" style={{color:"#f87171"}}>{err}</p>}
        </div>
      </div>

      <AnimatePresence>
        {codes!==null&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-2">
            {/* Today progress */}
            {codes.length>0&&(
              <div className="rounded-2xl p-3 flex items-center gap-3"
                style={{background:"rgba(232,184,32,0.06)",border:`1px solid rgba(232,184,32,0.2)`}}>
                <span className="text-lg">📅</span>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    {Array.from({length:3}).map((_,i)=>(
                      <div key={i} className="w-3 h-3 rounded-full" style={{background:i<todayCount?R.gold:"rgba(255,255,255,0.15)"}}/>
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{color:R.textMuted}}>วันนี้เก็บแล้ว {todayCount}/3 ครั้ง</p>
                </div>
              </div>
            )}
            {codes.length===0?(
              <div className="rounded-2xl p-8 text-center" style={{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,border:`1px solid ${R.border}`}}>
                <Gift className="w-12 h-12 mx-auto mb-3" style={{color:R.textMuted}}/>
                <p className="font-bold text-white">ยังไม่มีโค้ด</p>
                <p className="text-sm mt-1" style={{color:R.textMuted}}>ไปสแกน QR ที่ร้านพาร์ทเนอร์เพื่อรับโค้ดลุ้นโชค</p>
              </div>
            ):(
              <>
                <p className="text-xs font-bold" style={{color:R.textMuted}}>พบ {codes.length} โค้ด</p>
                {codes.map((c,i)=>(
                  <motion.div key={c.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}
                    className="rounded-2xl overflow-hidden"
                    style={{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,
                      border:c.isWinner?`2px solid ${R.borderBright}`:`1px solid ${R.border}`}}>
                    {c.isWinner&&<div className="h-0.5" style={{background:`linear-gradient(90deg,${R.goldDark},${R.gold},${R.goldDark})`}}/>}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{background:c.isWinner?"rgba(232,184,32,0.1)":"rgba(0,0,0,0.3)"}}>
                          {c.isWinner?"🏆":"🎫"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-lg tracking-widest" style={{color:R.gold}}>{c.code}</p>
                          <p className="text-xs mt-0.5" style={{color:R.textMuted}}>🏪 {c.merchantName}</p>
                          <p className="text-xs" style={{color:R.textMuted}}>
                            {new Date(c.collectedAt).toLocaleDateString("th-TH",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                          </p>
                        </div>
                        <div className="text-right">
                          {c.isWinner
                            ?<span className="text-xs font-black px-2 py-1 rounded-xl"
                                style={{background:"rgba(232,184,32,0.1)",border:`1px solid ${R.gold}`,color:R.gold}}>
                                {c.claimStatus==="claimed"?"✅ รับแล้ว":"🏆 ได้รางวัล!"}
                              </span>
                            :<span className="text-xs" style={{color:R.textMuted}}>รอลุ้น 🎲</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══ PRIZES TAB ═══ */
function PrizesTab({campaign}:{campaign:Campaign|null}){
  return(
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="px-4 space-y-3">
      <div className="rounded-2xl overflow-hidden" style={{background:`linear-gradient(160deg,${R.bgDeep},${R.bgDark})`,border:`2px solid ${R.borderBright}`}}>
        <div className="h-1.5" style={{background:`linear-gradient(90deg,${R.goldDark},${R.gold},${R.goldLight},${R.gold},${R.goldDark})`,backgroundSize:"200% auto",animation:"shine 2.5s linear infinite"}}/>
        <div className="p-5 text-center">
          <motion.div animate={{y:[0,-6,0]}} transition={{duration:2.5,repeat:Infinity}} className="text-5xl mb-3">🏆</motion.div>
          <h2 className="text-lg font-black" style={{color:R.gold}}>รางวัลโชคใหญ่</h2>
          {campaign&&<p className="text-xs mt-1" style={{color:R.textMuted}}>มูลค่ารวม ฿{campaign.totalBudget.toLocaleString()}</p>}
        </div>
      </div>
      {campaign?.prizes.map((p,i)=>(
        <motion.div key={p.id} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:i*.07,type:"spring",stiffness:260}}
          className="rounded-2xl p-4 flex items-center gap-4"
          style={i===0?{background:`linear-gradient(135deg,rgba(232,184,32,0.07),${R.bgDark})`,border:`2px solid ${R.borderBright}`}
                      :{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,border:`1px solid ${R.border}`}}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{background:i===0?"rgba(232,184,32,0.1)":"rgba(0,0,0,0.3)"}}>{["🥇","🥈","🥉","🎁","🎀"][i]||"🎁"}</div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm" style={{color:i===0?R.gold:R.textSub}}>{p.name}</p>
            <p className="text-xs mt-0.5" style={{color:R.textMuted}}>เหลือ {p.remaining}/{p.quantity}</p>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{background:"rgba(0,0,0,0.3)"}}>
              <motion.div initial={{width:0}} animate={{width:`${((p.quantity-p.remaining)/Math.max(p.quantity,1))*100}%`}}
                transition={{delay:i*.1,duration:.8}} className="h-full rounded-full"
                style={{background:p.remaining===0?"#4b5563":i===0?`linear-gradient(90deg,${R.goldDark},${R.gold})`:"linear-gradient(90deg,#FD1803,#b01000)"}}/>
            </div>
          </div>
          <p className="font-black text-sm flex-shrink-0" style={{color:R.gold}}>฿{p.value.toLocaleString()}</p>
        </motion.div>
      ))}
      {/* How to collect */}
      <div className="rounded-2xl p-4" style={{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,border:`1px solid ${R.border}`}}>
        <p className="text-xs font-black mb-3" style={{color:R.gold}}>🎫 วิธีสะสมโค้ดลุ้นโชค</p>
        {[{e:"📍",l:"อยู่ในระยะ 20ม. จากร้านพาร์ทเนอร์"},{e:"📱",l:"สแกน QR → กรอกชื่อ + เบอร์"},{e:"🎫",l:"ได้โค้ด 1 ใบ / 1 ร้าน / วัน สูงสุด 3 ร้าน"},{e:"🏆",l:"แอดมินจับรางวัล ตรวจผลที่แท็บ ตรวจสอบ"}].map((s,i)=>(
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl mb-2 last:mb-0" style={{background:"rgba(0,0,0,0.25)"}}>
            <span className="text-2xl">{s.e}</span>
            <p className="text-sm font-bold text-white flex-1">{s.l}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══ PAGE ═══ */
function PageInner(){
  const [tab,setTab]=useState<"home"|"scan"|"check"|"prizes"|"more">("home");
  const [campaign,setCampaign]=useState<Campaign|null>(null);
  const [autoPhone,setAutoPhone]=useState<string|undefined>();
  const searchParams=useSearchParams();

  useEffect(()=>{
    fetch(`${PHP_API}/campaign.php`).then(r=>r.json()).then(d=>{if(d.campaign)setCampaign(d.campaign);});
    const tabParam=searchParams.get("tab");
    if(tabParam==="scan") setTab("scan");
    const shopParam=searchParams.get("shop")||searchParams.get("m");
    if(shopParam){ setAutoPhone(shopParam); setTab("scan"); }
    const qrPhone=sessionStorage.getItem("qr_merchant_phone");
    if(qrPhone){ setAutoPhone(qrPhone); sessionStorage.removeItem("qr_merchant_phone"); setTab("scan"); }
  },[]);

  const ct=useSiteContent();
  const NAV=[{key:"home",icon:<Home className="w-[26px] h-[26px]"/>,label:ct.nav_home||"หน้าหลัก"},
             {key:"prizes",icon:<Trophy className="w-[26px] h-[26px]"/>,label:ct.nav_prizes||"รางวัล"}];
  const NAV2=[{key:"check",icon:<History className="w-[26px] h-[26px]"/>,label:ct.nav_check||"ตรวจสอบ"},
              {key:"more",icon:<MoreHorizontal className="w-[26px] h-[26px]"/>,label:ct.nav_more||"อื่นๆ"}];

  const navBtn=(t:{key:string;icon:React.ReactNode;label:string})=>{
    const active=tab===t.key;
    return(
      <motion.button key={t.key} onClick={()=>setTab(t.key as any)} whileTap={{scale:.82}}
        className="flex-1 flex flex-col items-center gap-1 pb-1">
        <motion.div animate={{color:active?R.gold:"rgba(255,255,255,0.75)",scale:active?1.15:1}} transition={{duration:.15}}
          className="flex items-center justify-center" style={{width:28,height:28}}>{t.icon}</motion.div>
        <motion.span animate={{color:active?R.gold:"rgba(255,255,255,0.75)"}} transition={{duration:0}}
          className="font-black" style={{fontSize:12}}>{t.label}</motion.span>
        <AnimatePresence>
          {active&&(
            <motion.div layoutId="nav-dot" initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}
              className="w-5 h-0.5 rounded-full"
              style={{background:`linear-gradient(90deg,${R.goldDark},${R.gold},${R.goldDark})`}}/>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return(
    <div className="min-h-screen max-w-md mx-auto relative"
      style={{background:`linear-gradient(160deg,${R.bgDeep} 0%,${R.bg} 50%,${R.bgDark} 100%)`,minHeight:"100dvh"}}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{background:`linear-gradient(135deg,${R.bgDeep},${R.bgDark})`,borderBottom:`1px solid ${R.border}`}}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
            style={{background:"linear-gradient(135deg,#FD1803,#7a0000)",boxShadow:"0 2px 10px rgba(253,24,3,0.5)"}}>ป</div>
          <div>
            <p className="font-black text-sm text-white leading-none">{ct.app_name}</p>
            <p className="text-xs leading-none mt-0.5" style={{color:R.textMuted}}>{ct.app_subtitle}</p>
          </div>
        </div>
        <motion.button onClick={()=>window.location.href="/map"} whileTap={{scale:.95}}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl mr-1"
          style={{background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",color:"#4ade80"}}>
          <MapPin className="w-3.5 h-3.5"/>
          <span className="text-xs font-black">แผนที่</span>
        </motion.button>
        <motion.button onClick={()=>window.location.href="/merchant"} whileTap={{scale:.95}}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.35)",color:"#60a5fa"}}>
          <Store className="w-3.5 h-3.5"/>
          <span className="text-xs font-black">ร้านค้า</span>
        </motion.button>
      </div>

      {/* Global banner slots — popup, sticky, interstitial */}
      <BannerSlot position="user_popup"/>
      <BannerSlot position="user_interstitial"/>
      <BannerSlot position="user_sticky"/>

      {/* Content */}
      <div className="pb-32 pt-3 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab==="home"   &&<HomeTab   key="home"   campaign={campaign} onScan={()=>setTab("scan")} ct={ct}/>}
          {tab==="scan"   &&<ScanTab   key="scan"   autoMerchantPhone={autoPhone}/>}
          {tab==="check"  &&<CheckTab  key="check"/>}
          {tab==="prizes" &&<PrizesTab key="prizes" campaign={campaign}/>}
          {tab==="more"   &&(
            <motion.div key="more" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="px-4 space-y-3 pt-2">
              <motion.button onClick={()=>window.location.href="/map"} whileTap={{scale:.97}}
                className="w-full h-16 rounded-2xl flex items-center gap-4 px-5"
                style={{background:"linear-gradient(135deg,rgba(20,100,40,0.6),rgba(10,50,20,0.8))",border:"1px solid rgba(63,185,80,0.4)"}}>
                <MapPin className="w-6 h-6 text-green-400"/>
                <div className="text-left flex-1">
                  <p className="font-black text-white">แผนที่ร้านค้า</p>
                  <p className="text-xs" style={{color:"rgba(134,239,172,0.7)"}}>ดูร้านพาร์ทเนอร์บนแผนที่</p>
                </div>
                <ChevronRight className="w-4 h-4 text-green-400"/>
              </motion.button>
              <motion.button onClick={()=>window.location.href="/gallery"} whileTap={{scale:.97}}
                className="w-full h-16 rounded-2xl flex items-center gap-4 px-5"
                style={{background:"linear-gradient(135deg,rgba(100,30,10,0.6),rgba(50,10,5,0.8))",border:"1px solid rgba(253,100,50,0.3)"}}>
                <span className="text-xl">📷</span>
                <div className="text-left flex-1">
                  <p className="font-black text-white">คลังภาพ</p>
                  <p className="text-xs" style={{color:"rgba(253,180,150,0.7)"}}>ดู / อัปโหลดภาพร้านค้า</p>
                </div>
                <ChevronRight className="w-4 h-4" style={{color:"rgba(253,100,50,0.7)"}}/>
              </motion.button>
              <motion.button onClick={()=>window.location.href="/merchant"} whileTap={{scale:.97}}
                className="w-full h-16 rounded-2xl flex items-center gap-4 px-5"
                style={{background:"linear-gradient(135deg,rgba(30,58,138,0.6),rgba(15,25,60,0.8))",border:"1px solid rgba(59,130,246,0.4)"}}>
                <Store className="w-6 h-6 text-blue-400"/>
                <div className="text-left flex-1">
                  <p className="font-black text-white">พอร์ทัลร้านค้า</p>
                  <p className="text-xs" style={{color:"rgba(147,197,253,0.7)"}}>สมัคร / ส่งใบเสร็จ / Smart QR</p>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-400"/>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navbar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
        <svg viewBox="0 0 400 84" className="w-full absolute bottom-0 left-0" style={{height:84}} preserveAspectRatio="none">
          <defs>
            <linearGradient id="navbg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a0202"/><stop offset="100%" stopColor="#1a0000"/>
            </linearGradient>
          </defs>
          <path d="M0,0 L140,0 Q155,0 161,14 Q174,50 200,50 Q226,50 239,14 Q245,0 260,0 L400,0 L400,84 L0,84 Z" fill="url(#navbg)"/>
          <path d="M0,0 L140,0 Q155,0 161,14 Q174,50 200,50 Q226,50 239,14 Q245,0 260,0 L400,0" fill="none" stroke="rgba(200,146,12,0.45)" strokeWidth="1.5"/>
        </svg>
        <div className="relative flex items-end px-1" style={{height:84,paddingBottom:"max(12px,env(safe-area-inset-bottom))"}}>
          {NAV.map(navBtn)}
          <div className="flex flex-col items-center" style={{width:88,paddingBottom:2,marginTop:-32}}>
            <motion.button onClick={()=>setTab("scan")} whileHover={{scale:1.06}} whileTap={{scale:.88}}
              animate={{boxShadow:tab==="scan"
                ?["0 4px 20px rgba(232,184,32,0.65)","0 4px 40px rgba(232,184,32,1)","0 4px 20px rgba(232,184,32,0.65)"]
                :["0 4px 16px rgba(232,184,32,0.4)","0 4px 28px rgba(232,184,32,0.7)","0 4px 16px rgba(232,184,32,0.4)"]}}
              transition={{duration:1.8,repeat:Infinity}}
              className="relative flex items-center justify-center rounded-full"
              style={{width:72,height:72,background:`linear-gradient(135deg,${R.goldDark},${R.gold},${R.goldLight})`}}>
              <div className="absolute inset-2 rounded-full" style={{border:"2px solid rgba(255,255,255,0.4)"}}/>
              <QrCode className="w-8 h-8 relative z-10" style={{color:"#3d1f00"}}/>
            </motion.button>
            <span className="font-black mt-1" style={{color:tab==="scan"?R.gold:"rgba(255,255,255,0.75)",fontSize:12}}>{ct.nav_scan||"รหัสชิง"}</span>
          </div>
          {NAV2.map(navBtn)}
        </div>
      </div>
    </div>
  );
}

export default function Page(){
  return <Suspense fallback={null}><PageInner/></Suspense>;
}
