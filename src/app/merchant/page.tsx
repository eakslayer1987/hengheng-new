"use client";
import { BannerSlot } from "@/components/BannerSlot";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Store, CheckCircle, Clock, XCircle, Loader2,
  Camera, Download, Share2, MapPin, Navigation, AlertCircle,
  RefreshCw, Package, Upload, Shield, Key, RotateCcw, Edit3,
  BarChart2, History, Settings, Save, FileText, Gift, Star,
  ChevronRight, Award, Home, ClipboardList, User
} from "lucide-react";

/* ─── PHP API URL ─── */
const PHP_API = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PHP_API_URL)
  || "https://xn--72ca9ib1gc.xn--72cac8e8ec.com/hengheng/api";

/* ─── Theme (Dark Red/Gold — ธีมเดิม) ─── */
const R = {
  bg:"#0a1628", bgCard:"rgba(15,25,50,0.9)", bgDark:"#060e1c",
  primary:"#FD1803",
  gold:"#E8B820", goldLight:"#F5D78E", goldDark:"#A67208",
  border:"rgba(232,184,32,0.2)", borderBright:"rgba(232,184,32,0.5)",
  text:"#fff", sub:"rgba(200,220,255,0.7)", muted:"rgba(150,170,210,0.45)",
  green:"#4ade80", red:"#f87171", blue:"#60a5fa", lineGreen:"#00B900",
  cardBorder:"rgba(232,184,32,0.15)",
};

/* ─── Types ─── */
type MerchantInfo = {
  id:number; name:string; ownerName:string; phone:string;
  lat:number|null; lng:number|null; status:string; address?:string;
  lineDisplayName?:string; lineAvatarUrl?:string;
};
type QuotaInfo = { total:number; used:number; remaining:number };
type Receipt = { id:number; imageUrl:string; bagCount:number; status:string; submittedAt:string; quota?:{totalCodes:number;usedCodes:number} };
type ScanRecord = { id:number; code:string; customerName:string; customerPhone:string; collectedAt:string; isWinner:boolean; claimStatus:string };
type DayChart = { date:string; label:string; count:number };

const STATUS_MAP: Record<string,{label:string;color:string;icon:React.ReactNode}> = {
  pending:  {label:"รอตรวจสอบ",  color:R.gold,  icon:<Clock size={12}/>},
  approved: {label:"อนุมัติแล้ว", color:R.green, icon:<CheckCircle size={12}/>},
  rejected: {label:"ไม่อนุมัติ", color:R.red,   icon:<XCircle size={12}/>},
};

function getGPS():Promise<{lat:number;lng:number}>{
  return new Promise((res,rej)=>{
    if(!navigator.geolocation){rej(new Error("no_geo"));return;}
    navigator.geolocation.getCurrentPosition(
      p=>res({lat:p.coords.latitude,lng:p.coords.longitude}),
      e=>rej(e),{enableHighAccuracy:true,timeout:12000,maximumAge:0}
    );
  });
}

/* ─── GPS Button ─── */
function GPSButton({gpsState,gpsCoords,onCapture}:{gpsState:"idle"|"loading"|"ok"|"fail";gpsCoords:{lat:number;lng:number}|null;onCapture:()=>void}){
  if(gpsState==="ok"&&gpsCoords) return(
    <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
      <MapPin size={14} style={{color:R.green,flexShrink:0}}/>
      <div style={{flex:1}}>
        <p style={{fontSize:11,fontWeight:700,color:R.green,margin:0}}>บันทึก GPS สำเร็จ ✅</p>
        <p style={{fontSize:10,fontFamily:"monospace",color:R.muted,margin:0}}>{gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}</p>
      </div>
      <button onClick={onCapture} style={{fontSize:10,fontWeight:600,color:R.muted,background:"rgba(255,255,255,0.05)",border:`1px solid ${R.border}`,borderRadius:6,padding:"3px 8px",cursor:"pointer"}}>รีเซ็ต</button>
    </div>
  );
  return(
    <button onClick={onCapture} disabled={gpsState==="loading"}
      style={{width:"100%",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",color:gpsState==="fail"?R.red:R.green}}>
      {gpsState==="loading"
        ?<><Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/><span style={{fontSize:12,fontWeight:700}}>กำลังอ่าน GPS...</span></>
        :<><Navigation size={14}/><span style={{fontSize:12,fontWeight:700}}>{gpsState==="fail"?"ไม่สำเร็จ กดลองใหม่":"บันทึกตำแหน่งร้านตอนนี้ 📍"}</span></>}
    </button>
  );
}

/* ─── Smart QR ─── */
function SmartQR({phone,name,appUrl}:{phone:string;name:string;appUrl:string}){
  const [qrUrl,setQrUrl]=useState("");
  useEffect(()=>{
    (async()=>{
      try{
        const QRCode=(await import("qrcode")).default;
        const scanUrl=`${appUrl}/api/scan?m=${phone}`;
        const url=await QRCode.toDataURL(scanUrl,{width:300,margin:2,color:{dark:"#1a0000",light:"#FFF9E6"},errorCorrectionLevel:"H"});
        setQrUrl(url);
      }catch{}
    })();
  },[phone,appUrl]);
  const download=()=>{const a=document.createElement("a");a.href=qrUrl;a.download=`SmartQR_${name}_${phone}.png`;a.click();};
  const share=async()=>{
    if(!navigator.share||!qrUrl)return;
    const res=await fetch(qrUrl);const blob=await res.blob();
    const file=new File([blob],`QR_${name}.png`,{type:"image/png"});
    navigator.share({files:[file],title:`Smart QR ร้าน ${name}`}).catch(()=>{});
  };
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
      <div style={{textAlign:"center"}}>
        <p style={{fontSize:13,fontWeight:700,color:R.gold,margin:"0 0 4px"}}>📲 Smart QR Code ประจำร้าน</p>
        <p style={{fontSize:11,color:R.muted,margin:0}}>ลูกค้าสแกนเพื่อรับสิทธิ์ลุ้นโชค</p>
      </div>
      <div style={{background:"linear-gradient(135deg,#FFF9E6,#FFF3CC)",border:`4px solid ${R.gold}`,borderRadius:24,padding:16,boxShadow:`0 0 40px rgba(232,184,32,0.3)`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#FD1803,#7a0000)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🐻</div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:"#3d1f00",margin:0}}>ปังจัง Lucky Draw</p>
            <p style={{fontSize:9,fontWeight:700,color:"#7a4000",margin:0}}>MEEPRUNG PARTNER</p>
          </div>
        </div>
        {qrUrl
          ?<img src={qrUrl} alt="QR" style={{width:200,height:200,borderRadius:12,display:"block"}}/>
          :<div style={{width:200,height:200,background:"rgba(0,0,0,0.04)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Loader2 size={28} style={{color:R.goldDark,animation:"spin 1s linear infinite"}}/></div>}
        <div style={{marginTop:10,textAlign:"center"}}>
          <p style={{fontSize:13,fontWeight:700,color:"#3d1f00",margin:0}}>{name}</p>
          <p style={{fontSize:11,fontFamily:"monospace",color:"#7a4000",margin:0}}>{phone}</p>
        </div>
      </div>
      <div style={{display:"flex",gap:10,width:"100%"}}>
        <button onClick={download} disabled={!qrUrl}
          style={{flex:1,background:`linear-gradient(135deg,${R.goldDark},${R.gold})`,border:"none",borderRadius:12,padding:"10px 0",fontSize:13,fontWeight:700,color:"#3d1f00",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <Download size={14}/> บันทึก PNG
        </button>
        {typeof navigator!=="undefined"&&"share" in navigator&&(
          <button onClick={share} disabled={!qrUrl}
            style={{flex:1,background:"rgba(232,184,32,0.1)",border:`1px solid ${R.borderBright}`,borderRadius:12,padding:"10px 0",fontSize:13,fontWeight:700,color:R.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Share2 size={14}/> แชร์
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Register Flow ─── */
type RegMode="choose"|"line_loading"|"phone_otp"|"otp_sent"|"form";
function RegisterFlow({prefilledPhone,onBack,onSuccess}:{prefilledPhone?:string;onBack:()=>void;onSuccess:(m:any)=>void}){
  const [mode,setMode]=useState<RegMode>(prefilledPhone?"phone_otp":"choose");
  const [phone,setPhone]=useState(prefilledPhone||"");
  const [otp,setOtp]=useState(""); const [otpTimer,setOtpTimer]=useState(0);
  const [otpVerified,setOtpVerified]=useState(false);
  const [lineProfile,setLineProfile]=useState<{lineUserId:string;displayName:string;pictureUrl?:string}|null>(null);
  const [regName,setRegName]=useState(""); const [regOwner,setRegOwner]=useState("");
  const [regAddr,setRegAddr]=useState("");
  const [gpsState,setGpsState]=useState<"idle"|"loading"|"ok"|"fail">("idle");
  const [gpsCoords,setGpsCoords]=useState<{lat:number;lng:number}|null>(null);
  const [loading,setLoading]=useState(false); const [err,setErr]=useState("");
  const [devOtp,setDevOtp]=useState("");
  useEffect(()=>{if(otpTimer<=0)return;const t=setInterval(()=>setOtpTimer(p=>p-1),1000);return()=>clearInterval(t);},[otpTimer]);
  const captureGPS=async()=>{setGpsState("loading");try{const c=await getGPS();setGpsCoords(c);setGpsState("ok");}catch{setGpsState("fail");}};
  const sendOTP=async()=>{
    const cleanPhone=phone.replace(/\D/g,"");
    if(cleanPhone.length<9){setErr("เบอร์โทรไม่ถูกต้อง");return;}
    setErr("");setLoading(true);
    try{const r=await fetch(`${PHP_API}/otp.php`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"send",phone:cleanPhone})});
      const d=await r.json();
      if(r.ok){setMode("otp_sent");setOtpTimer(60);if(d.devOtp)setDevOtp(d.devOtp);}else setErr(d.error||"ส่ง OTP ไม่สำเร็จ");
    }catch{setErr("เกิดข้อผิดพลาด");}finally{setLoading(false);}
  };
  const verifyOTP=async()=>{
    if(otp.length<6){setErr("กรุณากรอก OTP 6 หลัก");return;}
    setErr("");setLoading(true);
    try{const r=await fetch(`${PHP_API}/otp.php`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"verify",phone:phone.replace(/\D/g,""),code:otp})});
      const d=await r.json();
      if(r.ok&&d.verified){setOtpVerified(true);setMode("form");}else setErr(d.error||"OTP ไม่ถูกต้อง");
    }catch{setErr("เกิดข้อผิดพลาด");}finally{setLoading(false);}
  };
  const handleSubmit=async()=>{
    if(!regName.trim()){setErr("กรุณากรอกชื่อร้านค้า");return;}
    if(!regOwner.trim()){setErr("กรุณากรอกชื่อเจ้าของ");return;}
    if(!regAddr.trim()){setErr("กรุณากรอกที่อยู่ร้าน");return;}
    if(!gpsCoords){setErr("กรุณาบันทึกตำแหน่ง GPS ก่อนสมัคร");return;}
    setErr("");setLoading(true);
    try{
      const body:any={name:regName.trim(),ownerName:regOwner.trim(),address:regAddr.trim(),lat:gpsCoords.lat,lng:gpsCoords.lng,otpVerified};
      if(lineProfile){body.lineUserId=lineProfile.lineUserId;body.lineDisplayName=lineProfile.displayName;body.lineAvatarUrl=lineProfile.pictureUrl;}
      else{body.phone=phone.replace(/\D/g,"");}
      const r=await fetch(`${PHP_API}/register.php`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json();
      if(r.ok)onSuccess(d.merchant);else setErr(d.error||"สมัครไม่สำเร็จ");
    }catch{setErr("เกิดข้อผิดพลาด");}finally{setLoading(false);}
  };
  const iS={background:"rgba(10,20,40,0.8)",border:`1px solid ${R.border}`,color:"#fff"} as const;
  const Err=()=>err?<div style={{display:"flex",alignItems:"flex-start",gap:8,background:"rgba(253,24,3,0.08)",border:"1px solid rgba(253,24,3,0.25)",borderRadius:10,padding:"8px 12px",marginTop:10}}>
    <AlertCircle size={13} style={{color:R.red,flexShrink:0,marginTop:1}}/><span style={{fontSize:12,fontWeight:600,color:R.red}}>{err}</span></div>:null;
  return(
    <div style={{padding:"0 16px 32px"}}>
      <AnimatePresence mode="wait">
        {mode==="choose"&&(
          <motion.div key="choose" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <p style={{fontSize:16,fontWeight:700,color:R.text,margin:0}}>สมัครร้านค้าใหม่</p>
              <button onClick={onBack} style={{fontSize:11,fontWeight:600,color:R.muted,background:"rgba(255,255,255,0.05)",border:`1px solid ${R.border}`,borderRadius:8,padding:"4px 10px",cursor:"pointer"}}>← กลับ</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <button onClick={()=>setMode("phone_otp")} style={{background:"rgba(15,25,50,0.9)",border:`1px solid ${R.border}`,borderRadius:16,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",width:"100%"}}>
                <div style={{width:44,height:44,borderRadius:12,background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Phone size={20} style={{color:R.blue}}/></div>
                <div style={{textAlign:"left"}}><p style={{fontSize:14,fontWeight:700,color:R.text,margin:0}}>สมัครด้วยเบอร์โทร + OTP</p><p style={{fontSize:11,color:R.muted,margin:"2px 0 0"}}>รับรหัส OTP ทาง SMS</p></div>
              </button>
            </div>
            <Err/>
          </motion.div>
        )}
        {mode==="phone_otp"&&(
          <motion.div key="phone_otp" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>setMode("choose")} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${R.border}`,borderRadius:8,padding:"4px 10px",cursor:"pointer",color:R.muted,fontSize:11}}>←</button>
              <p style={{fontSize:15,fontWeight:700,color:R.text,margin:0}}>กรอกเบอร์โทร</p>
            </div>
            <div style={{background:R.bgCard,border:`1px solid ${R.border}`,borderRadius:20,padding:20}}>
              <label style={{fontSize:11,fontWeight:700,color:R.muted,display:"block",marginBottom:6}}>เบอร์โทรศัพท์ *</label>
              <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))} onKeyDown={e=>e.key==="Enter"&&sendOTP()} placeholder="0812345678" maxLength={10} type="tel"
                style={{...iS,width:"100%",boxSizing:"border-box",padding:"10px 14px",height:44,borderRadius:12,outline:"none",fontSize:14}}/>
              <Err/>
              <button onClick={sendOTP} disabled={loading} style={{width:"100%",marginTop:12,background:"linear-gradient(135deg,rgba(30,58,138,0.9),rgba(15,25,60,1))",border:`1px solid ${R.borderBright}`,borderRadius:12,padding:"12px 0",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {loading?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<><Key size={14}/> ส่ง OTP</>}
              </button>
            </div>
          </motion.div>
        )}
        {mode==="otp_sent"&&(
          <motion.div key="otp_sent" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>{setMode("phone_otp");setOtp("");setErr("");}} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${R.border}`,borderRadius:8,padding:"4px 10px",cursor:"pointer",color:R.muted,fontSize:11}}>←</button>
              <p style={{fontSize:15,fontWeight:700,color:R.text,margin:0}}>กรอกรหัส OTP</p>
            </div>
            <div style={{background:R.bgCard,border:`1px solid ${R.border}`,borderRadius:20,padding:20}}>
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:36,marginBottom:8}}>📱</div>
                <p style={{fontSize:13,fontWeight:700,color:R.text,margin:"0 0 4px"}}>ส่ง OTP ไปที่</p>
                <p style={{fontSize:15,fontWeight:700,color:R.gold,margin:0}}>{phone.slice(0,3)}****{phone.slice(-3)}</p>
                {devOtp&&<div style={{marginTop:8,background:"rgba(232,184,32,0.1)",border:`1px solid rgba(232,184,32,0.3)`,borderRadius:8,padding:"6px 12px",display:"inline-block"}}><p style={{fontSize:11,color:R.gold,margin:0}}>🛠 Dev OTP: <b>{devOtp}</b></p></div>}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
                {Array.from({length:6}).map((_,i)=>(
                  <div key={i} style={{width:40,height:48,background:"rgba(10,20,40,0.8)",border:otp[i]?`2px solid ${R.gold}`:`1px solid rgba(232,184,32,0.2)`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:R.gold}}>{otp[i]||""}</div>
                ))}
              </div>
              <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} onKeyDown={e=>e.key==="Enter"&&otp.length===6&&verifyOTP()} type="tel" maxLength={6} autoFocus style={{position:"absolute",opacity:0,width:1,height:1,pointerEvents:"none"}}/>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:12}}>
                {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
                  <button key={i} onClick={()=>{if(k==="⌫")setOtp(p=>p.slice(0,-1));else if(k!==""&&otp.length<6)setOtp(p=>p+k);}}
                    style={{width:56,height:40,background:"rgba(15,25,50,0.8)",border:`1px solid ${R.border}`,borderRadius:10,fontSize:15,fontWeight:700,color:R.text,cursor:"pointer"}}>{k}</button>
                ))}
              </div>
              <Err/>
              <button onClick={verifyOTP} disabled={loading||otp.length<6}
                style={{width:"100%",marginTop:8,background:otp.length===6?"linear-gradient(135deg,rgba(34,197,94,0.5),rgba(16,120,60,0.7))":"rgba(255,255,255,0.06)",border:`1px solid ${otp.length===6?"rgba(34,197,94,0.4)":R.border}`,borderRadius:12,padding:"12px 0",fontSize:14,fontWeight:700,color:otp.length===6?R.green:R.muted,cursor:otp.length===6?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {loading?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<><CheckCircle size={14}/> ยืนยัน OTP</>}
              </button>
              {otpTimer>0?<p style={{fontSize:12,color:R.muted,textAlign:"center",marginTop:12}}>ขอ OTP ใหม่ได้ใน {otpTimer} วินาที</p>
                :<button onClick={()=>{setOtp("");setDevOtp("");sendOTP();}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,color:R.gold,textDecoration:"underline",display:"block",margin:"12px auto 0"}}><RotateCcw size={11} style={{marginRight:4}}/>ส่ง OTP ใหม่</button>}
            </div>
          </motion.div>
        )}
        {mode==="form"&&(
          <motion.div key="form" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:14}}>
            <p style={{fontSize:15,fontWeight:700,color:R.text,margin:0}}>ข้อมูลร้านค้า</p>
            <div style={{background:R.bgCard,border:`1px solid ${R.border}`,borderRadius:20,padding:20,display:"flex",flexDirection:"column",gap:12}}>
              {[{label:"ชื่อร้านค้า *",ph:"เช่น ข้าวมันไก่คุณแม่",val:regName,set:setRegName},{label:"ชื่อเจ้าของ *",ph:"ชื่อ-นามสกุล",val:regOwner,set:setRegOwner}].map((f,i)=>(
                <div key={i}>
                  <label style={{fontSize:11,fontWeight:700,color:R.muted,display:"block",marginBottom:5}}>{f.label}</label>
                  <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{...iS,width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:12,outline:"none",fontSize:13}}/>
                </div>
              ))}
              <div>
                <label style={{fontSize:11,fontWeight:700,color:R.muted,display:"block",marginBottom:5}}>ที่อยู่ร้านค้า *</label>
                <textarea value={regAddr} onChange={e=>setRegAddr(e.target.value)} placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด" rows={3}
                  style={{...iS,width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:12,outline:"none",fontSize:12,resize:"none",fontFamily:"inherit"}}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:R.muted,display:"block",marginBottom:5}}>📍 ตำแหน่ง GPS *</label>
                <GPSButton gpsState={gpsState} gpsCoords={gpsCoords} onCapture={captureGPS}/>
              </div>
              <Err/>
              <button onClick={handleSubmit} disabled={loading||!gpsCoords}
                style={{width:"100%",background:gpsCoords?"linear-gradient(135deg,rgba(30,58,138,0.9),rgba(15,25,60,1))":"rgba(255,255,255,0.06)",border:`1px solid ${gpsCoords?R.borderBright:R.border}`,borderRadius:14,padding:"13px 0",fontSize:14,fontWeight:700,color:gpsCoords?"#fff":R.muted,cursor:gpsCoords?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4}}>
                {loading?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<><Store size={14}/> สมัครร้านค้า</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pending / Rejected Screens ─── */
function PendingScreen({merchant,onBack}:{merchant:MerchantInfo;onBack:()=>void}){
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px",background:`linear-gradient(160deg,${R.bgDark},${R.bg})`}}>
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} style={{width:"100%",maxWidth:360,textAlign:"center"}}>
        <motion.div animate={{scale:[1,1.06,1]}} transition={{duration:2,repeat:Infinity}}
          style={{width:80,height:80,borderRadius:"50%",background:"rgba(232,184,32,0.1)",border:"2px solid rgba(232,184,32,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 16px"}}>⏳</motion.div>
        <p style={{fontSize:20,fontWeight:700,color:R.text,margin:"0 0 4px"}}>รอการอนุมัติ</p>
        <p style={{fontSize:13,fontWeight:700,color:R.gold,margin:"0 0 24px"}}>{merchant.name}</p>
        <div style={{background:R.bgCard,border:`1px solid ${R.border}`,borderRadius:16,padding:16,marginBottom:16,textAlign:"left"}}>
          {[{n:1,t:"แอดมินตรวจสอบข้อมูล",d:"1–2 วันทำการ"},{n:2,t:"ได้รับการอนุมัติ",d:"เปิดใช้ Smart QR ได้เลย"},{n:3,t:"ส่งใบเสร็จซอสหมีปรุง",d:"รับ QR เพิ่มให้ลูกค้าสแกน"}].map(s=>(
            <div key={s.n} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${R.goldDark},${R.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#3d1f00",flexShrink:0}}>{s.n}</div>
              <div><p style={{fontSize:12,fontWeight:700,color:R.text,margin:0}}>{s.t}</p><p style={{fontSize:11,color:R.muted,margin:0}}>{s.d}</p></div>
            </div>
          ))}
        </div>
        <button onClick={onBack} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${R.border}`,borderRadius:12,padding:11,fontSize:12,fontWeight:600,color:R.muted,cursor:"pointer"}}>← กลับ</button>
      </motion.div>
    </div>
  );
}
function RejectedScreen({onBack}:{onBack:()=>void}){
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px",background:`linear-gradient(160deg,${R.bgDark},${R.bg})`}}>
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} style={{width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(248,113,113,0.1)",border:"2px solid rgba(248,113,113,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 16px"}}>❌</div>
        <p style={{fontSize:20,fontWeight:700,color:R.text,margin:"0 0 6px"}}>ไม่ได้รับการอนุมัติ</p>
        <p style={{fontSize:13,color:R.red,margin:"0 0 24px"}}>กรุณาติดต่อแอดมินเพื่อขอข้อมูลเพิ่มเติม</p>
        <button onClick={onBack} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${R.border}`,borderRadius:12,padding:11,fontSize:12,fontWeight:600,color:R.muted,cursor:"pointer"}}>← กลับ</button>
      </motion.div>
    </div>
  );
}

/* ════ MAIN ════ */
export default function MerchantPage(){
  const [screen,setScreen]=useState<"login"|"register"|"pending"|"rejected"|"main">("login");
  const [phone,setPhone]=useState("");
  const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const [merchant,setMerchant]=useState<MerchantInfo|null>(null);
  const [quota,setQuota]=useState<QuotaInfo|null>(null);
  const [receipts,setReceipts]=useState<Receipt[]>([]);
  const [tab,setTab]=useState<"home"|"mission"|"receipt"|"reward"|"profile">("home");
  const [appUrl,setAppUrl]=useState("");

  // Upload
  const [bagCount,setBagCount]=useState(1);
  const [imgFile,setImgFile]=useState<File|null>(null);
  const [imgPreview,setImgPreview]=useState("");
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);

  // Stats
  const [dailyChart,setDailyChart]=useState<DayChart[]>([]);
  const [recentScans,setRecentScans]=useState<ScanRecord[]>([]);
  const [todayCount,setTodayCount]=useState(0);
  const [totalCount,setTotalCount]=useState(0);

  // Settings
  const [editName,setEditName]=useState("");
  const [editOwner,setEditOwner]=useState("");
  const [editAddr,setEditAddr]=useState("");
  const [editGpsState,setEditGpsState]=useState<"idle"|"loading"|"ok"|"fail">("idle");
  const [editCoords,setEditCoords]=useState<{lat:number;lng:number}|null>(null);
  const [editSaving,setEditSaving]=useState(false);
  const [editMsg,setEditMsg]=useState("");

  useEffect(()=>{setAppUrl(window.location.origin);},[]);

  const iS={background:"rgba(10,20,40,0.8)",border:`1px solid ${R.border}`,color:"#fff"} as const;

  const loadStats=async(p:string)=>{
    try{
      const r=await fetch(`${PHP_API}/stats.php?phone=${p.replace(/\D/g,"")}`);
      if(!r.ok)return;
      const d=await r.json();
      setDailyChart(d.dailyChart||[]);setRecentScans(d.recentScans||[]);setTodayCount(d.todayCount||0);setTotalCount(d.totalCount||0);
    }catch{}
  };
  const loadStatus=async(p:string)=>{
    // ── ใช้ PHP merchant_status.php เป็น source of truth ──
    const clean=p.replace(/\D/g,"");
    const r=await fetch(`${PHP_API}/merchant_status.php?phone=${clean}`);
    const d=await r.json();
    if(r.ok&&d.merchant){
      const m=d.merchant;
      // map PHP response → MerchantInfo shape
      const merchant:MerchantInfo={
        id:m.id||0, name:m.name||"", ownerName:m.ownerName||m.owner_name||"",
        phone:m.phone||clean, lat:m.lat||null, lng:m.lng||null,
        status:m.status||"pending", address:m.address||"",
        lineDisplayName:m.lineDisplayName||"", lineAvatarUrl:m.lineAvatarUrl||"",
      };
      const quota:QuotaInfo={
        total:d.quota?.total||m.totalQuota||0,
        used:d.quota?.used||m.usedQuota||0,
        remaining:d.quota?.remaining||m.remainingQuota||0,
      };
      setMerchant(merchant);setQuota(quota);
      loadReceipts(clean);
      if(m.status==="approved") loadStats(clean);
      setEditName(merchant.name);setEditOwner(merchant.ownerName);setEditAddr(merchant.address||"");
      setScreen("main");return true;
    }
    if(r.status===403&&d.status==="pending"){
      setMerchant({id:0,name:"",ownerName:"",phone:p,lat:null,lng:null,status:"pending"});
      setScreen("pending");return true;
    }
    if(r.status===403&&d.status==="rejected"){setScreen("rejected");return true;}
    // PHP ไม่พบร้านค้า → ไปหน้า register
    if(!d.merchant)return false;
    return false;
  };
  const loadReceipts=async(p:string)=>{
    try{
      const r=await fetch(`${PHP_API}/receipts.php?phone=${p}`);
      const d=await r.json();
      if(r.ok&&Array.isArray(d.receipts)){setReceipts(d.receipts);return;}
    }catch{}
  };
  const handleLogin=async()=>{
    if(!phone.replace(/\D/g,"").match(/^\d{9,10}$/)){setError("กรุณากรอกเบอร์โทร 9–10 หลัก");return;}
    setError("");setLoading(true);
    try{const ok=await loadStatus(phone);if(!ok)setScreen("register");}finally{setLoading(false);}
  };
  const handleRegisterSuccess=(m:any)=>{
    if(m.status==="pending"){setMerchant(m);setScreen("pending");}else{setMerchant(m);setScreen("main");}
  };
  const handleUpload=async()=>{
    if(!imgFile)return;
    setUploading(true);
    const form=new FormData();
    form.append("phone",phone.replace(/\D/g,""));form.append("bagCount",String(bagCount));form.append("image",imgFile);
    const r=await fetch(`${PHP_API}/receipts.php`,{method:"POST",body:form});
    const d=await r.json();
    if(r.ok){setImgFile(null);setImgPreview("");setBagCount(1);loadReceipts(phone.replace(/\D/g,""));setTab("home");}
    else setError(d.error||"อัปโหลดไม่สำเร็จ");
    setUploading(false);
  };

  // ── Screens ──
  if(screen==="pending"&&merchant)return<PendingScreen merchant={merchant} onBack={()=>setScreen("login")}/>;
  if(screen==="rejected")return<RejectedScreen onBack={()=>setScreen("login")}/>;

  if(screen==="register")return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${R.bgDark},${R.bg})`,overflowY:"auto"}}>
      <div style={{background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,borderBottom:`1px solid ${R.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:10,background:"rgba(30,58,138,0.6)",border:`1px solid ${R.borderBright}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏪</div>
        <div><p style={{fontSize:13,fontWeight:700,color:R.text,margin:0}}>พอร์ทัลร้านค้า</p><p style={{fontSize:10,color:R.muted,margin:0}}>ปังจัง Lucky Draw</p></div>
      </div>
      <div style={{paddingTop:16}}><RegisterFlow prefilledPhone={phone} onBack={()=>setScreen("login")} onSuccess={handleRegisterSuccess}/></div>
    </div>
  );

  if(screen==="login")return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 16px",background:`linear-gradient(160deg,${R.bgDark},${R.bg})`}}>
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,rgba(30,58,138,0.8),rgba(15,25,60,0.9))",border:`2px solid ${R.borderBright}`,boxShadow:`0 0 30px rgba(232,184,32,0.2)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:26}}>🏪</div>
          <p style={{fontSize:20,fontWeight:700,color:R.text,margin:"0 0 4px"}}>พอร์ทัลร้านค้า</p>
          <p style={{fontSize:12,color:R.muted,margin:0}}>ปังจัง Lucky Draw — Partner</p>
        </div>
        <div style={{background:R.bgCard,border:`1px solid ${R.border}`,borderRadius:20,padding:20}}>
          <p style={{fontSize:14,fontWeight:700,color:R.text,margin:"0 0 14px"}}>เข้าสู่ระบบ / สมัครใหม่</p>
          <div style={{position:"relative",marginBottom:12}}>
            <Phone size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:R.muted,pointerEvents:"none"}}/>
            <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="เบอร์โทรร้านค้า" maxLength={10} type="tel"
              style={{...iS,width:"100%",boxSizing:"border-box",paddingLeft:34,paddingRight:12,height:46,borderRadius:12,outline:"none",fontSize:14}}/>
          </div>
          {error&&<p style={{fontSize:12,fontWeight:600,color:R.red,marginBottom:10}}>{error}</p>}
          <button onClick={handleLogin} disabled={loading}
            style={{width:"100%",background:"linear-gradient(135deg,rgba(30,58,138,0.9),rgba(15,25,60,1))",border:`1px solid ${R.borderBright}`,borderRadius:12,padding:"13px 0",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<><Store size={14}/> เข้าสู่ระบบ / สมัครใหม่</>}
          </button>
        </div>
      </motion.div>
    </div>
  );

  /* ── MAIN APP ── */
  const TABS=[
    {key:"home",    label:"หน้าหลัก", icon:<Home size={18}/>},
    {key:"mission", label:"ภารกิจ",   icon:<ClipboardList size={18}/>},
    {key:"receipt", label:"ส่งใบเสร็จ",icon:null},  // center — special
    {key:"reward",  label:"แลกรางวัล",icon:<Gift size={18}/>},
    {key:"profile", label:"ประวัติ",   icon:<User size={18}/>},
  ] as const;

  return(
    <div style={{minHeight:"100vh",maxWidth:480,margin:"0 auto",background:`linear-gradient(160deg,${R.bgDark},${R.bg})`,fontFamily:"'Kanit',sans-serif",paddingBottom:80}}>

      {/* ── Header ── */}
      <div style={{position:"sticky",top:0,zIndex:40,background:`linear-gradient(135deg,${R.bgDark},${R.bg})`,borderBottom:`1px solid ${R.border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {merchant?.lineAvatarUrl
            ?<img src={merchant.lineAvatarUrl} style={{width:34,height:34,borderRadius:10,border:`1px solid ${R.borderBright}`}}/>
            :<div style={{width:34,height:34,borderRadius:10,background:"rgba(30,58,138,0.6)",border:`1px solid ${R.borderBright}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏪</div>}
          <div>
            <p style={{fontSize:13,fontWeight:700,color:R.text,margin:0}}>{merchant?.name||"ร้านค้า"}</p>
            <p style={{fontSize:10,color:R.muted,margin:0}}>ปังจัง Partner</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {quota&&<div style={{background:"rgba(232,184,32,0.1)",border:`1px solid rgba(232,184,32,0.3)`,borderRadius:20,padding:"4px 10px",display:"flex",alignItems:"center",gap:4}}>
            <Star size={12} style={{color:R.gold}}/><p style={{fontSize:11,fontWeight:700,color:R.gold,margin:0}}>{quota.remaining} QR</p>
          </div>}
          <button onClick={()=>setScreen("login")} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${R.border}`,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:R.muted}}>ออก</button>
        </div>
      </div>

      <div style={{padding:"12px 16px 0"}}>
        <AnimatePresence mode="wait">

          {/* ═══ HOME ═══ */}
          {tab==="home"&&(
            <motion.div key="home" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:12}}>
              {/* Profile card */}
              <div style={{background:`linear-gradient(135deg,${R.primary},#8a0000)`,borderRadius:20,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:54,height:54,borderRadius:16,background:"rgba(255,255,255,0.2)",border:"2px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🏪</div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:11,color:"rgba(255,255,255,0.7)",margin:0}}>สวัสดี!</p>
                    <p style={{fontSize:16,fontWeight:800,color:"#fff",margin:0}}>{merchant?.ownerName||merchant?.name||"คุณ"}</p>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>
                      <Star size={12} style={{color:R.gold}}/>
                      <p style={{fontSize:12,fontWeight:700,color:R.gold,margin:0}}>{quota?.remaining||0} QR คงเหลือ</p>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.6)",margin:0}}>ใช้ไปแล้ว</p>
                    <p style={{fontSize:18,fontWeight:800,color:"#fff",margin:0}}>{quota?.used||0}</p>
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.6)",margin:0}}>จาก {quota?.total||0}</p>
                  </div>
                </div>
                {quota&&quota.total>0&&(
                  <div style={{marginTop:12}}>
                    <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.2)",overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:2,background:R.gold,width:`${Math.round((quota.used/quota.total)*100)}%`,transition:"width .8s"}}/>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[{label:"สแกนวันนี้",val:todayCount,icon:"📅",color:R.gold},
                  {label:"ทั้งหมด",val:totalCount,icon:"📊",color:R.blue}].map((s,i)=>(
                  <div key={i} style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:14,padding:"14px 12px",textAlign:"center"}}>
                    <p style={{fontSize:22,margin:"0 0 2px"}}>{s.icon}</p>
                    <p style={{fontSize:22,fontWeight:800,color:s.color,margin:0}}>{s.val}</p>
                    <p style={{fontSize:11,color:R.muted,margin:0}}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* GPS status */}
              {merchant?.lat&&(
                <div style={{background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <MapPin size={14} style={{color:R.green}}/>
                  <div><p style={{fontSize:11,fontWeight:700,color:R.green,margin:0}}>GPS บันทึกแล้ว ✅ Geo-fence 20m</p>
                  <p style={{fontSize:10,fontFamily:"monospace",color:R.muted,margin:0}}>{merchant.lat.toFixed(5)}, {merchant.lng?.toFixed(5)}</p></div>
                </div>
              )}

              {/* Recent receipts */}
              {receipts.slice(0,3).map(rc=>{
                const s=STATUS_MAP[rc.status]||STATUS_MAP.pending;
                return(
                  <div key={rc.id} style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                    <Package size={16} style={{color:R.muted}}/>
                    <div style={{flex:1}}><p style={{fontSize:13,fontWeight:700,color:R.text,margin:0}}>{rc.bagCount} ถุง</p><p style={{fontSize:11,color:R.muted,margin:0}}>{new Date(rc.submittedAt).toLocaleDateString("th-TH",{day:"numeric",month:"short"})}</p></div>
                    <div style={{display:"flex",alignItems:"center",gap:4,background:`${s.color}15`,border:`1px solid ${s.color}40`,borderRadius:8,padding:"3px 8px",fontSize:11,fontWeight:700,color:s.color}}>{s.icon}{s.label}</div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ═══ MISSION ═══ */}
          {tab==="mission"&&(
            <motion.div key="mission" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:12}}>
              <p style={{fontSize:16,fontWeight:700,color:R.text,margin:0}}>ภารกิจพิเศษ 🎯</p>
              {/* QR Code */}
              <div style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:16,padding:20}}>
                <SmartQR phone={merchant?.phone||phone.replace(/\D/g,"")} name={merchant?.name||""} appUrl={appUrl}/>
              </div>
              {/* Upload receipt mission */}
              <div style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:16,padding:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${R.primary},#8a0000)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📄</div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13,fontWeight:700,color:R.text,margin:0}}>ส่งใบเสร็จซอสหมีปรุง</p>
                    <p style={{fontSize:11,color:R.muted,margin:0}}>รับ QR เพิ่ม 30 โค้ด/ถุง</p>
                  </div>
                  <div style={{background:"rgba(232,184,32,0.15)",borderRadius:20,padding:"4px 12px"}}><p style={{fontSize:11,fontWeight:700,color:R.gold,margin:0}}>ภารกิจ</p></div>
                </div>
                <button onClick={()=>setTab("receipt")} style={{width:"100%",background:`linear-gradient(135deg,${R.primary},#8a0000)`,border:"none",borderRadius:12,padding:"11px 0",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Upload size={13}/> ส่งใบเสร็จเลย
                </button>
              </div>
              {/* Stat chart */}
              {dailyChart.length>0&&(
                <div style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:16,padding:16}}>
                  <p style={{fontSize:13,fontWeight:700,color:R.text,margin:"0 0 14px"}}>📈 สแกน 7 วันล่าสุด</p>
                  {(()=>{const mx=Math.max(...dailyChart.map(d=>d.count),1);return(
                    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
                      {dailyChart.map((d,i)=>(
                        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                          <p style={{fontSize:9,fontWeight:700,color:d.count>0?R.gold:R.muted,margin:0}}>{d.count||""}</p>
                          <div style={{width:"100%",borderRadius:"3px 3px 0 0",minHeight:3,background:d.count>0?`linear-gradient(180deg,${R.gold},${R.goldDark})`:"rgba(255,255,255,0.08)",height:`${Math.max((d.count/mx)*60,3)}px`}}/>
                          <p style={{fontSize:8,color:R.muted,margin:0,textAlign:"center"}}>{d.label}</p>
                        </div>
                      ))}
                    </div>
                  );})()}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ RECEIPT ═══ */}
          {tab==="receipt"&&(
            <motion.div key="receipt" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:12}}>
              <p style={{fontSize:16,fontWeight:700,color:R.text,margin:0}}>ส่งใบเสร็จ 📄</p>
              <div style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:16,padding:20,display:"flex",flexDirection:"column",gap:14}}>
                <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
                  onChange={e=>{const f=e.target.files?.[0];if(!f)return;setImgFile(f);const rd=new FileReader();rd.onload=ev=>setImgPreview(ev.target?.result as string);rd.readAsDataURL(f);}}/>
                {!imgPreview
                  ?<button onClick={()=>fileRef.current?.click()}
                      style={{height:160,background:"rgba(0,0,0,0.3)",border:`2px dashed ${R.border}`,borderRadius:16,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:8}}>
                      <Camera size={32} style={{color:R.gold}}/><p style={{fontSize:13,fontWeight:700,color:R.text,margin:0}}>ถ่ายรูป / เลือกรูปใบเสร็จ</p>
                    </button>
                  :<div style={{position:"relative"}}><img src={imgPreview} style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:12}}/><button onClick={()=>{setImgFile(null);setImgPreview("");}} style={{position:"absolute",top:8,right:8,width:28,height:28,borderRadius:"50%",background:"rgba(0,0,0,0.7)",border:"none",color:"#fff",cursor:"pointer",fontSize:14}}>✕</button></div>}
                <div>
                  <p style={{fontSize:11,fontWeight:700,color:R.muted,margin:"0 0 8px"}}>จำนวนถุงซอส</p>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <button onClick={()=>setBagCount(p=>Math.max(1,p-1))} style={{width:36,height:36,borderRadius:10,background:"rgba(0,0,0,0.3)",border:`1px solid ${R.border}`,color:R.text,fontSize:18,cursor:"pointer"}}>−</button>
                    <div style={{flex:1,height:36,borderRadius:10,background:"rgba(0,0,0,0.2)",border:`1px solid ${R.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:R.gold}}>{bagCount}</div>
                    <button onClick={()=>setBagCount(p=>Math.min(99,p+1))} style={{width:36,height:36,borderRadius:10,background:"rgba(0,0,0,0.3)",border:`1px solid ${R.border}`,color:R.text,fontSize:18,cursor:"pointer"}}>+</button>
                  </div>
                  <p style={{fontSize:10,color:R.muted,textAlign:"center",marginTop:4}}>≈ {bagCount*30} QR Code</p>
                </div>
                <button onClick={handleUpload} disabled={!imgFile||uploading}
                  style={{background:!imgFile?"rgba(255,255,255,0.06)":`linear-gradient(135deg,${R.primary},#8a0000)`,border:`1px solid ${!imgFile?R.border:"rgba(253,24,3,0.5)"}`,borderRadius:12,padding:"12px 0",fontSize:14,fontWeight:700,color:!imgFile?R.muted:"#fff",cursor:!imgFile?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {uploading?<Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>:<><Upload size={14}/> ส่งใบเสร็จ</>}
                </button>
              </div>
              {/* Receipt history */}
              {receipts.map(rc=>{const s=STATUS_MAP[rc.status]||STATUS_MAP.pending;return(
                <div key={rc.id} style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <Package size={16} style={{color:R.muted}}/>
                  <div style={{flex:1}}><p style={{fontSize:13,fontWeight:700,color:R.text,margin:0}}>{rc.bagCount} ถุง</p><p style={{fontSize:11,color:R.muted,margin:0}}>{new Date(rc.submittedAt).toLocaleDateString("th-TH",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</p>{rc.quota&&<p style={{fontSize:11,fontWeight:700,color:R.gold,margin:0}}>{rc.quota.totalCodes} QR (ใช้ {rc.quota.usedCodes})</p>}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4,background:`${s.color}15`,border:`1px solid ${s.color}40`,borderRadius:8,padding:"3px 8px",fontSize:11,fontWeight:700,color:s.color}}>{s.icon}{s.label}</div>
                </div>
              );})}
            </motion.div>
          )}

          {/* ═══ REWARD ═══ */}
          {tab==="reward"&&(
            <motion.div key="reward" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:12}}>
              <p style={{fontSize:16,fontWeight:700,color:R.text,margin:0}}>แลกรางวัล 🎁</p>
              {/* Points summary */}
              <div style={{background:`linear-gradient(135deg,${R.goldDark},${R.gold})`,borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:11,color:"rgba(61,31,0,0.7)",margin:0}}>QR คงเหลือ</p>
                  <p style={{fontSize:28,fontWeight:800,color:"#3d1f00",margin:0}}>{quota?.remaining||0}</p>
                  <p style={{fontSize:11,color:"rgba(61,31,0,0.7)",margin:0}}>โค้ด</p>
                </div>
                <div style={{fontSize:44}}>🎫</div>
              </div>
              {/* Reward items */}
              <div style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:16,padding:"16px 20px",textAlign:"center"}}>
                <p style={{fontSize:36,margin:"0 0 8px"}}>🏆</p>
                <p style={{fontSize:14,fontWeight:700,color:R.text,margin:"0 0 4px"}}>รางวัลจับฉลาก</p>
                <p style={{fontSize:12,color:R.muted,margin:"0 0 16px"}}>สะสม QR ให้ลูกค้าสแกน เพื่อเพิ่มสิทธิ์ลุ้นโชคใหญ่</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[{prize:"รางวัลที่ 1 เงินสด 100,000 บาท",emoji:"🥇"},{prize:"รางวัลที่ 2 เงินสด 50,000 บาท",emoji:"🥈"},{prize:"รางวัลที่ 3 เงินสด 10,000 บาท",emoji:"🥉"}].map((r,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 12px",textAlign:"left"}}>
                      <span style={{fontSize:20}}>{r.emoji}</span>
                      <p style={{fontSize:12,fontWeight:600,color:R.text,margin:0,flex:1}}>{r.prize}</p>
                      <ChevronRight size={14} style={{color:R.muted}}/>
                    </div>
                  ))}
                </div>
              </div>
              {/* Scan history */}
              {recentScans.length>0&&(
                <div style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:16,padding:16}}>
                  <p style={{fontSize:13,fontWeight:700,color:R.text,margin:"0 0 12px"}}>🗂️ รายการสแกนล่าสุด</p>
                  {recentScans.slice(0,5).map(sc=>(
                    <div key={sc.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid rgba(232,184,32,0.06)`}}>
                      <div style={{width:32,height:32,borderRadius:8,background:sc.isWinner?"rgba(253,24,3,0.15)":"rgba(232,184,32,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{sc.isWinner?"🏆":"🎟️"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:12,fontWeight:700,color:R.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sc.customerName}</p>
                        <p style={{fontSize:10,fontFamily:"monospace",color:R.muted,margin:0}}>{sc.code}</p>
                      </div>
                      <p style={{fontSize:10,color:R.muted,margin:0,flexShrink:0}}>{new Date(sc.collectedAt).toLocaleDateString("th-TH",{day:"numeric",month:"short"})}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ PROFILE ═══ */}
          {tab==="profile"&&(
            <motion.div key="profile" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:12}}>
              {/* Avatar card */}
              <div style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:16,padding:"20px 16px",textAlign:"center"}}>
                <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${R.primary},#8a0000)`,border:`3px solid ${R.gold}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 12px"}}>🏪</div>
                <p style={{fontSize:16,fontWeight:700,color:R.text,margin:"0 0 4px"}}>{merchant?.name}</p>
                <p style={{fontSize:12,color:R.muted,margin:"0 0 12px"}}>{merchant?.ownerName}</p>
                <div style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(232,184,32,0.1)",border:`1px solid rgba(232,184,32,0.3)`,borderRadius:20,padding:"4px 14px"}}>
                  <Star size={12} style={{color:R.gold}}/><p style={{fontSize:12,fontWeight:700,color:R.gold,margin:0}}>Partner ปังจัง</p>
                </div>
              </div>

              {/* Edit info */}
              <div style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:12}}>
                <p style={{fontSize:14,fontWeight:700,color:R.text,margin:0}}>✏️ ข้อมูลส่วนตัว</p>
                {[{label:"ชื่อร้านค้า",val:editName,set:setEditName,ph:"ชื่อร้าน"},{label:"ชื่อเจ้าของ",val:editOwner,set:setEditOwner,ph:"ชื่อ-นามสกุล"}].map((f,i)=>(
                  <div key={i}>
                    <label style={{fontSize:11,fontWeight:700,color:R.muted,display:"block",marginBottom:5}}>{f.label}</label>
                    <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                      style={{background:"rgba(10,20,40,0.8)",border:`1px solid ${R.border}`,color:"#fff",width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:12,outline:"none",fontSize:13}}/>
                  </div>
                ))}
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:R.muted,display:"block",marginBottom:5}}>ที่อยู่ร้านค้า</label>
                  <textarea value={editAddr} onChange={e=>setEditAddr(e.target.value)} rows={2} placeholder="ที่อยู่"
                    style={{background:"rgba(10,20,40,0.8)",border:`1px solid ${R.border}`,color:"#fff",width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:12,outline:"none",fontSize:12,resize:"none",fontFamily:"inherit"}}/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:R.muted,display:"block",marginBottom:5}}>📍 อัปเดต GPS</label>
                  <GPSButton gpsState={editGpsState} gpsCoords={editCoords}
                    onCapture={async()=>{setEditGpsState("loading");try{const c=await getGPS();setEditCoords(c);setEditGpsState("ok");}catch{setEditGpsState("fail");}}}/>
                </div>
                {editMsg&&<div style={{background:editMsg.includes("✅")?"rgba(34,197,94,0.08)":"rgba(253,24,3,0.08)",border:`1px solid ${editMsg.includes("✅")?"rgba(34,197,94,0.3)":"rgba(253,24,3,0.25)"}`,borderRadius:10,padding:"8px 12px"}}>
                  <p style={{fontSize:12,fontWeight:600,color:editMsg.includes("✅")?R.green:R.red,margin:0}}>{editMsg}</p>
                </div>}
                <button onClick={async()=>{
                  setEditSaving(true);setEditMsg("");
                  const body:any={phone:phone.replace(/\D/g,"")};
                  if(editName.trim())body.name=editName.trim();
                  if(editOwner.trim())body.ownerName=editOwner.trim();
                  if(editAddr.trim())body.address=editAddr.trim();
                  if(editCoords){body.lat=editCoords.lat;body.lng=editCoords.lng;}
                  const r=await fetch(`${PHP_API}/update.php`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
                  const d=await r.json();
                  if(r.ok){setMerchant(d.merchant);setEditMsg("✅ บันทึกสำเร็จ");}else setEditMsg(d.error||"เกิดข้อผิดพลาด");
                  setEditSaving(false);
                }} disabled={editSaving}
                  style={{background:`linear-gradient(135deg,${R.primary},#8a0000)`,border:"none",borderRadius:12,padding:"12px 0",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {editSaving?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<><Save size={14}/> บันทึกข้อมูล</>}
                </button>
              </div>

              {/* Receipt history in profile */}
              <div style={{background:R.bgCard,border:`1px solid ${R.cardBorder}`,borderRadius:16,padding:16}}>
                <p style={{fontSize:13,fontWeight:700,color:R.text,margin:"0 0 12px"}}>📋 ประวัติส่งใบเสร็จ</p>
                {receipts.length===0?<p style={{textAlign:"center",color:R.muted,fontSize:13,padding:16}}>ยังไม่มีใบเสร็จ</p>
                  :receipts.map(rc=>{const s=STATUS_MAP[rc.status]||STATUS_MAP.pending;return(
                    <div key={rc.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid rgba(232,184,32,0.06)`}}>
                      <Package size={14} style={{color:R.muted,flexShrink:0}}/>
                      <div style={{flex:1}}><p style={{fontSize:12,fontWeight:600,color:R.text,margin:0}}>{rc.bagCount} ถุง {rc.quota?`• ${rc.quota.totalCodes} QR`:""}</p>
                        <p style={{fontSize:10,color:R.muted,margin:0}}>{new Date(rc.submittedAt).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"2-digit"})}</p></div>
                      <div style={{display:"flex",alignItems:"center",gap:4,background:`${s.color}15`,border:`1px solid ${s.color}40`,borderRadius:6,padding:"2px 6px",fontSize:10,fontWeight:700,color:s.color}}>{s.icon}{s.label}</div>
                    </div>
                  );})}
              </div>

              <button onClick={()=>setScreen("login")}
                style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:14,padding:"13px 0",fontSize:14,fontWeight:700,color:R.red,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                ออกจากระบบ
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Bottom Nav (5 tabs) ── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:`linear-gradient(180deg,${R.bgDark}ee,${R.bgDark})`,borderTop:`1px solid ${R.border}`,display:"flex",alignItems:"flex-end",zIndex:50,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {TABS.map(t=>{
          const isActive=tab===t.key;
          const isCenter=t.key==="receipt";
          if(isCenter)return(
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 4px 10px",background:"none",border:"none",cursor:"pointer",position:"relative",top:-10}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${R.primary},#8a0000)`,border:`3px solid ${R.gold}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px rgba(253,24,3,0.5)`,marginBottom:4}}>
                <FileText size={22} style={{color:"#fff"}}/>
              </div>
              <span style={{fontSize:9,fontWeight:700,color:isActive?R.gold:R.muted}}>{t.label}</span>
            </button>
          );
          return(
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 4px 10px",background:isActive?"rgba(232,184,32,0.08)":"none",border:"none",cursor:"pointer",borderTop:isActive?`2px solid ${R.gold}`:"2px solid transparent"}}>
              <span style={{color:isActive?R.gold:R.muted,marginBottom:3}}>{t.icon}</span>
              <span style={{fontSize:9,fontWeight:700,color:isActive?R.gold:R.muted}}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
