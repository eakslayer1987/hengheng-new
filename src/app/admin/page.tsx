"use client";
import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Users, QrCode, Store, FileText, Settings, LogOut,
  RefreshCw, Loader2, Download, Search, CheckCircle, XCircle,
  Clock, Plus, Pencil, Trash2, Eye, EyeOff, ChevronLeft,
  ChevronRight, Save, AlertTriangle, MapPin, Package, Shield,
  ToggleLeft, ToggleRight, Sliders, Bell, Filter, RotateCcw, Tag, Trophy, Upload, Home, ScanLine
} from "lucide-react";

/* ════ THEME ════ */
const C = {
  bg:         "#F1F5F9",
  sidebar:    "#0F172A",
  card:       "#FFFFFF",
  cardAlt:    "#F8FAFC",
  border:     "rgba(0,0,0,0.08)",
  borderMid:  "rgba(0,0,0,0.12)",
  text:       "#0F172A",
  sub:        "#475569",
  muted:      "#94A3B8",
  red:        "#E53E3E",
  redLight:   "#FFF5F5",
  redBorder:  "rgba(229,62,62,0.2)",
  green:      "#16A34A",
  greenLight: "#F0FDF4",
  greenBorder:"rgba(22,163,74,0.2)",
  gold:       "#B45309",
  goldLight:  "#FFFBEB",
  goldBorder: "rgba(180,83,9,0.2)",
  blue:       "#1D4ED8",
  blueLight:  "#EFF6FF",
  blueBorder: "rgba(29,78,216,0.15)",
  active:     "rgba(99,102,241,0.12)",
  activeText: "#6366F1",
  activeBorder:"#6366F1",
};

/* ════ TYPES ════ */
type Stats = {
  campaign: { id: number; name: string; endDate: string; isActive: boolean } | null;
  totalCodes: number; todayCollections: number;
  totalWinners: number; pendingClaim: number;
  totalMerchants: number; pendingMerchants: number; approvedMerchants: number; pendingReceipts: number;
  totalQuotaGiven: number; totalQuotaUsed: number; totalQuotaRemaining: number;
  dailyData: { date: string; count: number }[];
  prizes: Prize[];
};
type CollectedCode = { id:number; code:string; customerName:string; customerPhone:string; isWinner:boolean; claimStatus:string; collectedAt:string; merchant:{name:string}; campaign:{name:string}; prize:{name:string;value:number}|null };

type Prize    = { id:number; campaignId:number; name:string; value:number; quantity:number; remaining:number; sortOrder:number };
type Campaign = { id:number; name:string; description:string; startDate:string; endDate:string; isActive:boolean; totalBudget:number; codesPerBag:number; _count:{codes:number} };

/* ════ TOAST ════ */
let _tid = 0;
type Toast = { id:number; msg:string; ok:boolean };
function useToast(){
  const [toasts,setToasts]=useState<Toast[]>([]);
  const add=(msg:string,ok=true)=>{
    const id=++_tid; setToasts(p=>[...p,{id,msg,ok}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500);
  };
  return{toasts,add};
}

/* ════ SHARED COMPONENTS ════ */
function Badge({children,color=C.blue,bg}:{children:React.ReactNode;color?:string;bg?:string}){
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:3,background:bg||`${color}15`,color,border:`1px solid ${color}30`,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
      {children}
    </span>
  );
}
function Card({children,className="",style={}}:{children:React.ReactNode;className?:string;style?:React.CSSProperties}){
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"1rem 1.25rem",...style}}>{children}</div>
  );
}
function PageHeader({title,sub,children}:{title:string;sub?:string;children?:React.ReactNode}){
  return(
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
      <div><h1 style={{fontSize:20,fontWeight:600,color:C.text,margin:0}}>{title}</h1>
        {sub&&<p style={{fontSize:13,color:C.muted,margin:"3px 0 0"}}>{sub}</p>}</div>
      {children&&<div style={{display:"flex",gap:8}}>{children}</div>}
    </div>
  );
}
function Btn({children,onClick,variant="primary",disabled=false,size="md"}:{children:React.ReactNode;onClick?:()=>void;variant?:"primary"|"secondary"|"danger"|"ghost";disabled?:boolean;size?:"sm"|"md"}){
  const styles={
    primary:{background:C.blue,color:"#fff",border:`1px solid ${C.blue}`},
    secondary:{background:C.card,color:C.sub,border:`1px solid ${C.border}`},
    danger:{background:"#FEF2F2",color:C.red,border:`1px solid ${C.redBorder}`},
    ghost:{background:"transparent",color:C.muted,border:`1px solid ${C.border}`},
  };
  const pad=size==="sm"?"4px 12px":"7px 16px";
  return(
    <button onClick={onClick} disabled={disabled}
      style={{...styles[variant],borderRadius:8,padding:pad,fontSize:13,fontWeight:500,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.6:1,display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap",transition:"opacity .15s"}}>
      {children}
    </button>
  );
}
function InputField({label,value,onChange,type="text",placeholder="",required=false,note=""}:{label:string;value:string|number;onChange:(v:string)=>void;type?:string;placeholder?:string;required?:boolean;note?:string}){
  return(
    <div>
      <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:5}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>
      <input value={value} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder}
        style={{width:"100%",boxSizing:"border-box",height:36,padding:"0 10px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,color:C.text,background:C.card,outline:"none"}}/>
      {note&&<p style={{fontSize:11,color:C.muted,margin:"3px 0 0"}}>{note}</p>}
    </div>
  );
}
function ToggleSwitch({value,onChange,label,sub}:{value:boolean;onChange:(v:boolean)=>void;label:string;sub?:string}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
      <div><p style={{fontSize:13,fontWeight:500,color:C.text,margin:0}}>{label}</p>
        {sub&&<p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>{sub}</p>}</div>
      <button onClick={()=>onChange(!value)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
        {value
          ? <ToggleRight size={28} style={{color:C.blue}}/>
          : <ToggleLeft  size={28} style={{color:C.muted}}/>}
      </button>
    </div>
  );
}

/* ════ LOGIN PAGE ════ */
function LoginPage({onLogin}:{onLogin:()=>void}){
  const [user,setUser]=useState(""); const [pw,setPw]=useState(""); const [showPw,setShowPw]=useState(false);
  const [loading,setLoading]=useState(false); const [err,setErr]=useState("");
  const login=async()=>{
    setLoading(true); setErr("");
    const r=await fetch("/api/admin/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,password:pw})});
    if(r.ok) onLogin(); else setErr("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    setLoading(false);
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{width:"100%",maxWidth:360,padding:"0 16px"}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"32px 28px",boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:52,height:52,borderRadius:12,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:22,color:"#fff",fontWeight:700}}>ป</div>
            <p style={{fontSize:20,fontWeight:600,color:C.text,margin:"0 0 4px"}}>ปังจัง Admin</p>
            <p style={{fontSize:13,color:C.muted,margin:0}}>Lucky Draw Management</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <InputField label="ชื่อผู้ใช้" value={user} onChange={setUser} placeholder="admin"/>
            <div>
              <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:5}}>รหัสผ่าน</label>
              <div style={{position:"relative"}}>
                <input value={pw} onChange={e=>setPw(e.target.value)} type={showPw?"text":"password"} placeholder="••••••"
                  onKeyDown={e=>e.key==="Enter"&&login()}
                  style={{width:"100%",boxSizing:"border-box",height:36,padding:"0 36px 0 10px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,color:C.text,outline:"none"}}/>
                <button onClick={()=>setShowPw(p=>!p)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,padding:0}}>
                  {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
            </div>
            {err&&<p style={{fontSize:12,color:C.red,margin:0}}>{err}</p>}
            <button onClick={login} disabled={loading}
              style={{background:C.blue,color:"#fff",border:"none",borderRadius:8,height:38,fontSize:14,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4}}>
              {loading?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:"เข้าสู่ระบบ"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ════ DASHBOARD TAB ════ */
function DashboardTab(){
  const [stats,setStats]=useState<Stats|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    fetch("/api/admin/stats").then(r=>r.json()).then(d=>{if(d.stats)setStats(d.stats);setLoading(false);}).catch(()=>setLoading(false));
  },[]);
  if(loading)return<div style={{display:"flex",justifyContent:"center",padding:60}}><Loader2 size={24} style={{animation:"spin 1s linear infinite",color:C.muted}}/></div>;
  if(!stats)return<p style={{color:C.muted,padding:20}}>โหลดข้อมูลไม่สำเร็จ</p>;

  const winRate = stats.totalCodes > 0 ? ((stats.totalWinners / stats.totalCodes) * 100).toFixed(1) + "%" : "0%";
  const statCards=[
    {label:"โค้ดสะสม",       val:(stats.totalCodes||0).toLocaleString(),      sub:`วันนี้ ${stats.todayCollections||0} ใบ`,     icon:<QrCode   size={18}/>, color:C.blue},
    {label:"ผู้โชคดี",        val:(stats.totalWinners||0).toLocaleString(),    sub:`รอรับ ${stats.pendingClaim||0}`,              icon:<Trophy   size={18}/>, color:C.green},
    {label:"อัตราชนะ",       val:winRate,                                       sub:`ชนะ ${stats.totalWinners||0} คน`,           icon:<BarChart3 size={18}/>,color:"#7C3AED"},
    {label:"ร้านค้า",         val:(stats.approvedMerchants||0).toLocaleString(),sub:`รอ ${stats.pendingMerchants||0} ร้าน`,      icon:<Store    size={18}/>, color:"#EA580C"},
    {label:"QR คงเหลือ",    val:(stats.totalQuotaRemaining||0).toLocaleString(),sub:`จ่ายไป ${stats.totalQuotaGiven||0}`,        icon:<Package  size={18}/>,color:C.gold},
    {label:"ใบเสร็จรอตรวจ", val:(stats.pendingReceipts||0).toLocaleString(),  sub:`อนุมัติแล้ว ${stats.approvedMerchants||0}`, icon:<Clock    size={18}/>, color:C.red},
  ];

  return(
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:20}}>
      <PageHeader title="Dashboard" sub={stats.campaign?`แคมเปญ: ${stats.campaign.name}`:"ยังไม่มีแคมเปญ"}/>

      {/* Campaign status bar */}
      {stats.campaign&&(
        <div style={{background:stats.campaign.isActive?C.greenLight:C.cardAlt,border:`1px solid ${stats.campaign.isActive?C.greenBorder:C.border}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:stats.campaign.isActive?C.green:C.muted,flexShrink:0}}/>
          <p style={{fontSize:13,color:stats.campaign.isActive?C.green:C.sub,fontWeight:500,margin:0}}>
            {stats.campaign.isActive?"แคมเปญกำลังดำเนินอยู่":"แคมเปญปิดอยู่"}
            {" — หมดเขต "}{new Date(stats.campaign.endDate).toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric"})}
          </p>
        </div>
      )}

      {/* Stat grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        {statCards.map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{color:s.color}}>{s.icon}</div>
              <span style={{fontSize:11,fontWeight:500,color:C.muted}}>{s.label}</span>
            </div>
            <p style={{fontSize:22,fontWeight:600,color:C.text,margin:"0 0 2px"}}>{s.val}</p>
            <p style={{fontSize:11,color:C.muted,margin:0}}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Prizes remaining */}
      {stats.prizes.length>0&&(
        <Card>
          <p style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:12}}>รางวัลคงเหลือ</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {stats.prizes.map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:16}}>{["🥇","🥈","🥉","🎁","🎀"][i]||"🎁"}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:500,color:C.text}}>{p.name}</span>
                    <span style={{fontSize:12,color:C.muted}}>{p.remaining}/{p.quantity}</span>
                  </div>
                  <div style={{height:5,borderRadius:3,background:C.bg,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:3,background:p.remaining===0?C.muted:C.blue,width:`${(p.remaining/p.quantity)*100}%`,transition:"width .5s"}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Daily table */}
      {stats.dailyData.length>0&&(
        <Card>
          <p style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:12}}>7 วันล่าสุด</p>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",fontSize:13,borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["วันที่","โค้ดสะสม"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"6px 12px",fontSize:11,fontWeight:600,color:C.muted}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {stats.dailyData.slice(-7).reverse().map((d,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:"8px 12px",color:C.sub}}>{new Date(d.date).toLocaleDateString("th-TH",{day:"numeric",month:"short"})}</td>
                    <td style={{padding:"8px 12px",color:C.text,fontWeight:500}}>{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  );
}

/* ════ COLLECTIONS TAB ════ */
function EntriesTab({toast}:{toast:(m:string,ok?:boolean)=>void}){
  const [entries,setEntries]=useState<CollectedCode[]>([]);
  const [loading,setLoading]=useState(false);
  const [page,setPage]=useState(1); const [pages,setPages]=useState(1); const [total,setTotal]=useState(0);
  const [search,setSearch]=useState(""); const [claim,setClaim]=useState("");

  const load=async(p=1)=>{
    setLoading(true);
    const winner = claim==="won"?"yes": claim==="not_won"?"no":"";
    const q=new URLSearchParams({page:String(p),...(search&&{search}),...(winner&&{winner}),...(claim==="pending"||claim==="claimed"||claim==="expired"?{claimStatus:claim}:{})});
    const r=await fetch(`/api/admin/collections?${q}`); const d=await r.json();
    if(r.ok){setEntries(d.items||[]);setPages(d.pages||1);setTotal(d.total||0);setPage(p);}
    setLoading(false);
  };
  useEffect(()=>{load(1);},[search,claim]);

  const handleClaim=async(id:number,status:string)=>{
    const r=await fetch("/api/admin/collections",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,claimStatus:status})});
    const d=await r.json();
    if(r.ok){toast(d.message);load(page);}else toast(d.error||"ไม่สำเร็จ",false);
  };

  const CLAIM_COLOR:Record<string,string>={pending:C.gold,claimed:C.green,expired:C.muted};
  const CLAIM_LABEL:Record<string,string>={pending:"รอรับ",claimed:"รับแล้ว",expired:"หมดอายุ"};

  return(
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:16}}>
      <PageHeader title="ผู้เข้าร่วม" sub={`ทั้งหมด ${total.toLocaleString()} รายการ`}>
        <Btn variant="secondary" onClick={()=>load(page)}><RefreshCw size={13}/> รีเฟรช</Btn>
      </PageHeader>

      {/* Filters */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:180}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted}}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="ค้นหาชื่อ/เบอร์/รหัส"
            style={{width:"100%",boxSizing:"border-box",height:34,paddingLeft:30,paddingRight:10,border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,outline:"none",color:C.text}}/>
        </div>
        {[
          {val:claim, set:setClaim, opts:[["","สถานะทั้งหมด"],["won","ผู้โชคดี"],["not_won","รอลุ้น"],["pending","รอรับ"],["claimed","รับแล้ว"],["expired","หมดอายุ"]]},
        ].map((f,i)=>(
          <select key={i} value={f.val} onChange={e=>{f.set(e.target.value);setPage(1);}}
            style={{height:34,padding:"0 8px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,color:C.text,background:C.card,cursor:"pointer"}}>
            {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      <Card style={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",fontSize:13,borderCollapse:"collapse"}}>
          <thead><tr style={{background:C.cardAlt,borderBottom:`1px solid ${C.border}`}}>
            {["ชื่อ / เบอร์","โค้ด","ร้านค้า","สถานะ","วันที่","การดำเนินการ"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"10px 14px",fontSize:11,fontWeight:600,color:C.muted,whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{textAlign:"center",padding:40}}><Loader2 size={20} style={{animation:"spin 1s linear infinite",color:C.muted}}/></td></tr>
              : entries.length===0
                ? <tr><td colSpan={7} style={{textAlign:"center",padding:40,color:C.muted,fontSize:13}}>ไม่พบข้อมูล</td></tr>
                : entries.map((e,i)=>(
                  <tr key={e.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.card:C.cardAlt}}>
                    <td style={{padding:"10px 14px"}}>
                      <p style={{fontWeight:500,color:C.text,margin:0,fontSize:13}}>{e.customerName}</p>
                      <p style={{color:C.muted,margin:0,fontSize:11}}>{e.customerPhone}</p>
                    </td>
                    <td style={{padding:"10px 14px",fontFamily:"monospace",fontSize:12,color:C.blue}}>{e.code}</td>
                    <td style={{padding:"10px 14px",fontSize:12,color:C.sub}}>{e.merchant?.name||"—"}</td>
                    <td style={{padding:"10px 14px"}}>
                      <Badge color={e.isWinner?C.green:C.muted}>{e.isWinner?"🏆 ชนะ":"รอลุ้น"}</Badge>
                    </td>
                    <td style={{padding:"10px 14px"}}>
                      <Badge color={CLAIM_COLOR[e.claimStatus]||C.muted}>{CLAIM_LABEL[e.claimStatus]||e.claimStatus}</Badge>
                    </td>
                    <td style={{padding:"10px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>
                      {new Date(e.collectedAt).toLocaleDateString("th-TH",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                    </td>
                    <td style={{padding:"10px 14px"}}>
                      {e.isWinner&&e.claimStatus==="pending"&&(
                        <div style={{display:"flex",gap:6}}>
                          <Btn size="sm" onClick={()=>handleClaim(e.id,"claimed")}><CheckCircle size={11}/> รับแล้ว</Btn>
                          <Btn size="sm" variant="danger" onClick={()=>handleClaim(e.id,"expired")}><XCircle size={11}/> หมดอายุ</Btn>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </Card>

      {pages>1&&(
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8}}>
          <Btn size="sm" variant="ghost" onClick={()=>load(page-1)} disabled={page<=1}><ChevronLeft size={13}/></Btn>
          <span style={{fontSize:13,color:C.sub}}>{page} / {pages}</span>
          <Btn size="sm" variant="ghost" onClick={()=>load(page+1)} disabled={page>=pages}><ChevronRight size={13}/></Btn>
        </div>
      )}
    </motion.div>
  );
}

/* ════ CODES TAB ════ */
function CodesTab({toast}:{toast:(m:string,ok?:boolean)=>void}){
  const [codes,setCodes]=useState<CollectedCode[]>([]);
  const [loading,setLoading]=useState(false);
  const [page,setPage]=useState(1); const [pages,setPages]=useState(1); const [total,setTotal]=useState(0);
  const [search,setSearch]=useState(""); const [winner,setWinner]=useState("");

  const load=async(p=1)=>{
    setLoading(true);
    const q=new URLSearchParams({page:String(p),...(search&&{search}),...(winner&&{winner})});
    const r=await fetch(`/api/admin/collections?${q}`); const d=await r.json();
    if(r.ok){setCodes(d.items||[]);setPages(d.pages||1);setTotal(d.total||0);setPage(p);}
    setLoading(false);
  };
  useEffect(()=>{load(1);},[search,winner]);

  const CLAIM_COLOR:Record<string,string>={pending:C.gold,claimed:C.green,expired:C.muted};
  const CLAIM_LABEL:Record<string,string>={pending:"รอรับ",claimed:"รับแล้ว",expired:"หมดอายุ"};

  return(
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:16}}>
      <PageHeader title="โค้ดสะสม" sub={`ทั้งหมด ${total.toLocaleString()} รายการ`}>
        <Btn variant="secondary" onClick={()=>load(page)}><RefreshCw size={13}/> รีเฟรช</Btn>
      </PageHeader>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:180}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted}}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="ค้นหาชื่อ/เบอร์/โค้ด"
            style={{width:"100%",boxSizing:"border-box",height:34,paddingLeft:30,paddingRight:10,border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,outline:"none",color:C.text}}/>
        </div>
        <select value={winner} onChange={e=>{setWinner(e.target.value);setPage(1);}}
          style={{height:34,padding:"0 8px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,color:C.text,background:C.card}}>
          <option value="">ทั้งหมด</option>
          <option value="yes">ผู้โชคดี</option>
          <option value="no">รอลุ้น</option>
        </select>
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",fontSize:13,borderCollapse:"collapse"}}>
          <thead><tr style={{background:C.cardAlt,borderBottom:`1px solid ${C.border}`}}>
            {["โค้ด","ชื่อ / เบอร์","ร้านค้า","สถานะ","วันที่"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"10px 14px",fontSize:11,fontWeight:600,color:C.muted,whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} style={{textAlign:"center",padding:40}}><Loader2 size={20} style={{animation:"spin 1s linear infinite",color:C.muted}}/></td></tr>
              : codes.length===0
                ? <tr><td colSpan={5} style={{textAlign:"center",padding:40,color:C.muted}}>ไม่พบข้อมูล</td></tr>
                : codes.map((c2,i)=>(
                  <tr key={c2.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.card:C.cardAlt}}>
                    <td style={{padding:"10px 14px",fontFamily:"monospace",fontSize:12,color:C.blue,fontWeight:600}}>{c2.code}</td>
                    <td style={{padding:"10px 14px"}}>
                      <p style={{fontWeight:500,color:C.text,margin:0,fontSize:13}}>{c2.customerName}</p>
                      <p style={{color:C.muted,margin:0,fontSize:11}}>{c2.customerPhone}</p>
                    </td>
                    <td style={{padding:"10px 14px",fontSize:12,color:C.sub}}>{c2.merchant?.name||"—"}</td>
                    <td style={{padding:"10px 14px"}}>
                      <Badge color={c2.isWinner?C.green:C.muted}>{c2.isWinner?"🏆 ผู้โชคดี":"รอลุ้น"}</Badge>
                    </td>
                    <td style={{padding:"10px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>
                      {new Date(c2.collectedAt).toLocaleDateString("th-TH",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </Card>
      {pages>1&&(
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8}}>
          <Btn size="sm" variant="ghost" onClick={()=>load(page-1)} disabled={page<=1}><ChevronLeft size={13}/></Btn>
          <span style={{fontSize:13,color:C.sub}}>{page} / {pages}</span>
          <Btn size="sm" variant="ghost" onClick={()=>load(page+1)} disabled={page>=pages}><ChevronRight size={13}/></Btn>
        </div>
      )}
    </motion.div>
  );
}

/* ════ MERCHANTS TAB ════ */
function MerchantsTab({toast}:{toast:(m:string,ok?:boolean)=>void}){
  const [merchants,setMerchants]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [page,setPage]=useState(1); const [pages,setPages]=useState(1); const [total,setTotal]=useState(0);
  const [statusFilter,setStatusFilter]=useState("pending");
  const [acting,setActing]=useState<number|null>(null);
  const [pendingCount,setPendingCount]=useState(0);

  const load=async(p=1,sf=statusFilter)=>{
    setLoading(true);
    const q=new URLSearchParams({page:String(p),...(sf&&{status:sf})});
    const r=await fetch(`/api/admin/merchants?${q}`); const d=await r.json();
    if(r.ok){setMerchants(d.merchants);setPages(d.pages);setTotal(d.total);setPage(p);}
    setLoading(false);
  };
  const loadPendingCount=async()=>{
    const r=await fetch("/api/admin/merchants?status=pending&page=1&limit=1");
    const d=await r.json(); if(d.total!==undefined)setPendingCount(d.total);
  };
  useEffect(()=>{load(1,statusFilter);loadPendingCount();},[]);
  useEffect(()=>{load(1,statusFilter);},[statusFilter]);

  const handleAction=async(id:number,action:"approve"|"reject")=>{
    setActing(id);
    const r=await fetch("/api/admin/merchants",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,action})});
    const d=await r.json();
    if(r.ok){toast(d.message,true);load(page,statusFilter);loadPendingCount();}else toast(d.error||"ไม่สำเร็จ",false);
    setActing(null);
  };

  const STATUS_MAP:Record<string,{label:string;color:string}>={pending:{label:"รออนุมัติ",color:C.gold},approved:{label:"อนุมัติแล้ว",color:C.green},rejected:{label:"ปฏิเสธ",color:C.red}};

  return(
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:16}}>
      <PageHeader title="ร้านค้าพาร์ทเนอร์" sub={`ทั้งหมด ${total} ร้าน`}>
        {pendingCount>0&&(
          <div style={{display:"flex",alignItems:"center",gap:6,background:C.goldLight,border:`1px solid ${C.goldBorder}`,borderRadius:8,padding:"5px 12px",cursor:"pointer"}} onClick={()=>setStatusFilter("pending")}>
            <Bell size={13} style={{color:C.gold}}/>
            <span style={{fontSize:12,fontWeight:600,color:C.gold}}>รออนุมัติ {pendingCount} ร้าน</span>
          </div>
        )}
        <Btn variant="secondary" onClick={()=>{load(1,statusFilter);loadPendingCount();}}><RefreshCw size={13}/></Btn>
      </PageHeader>

      {/* Status filter */}
      <div style={{display:"flex",gap:4}}>
        {[["","ทั้งหมด"],["pending","รออนุมัติ"],["approved","อนุมัติแล้ว"],["rejected","ปฏิเสธ"]].map(([v,l])=>(
          <button key={v} onClick={()=>setStatusFilter(v)}
            style={{padding:"5px 14px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${statusFilter===v?C.blue:C.border}`,background:statusFilter===v?C.blueLight:C.card,color:statusFilter===v?C.blue:C.sub}}>
            {l}
          </button>
        ))}
      </div>

      {loading
        ?<div style={{textAlign:"center",padding:40}}><Loader2 size={20} style={{animation:"spin 1s linear infinite",color:C.muted}}/></div>
        :merchants.length===0
          ?<Card><p style={{textAlign:"center",color:C.muted,padding:20}}>{statusFilter==="pending"?"ไม่มีร้านรออนุมัติ 🎉":"ไม่พบร้านค้า"}</p></Card>
          :<div style={{display:"flex",flexDirection:"column",gap:10}}>
            {merchants.map(m=>{
              const sm=STATUS_MAP[m.status]||STATUS_MAP.pending;
              return(
                <Card key={m.id} style={{padding:"14px 16px",border:m.status==="pending"?`1px solid ${C.goldBorder}`:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    {/* Avatar */}
                    <div style={{width:40,height:40,borderRadius:10,background:C.blueLight,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:15,color:C.blue,flexShrink:0}}>
                      {m.name[0]}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                        <p style={{fontWeight:600,fontSize:14,color:C.text,margin:0}}>{m.name}</p>
                        <Badge color={sm.color}>{sm.label}</Badge>
                      </div>
                      <p style={{fontSize:12,color:C.muted,margin:0}}>{m.ownerName} · {m.phone}</p>
                      {m.address&&<p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>{m.address}</p>}
                      {m.lat&&<p style={{fontSize:11,color:C.green,margin:"2px 0 0",fontFamily:"monospace"}}>📍 {Number(m.lat).toFixed(5)}, {Number(m.lng).toFixed(5)}</p>}

                      {/* Stats row */}
                      <div style={{display:"flex",gap:16,marginTop:8}}>
                        {[{l:"QR รับแล้ว",v:m.totalQuota},{l:"ใช้ไป",v:m.usedQuota},{l:"โค้ดแจก",v:m.totalCollected||0},{l:"ใบเสร็จ",v:m._count.receipts}].map(s=>(
                          <div key={s.l}><p style={{fontSize:16,fontWeight:600,color:C.text,margin:0}}>{s.v}</p><p style={{fontSize:10,color:C.muted,margin:0}}>{s.l}</p></div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                      {m.status==="pending"&&(
                        <>
                          <Btn onClick={()=>handleAction(m.id,"approve")} disabled={acting===m.id}><CheckCircle size={12}/> อนุมัติ</Btn>
                          <Btn variant="danger" onClick={()=>handleAction(m.id,"reject")} disabled={acting===m.id}><XCircle size={12}/> ปฏิเสธ</Btn>
                        </>
                      )}
                      {m.status==="approved"&&<Btn size="sm" variant="danger" onClick={()=>handleAction(m.id,"reject")} disabled={acting===m.id}><XCircle size={12}/> ระงับ</Btn>}
                      {m.status==="rejected"&&<Btn size="sm" onClick={()=>handleAction(m.id,"approve")} disabled={acting===m.id}><CheckCircle size={12}/> อนุมัติ</Btn>}
                    </div>
                  </div>
                  <p style={{fontSize:11,color:C.muted,margin:"8px 0 0"}}>สมัคร {new Date(m.createdAt).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"2-digit",hour:"2-digit",minute:"2-digit"})}</p>
                </Card>
              );
            })}
          </div>}

      {pages>1&&(
        <div style={{display:"flex",justifyContent:"center",gap:8}}>
          <Btn size="sm" variant="ghost" onClick={()=>load(page-1,statusFilter)} disabled={page<=1}><ChevronLeft size={13}/></Btn>
          <span style={{fontSize:13,color:C.sub}}>{page} / {pages}</span>
          <Btn size="sm" variant="ghost" onClick={()=>load(page+1,statusFilter)} disabled={page>=pages}><ChevronRight size={13}/></Btn>
        </div>
      )}
    </motion.div>
  );
}

/* ════ RECEIPTS TAB ════ */
function ReceiptsTab({toast}:{toast:(m:string,ok?:boolean)=>void}){
  const [receipts,setReceipts]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [status,setStatus]=useState("pending");
  const [page,setPage]=useState(1); const [pages,setPages]=useState(1); const [total,setTotal]=useState(0);
  const [reviewing,setReviewing]=useState<number|null>(null);
  const [reviewNote,setReviewNote]=useState("");
  const [previewImg,setPreviewImg]=useState("");
  const [codesPerBag,setCodesPerBag]=useState(30);

  const load=async(p=1)=>{
    setLoading(true);
    const q=new URLSearchParams({page:String(p),...(status&&{status})});
    const [rr,cr]=await Promise.all([fetch(`/api/admin/receipts?${q}`),fetch("/api/admin/campaign")]);
    const [rd,cd]=await Promise.all([rr.json(),cr.json()]);
    if(rr.ok){setReceipts(rd.receipts);setPages(rd.pages);setTotal(rd.total);setPage(p);}
    if(cd.campaigns?.[0]?.codesPerBag)setCodesPerBag(cd.campaigns[0].codesPerBag);
    setLoading(false);
  };
  useEffect(()=>{load(1);},[status]);

  const handleAction=async(id:number,action:"approve"|"reject")=>{
    const r=await fetch("/api/admin/receipts",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,action,reviewNote})});
    const d=await r.json();
    if(r.ok){toast(d.message);setReviewing(null);setReviewNote("");load(page);}else toast(d.error||"ไม่สำเร็จ",false);
  };

  const STATUS_MAP:Record<string,{label:string;color:string}>={pending:{label:"รอตรวจสอบ",color:C.gold},approved:{label:"อนุมัติ",color:C.green},rejected:{label:"ไม่อนุมัติ",color:C.red}};

  return(
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:16}}>
      {previewImg&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setPreviewImg("")}>
          <img src={previewImg} style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:12,objectFit:"contain"}}/>
          <button onClick={()=>setPreviewImg("")} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"50%",width:36,height:36,color:"#fff",cursor:"pointer",fontSize:18}}>✕</button>
        </div>
      )}

      <PageHeader title="ใบเสร็จ" sub={`${total} รายการ | ตรวจสอบ: ${codesPerBag} QR/ถุง`}>
        <Btn variant="secondary" onClick={()=>load(page)}><RefreshCw size={13}/></Btn>
      </PageHeader>

      <div style={{display:"flex",gap:4}}>
        {[["pending","รอตรวจสอบ"],["approved","อนุมัติแล้ว"],["rejected","ไม่อนุมัติ"],["","ทั้งหมด"]].map(([v,l])=>(
          <button key={v} onClick={()=>setStatus(v)}
            style={{padding:"5px 14px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${status===v?C.blue:C.border}`,background:status===v?C.blueLight:C.card,color:status===v?C.blue:C.sub}}>
            {l}
          </button>
        ))}
      </div>

      {loading
        ?<div style={{textAlign:"center",padding:40}}><Loader2 size={20} style={{animation:"spin 1s linear infinite",color:C.muted}}/></div>
        :receipts.length===0
          ?<Card><p style={{textAlign:"center",color:C.muted,padding:20}}>ไม่พบใบเสร็จ</p></Card>
          :<div style={{display:"flex",flexDirection:"column",gap:10}}>
            {receipts.map(rc=>{
              const sm=STATUS_MAP[rc.status]||STATUS_MAP.pending;
              const qr=rc.bagCount*codesPerBag;
              return(
                <Card key={rc.id} style={{border:rc.status==="pending"?`1px solid ${C.goldBorder}`:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    {/* Thumbnail */}
                    <img src={rc.imageUrl} loading="lazy" onClick={()=>setPreviewImg(rc.imageUrl)} style={{width:64,height:64,borderRadius:8,objectFit:"cover",cursor:"pointer",border:`1px solid ${C.border}`,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                        <p style={{fontWeight:600,fontSize:14,color:C.text,margin:0}}>{rc.merchant?.name}</p>
                        <Badge color={sm.color}>{sm.label}</Badge>
                      </div>
                      <p style={{fontSize:12,color:C.muted,margin:0}}>{rc.bagCount} ถุง → <b style={{color:C.blue}}>{qr} QR</b> · {rc.merchant?.phone}</p>
                      <p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>{new Date(rc.submittedAt).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"2-digit",hour:"2-digit",minute:"2-digit"})}</p>
                      {rc.reviewNote&&<p style={{fontSize:11,color:C.red,margin:"4px 0 0"}}>หมายเหตุ: {rc.reviewNote}</p>}
                    </div>
                    {rc.status==="pending"&&reviewing!==rc.id&&(
                      <button onClick={()=>setReviewing(rc.id)} style={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:500,color:C.sub,cursor:"pointer",flexShrink:0}}>ตรวจสอบ</button>
                    )}
                  </div>

                  {reviewing===rc.id&&(
                    <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                      <div style={{marginBottom:8}}>
                        <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:4}}>หมายเหตุ (ไม่บังคับ)</label>
                        <input value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder="เช่น ใบเสร็จไม่ชัด, จำนวนถุงไม่ตรง"
                          style={{width:"100%",boxSizing:"border-box",height:34,padding:"0 10px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,outline:"none",color:C.text}}/>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <Btn onClick={()=>handleAction(rc.id,"approve")}><CheckCircle size={13}/> อนุมัติ ({qr} QR)</Btn>
                        <Btn variant="danger" onClick={()=>handleAction(rc.id,"reject")}><XCircle size={13}/> ไม่อนุมัติ</Btn>
                        <Btn variant="ghost" size="sm" onClick={()=>{setReviewing(null);setReviewNote("");}}>ยกเลิก</Btn>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>}

      {pages>1&&(
        <div style={{display:"flex",justifyContent:"center",gap:8}}>
          <Btn size="sm" variant="ghost" onClick={()=>load(page-1)} disabled={page<=1}><ChevronLeft size={13}/></Btn>
          <span style={{fontSize:13,color:C.sub}}>{page} / {pages}</span>
          <Btn size="sm" variant="ghost" onClick={()=>load(page+1)} disabled={page>=pages}><ChevronRight size={13}/></Btn>
        </div>
      )}
    </motion.div>
  );
}

/* ════ SECTION COMPONENT (must be outside SettingsTab to avoid remount) ════ */
function Section({title,icon,children}:{title:string;icon:React.ReactNode;children:React.ReactNode}){
  return(
    <Card style={{marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
        <div style={{color:C.blue}}>{icon}</div>
        <p style={{fontSize:15,fontWeight:600,color:C.text,margin:0}}>{title}</p>
      </div>
      {children}
    </Card>
  );
}

/* ════ SETTINGS TAB ════ */
function SettingsTab({toast}:{toast:(m:string,ok?:boolean)=>void}){
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [prizes,setPrizes]=useState<Prize[]>([]);
  const [editCamp,setEditCamp]=useState<Campaign|null>(null);
  const [config,setConfig]=useState<Record<string,string>>({});
  const [localConfig,setLocalConfig]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState<string|null>(null);
  const [showNewPrize,setShowNewPrize]=useState(false);
  const [newPrize,setNewPrize]=useState({name:"",value:"",quantity:"",sortOrder:"0"});
  const [newCamp,setNewCamp]=useState<Partial<Campaign>|null>(null);
  const [showAdminPw,setShowAdminPw]=useState(false);
  const [newAdminPw,setNewAdminPw]=useState(""); const [newAdminUser,setNewAdminUser]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);
    const [cr,pr,cfr]=await Promise.all([fetch("/api/admin/campaign"),fetch("/api/admin/prizes"),fetch("/api/admin/config")]);
    const [cd,pd,cfd]=await Promise.all([cr.json(),pr.json(),cfr.json()]);
    if(cd.campaigns){setCampaigns(cd.campaigns);if(!editCamp&&cd.campaigns[0])setEditCamp({...cd.campaigns[0]});}
    if(pd.prizes)setPrizes(pd.prizes);
    if(cfd.config){setConfig(cfd.config);setLocalConfig({...cfd.config});}
    setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);

  const saveCampaign=async()=>{
    if(!editCamp)return; setSaving("camp");
    const payload={
      id: editCamp.id,
      name: editCamp.name,
      description: editCamp.description||"",
      startDate: editCamp.startDate?.slice(0,10),
      endDate: editCamp.endDate?.slice(0,10),
      totalBudget: Number(editCamp.totalBudget)||1000000,
      codesPerBag: Number(editCamp.codesPerBag)||30,
    };
    const r=await fetch("/api/admin/campaign",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const d=await r.json();
    if(r.ok)toast("บันทึกแคมเปญสำเร็จ"); else toast(d.error||"ไม่สำเร็จ",false);
    setSaving(null); load();
  };
  const createCampaign=async()=>{
    if(!newCamp?.name||!newCamp.startDate||!newCamp.endDate){toast("กรอกข้อมูลให้ครบ",false);return;}
    setSaving("newcamp");
    const r=await fetch("/api/admin/campaign",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...newCamp,codesPerBag:newCamp.codesPerBag||30})});
    if(r.ok){toast("สร้างแคมเปญสำเร็จ");setNewCamp(null);load();}else toast("ไม่สำเร็จ",false);
    setSaving(null);
  };
  const toggleActive=async(id:number,isActive:boolean)=>{
    const r=await fetch("/api/admin/campaign",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,isActive})});
    if(r.ok){toast(isActive?"เปิดแล้ว":"ปิดแล้ว");load();}else toast("ไม่สำเร็จ",false);
  };
  const addPrize=async()=>{
    if(!editCamp||!newPrize.name||!newPrize.value||!newPrize.quantity){toast("กรอกให้ครบ",false);return;}
    const r=await fetch("/api/admin/prizes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignId:editCamp.id,...newPrize})});
    if(r.ok){toast("เพิ่มรางวัลสำเร็จ");setShowNewPrize(false);setNewPrize({name:"",value:"",quantity:"",sortOrder:"0"});load();}else toast("ไม่สำเร็จ",false);
  };
  const deletePrize=async(id:number)=>{
    if(!confirm("ยืนยันลบรางวัลนี้?"))return;
    const r=await fetch("/api/admin/prizes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    if(r.ok){toast("ลบสำเร็จ");load();}else toast("ลบไม่ได้ (มีรหัสผูกอยู่)",false);
  };
  const saveConfig=async(keys:string[])=>{
    setSaving("config");
    const updates=Object.fromEntries(keys.map(k=>[k,localConfig[k]??config[k]]));
    const r=await fetch("/api/admin/config",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(updates)});
    const d=await r.json();
    if(r.ok){toast(d.message);load();}else toast(d.error||"ไม่สำเร็จ",false);
    setSaving(null);
  };
  const changeAdminPassword=async()=>{
    if(!newAdminPw||newAdminPw.length<6){toast("รหัสผ่านต้องยาวกว่า 6 ตัว",false);return;}
    const r=await fetch("/api/admin/auth",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:newAdminUser||undefined,password:newAdminPw})});
    const d=await r.json();
    if(r.ok){toast("เปลี่ยนรหัสผ่านสำเร็จ");setNewAdminPw("");setNewAdminUser("");}else toast(d.error||"ไม่สำเร็จ",false);
  };

  const cf=(k:string)=>localConfig[k]??config[k]??"";
  const setCf=(k:string,v:string)=>setLocalConfig(p=>({...p,[k]:v}));

  if(loading)return<div style={{display:"flex",justifyContent:"center",padding:60}}><Loader2 size={24} style={{animation:"spin 1s linear infinite",color:C.muted}}/></div>;



  return(
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{maxWidth:720}}>
      <PageHeader title="ตั้งค่าระบบ" sub="จัดการแคมเปญ รางวัล ค่าตัวแปร และการตั้งค่าทั้งหมด"/>

      {/* ── 1. Campaign ── */}
      <Section title="แคมเปญ" icon={<BarChart3 size={16}/>}>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {campaigns.map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.cardAlt}}>
              <div style={{flex:1}}>
                <p style={{fontWeight:500,fontSize:13,color:C.text,margin:0}}>{c.name}</p>
                <p style={{fontSize:11,color:C.muted,margin:0}}>{(c._count?.codes||0).toLocaleString()} รหัส · หมดเขต {new Date(c.endDate).toLocaleDateString("th-TH")}</p>
              </div>
              <button onClick={()=>toggleActive(c.id,!c.isActive)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
                {c.isActive?<ToggleRight size={24} style={{color:C.blue}}/>:<ToggleLeft size={24} style={{color:C.muted}}/>}
              </button>
              <Badge color={c.isActive?C.green:C.muted}>{c.isActive?"เปิด":"ปิด"}</Badge>
              <button onClick={()=>setEditCamp({...c})} style={{background:C.blueLight,border:`1px solid ${C.blueBorder}`,borderRadius:6,padding:"4px 8px",cursor:"pointer",color:C.blue,display:"flex",alignItems:"center",gap:4,fontSize:12}}>
                <Pencil size={11}/> แก้ไข
              </button>
            </div>
          ))}
        </div>

        {/* Create new campaign */}
        {!newCamp
          ? <Btn variant="secondary" onClick={()=>setNewCamp({name:"",description:"",startDate:"",endDate:"",totalBudget:0,codesPerBag:30,isActive:false})}><Plus size={13}/> สร้างแคมเปญใหม่</Btn>
          : <div style={{border:`1px solid ${C.blueBorder}`,borderRadius:10,padding:14,background:C.blueLight}}>
              <p style={{fontSize:13,fontWeight:600,color:C.blue,margin:"0 0 12px"}}>สร้างแคมเปญใหม่</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div style={{gridColumn:"1/-1"}}><InputField label="ชื่อแคมเปญ *" value={newCamp.name||""} onChange={v=>setNewCamp(p=>({...p,name:v}))} required/></div>
                <InputField label="วันเริ่ม *" value={newCamp.startDate||""} type="date" onChange={v=>setNewCamp(p=>({...p,startDate:v}))} required/>
                <InputField label="วันหมดเขต *" value={newCamp.endDate||""} type="date" onChange={v=>setNewCamp(p=>({...p,endDate:v}))} required/>
                <InputField label="งบประมาณ (บาท)" value={newCamp.totalBudget||0} type="number" onChange={v=>setNewCamp(p=>({...p,totalBudget:Number(v)}))}/>
                <InputField label="QR ต่อถุง" value={newCamp.codesPerBag||30} type="number" onChange={v=>setNewCamp(p=>({...p,codesPerBag:Number(v)}))} note="ค่าเริ่มต้น 30"/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn onClick={createCampaign} disabled={saving==="newcamp"}>{saving==="newcamp"?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Plus size={12}/>} สร้าง</Btn>
                <Btn variant="ghost" size="sm" onClick={()=>setNewCamp(null)}>ยกเลิก</Btn>
              </div>
            </div>}

        {/* Edit campaign */}
        {editCamp&&(
          <div style={{marginTop:16,borderTop:`1px solid ${C.border}`,paddingTop:16}}>
            <p style={{fontSize:13,fontWeight:600,color:C.text,margin:"0 0 12px"}}>แก้ไข: {editCamp.name}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div style={{gridColumn:"1/-1"}}><InputField label="ชื่อแคมเปญ" value={editCamp.name} onChange={v=>setEditCamp(p=>p&&({...p,name:v}))}/></div>
              <InputField label="วันเริ่ม" type="date" value={editCamp.startDate?.slice(0,10)||""} onChange={v=>setEditCamp(p=>p&&({...p,startDate:v}))}/>
              <InputField label="วันหมดเขต" type="date" value={editCamp.endDate?.slice(0,10)||""} onChange={v=>setEditCamp(p=>p&&({...p,endDate:v}))}/>
              <InputField label="งบประมาณ" type="number" value={editCamp.totalBudget} onChange={v=>setEditCamp(p=>p&&({...p,totalBudget:Number(v)}))}/>
              <InputField label="QR ต่อถุงซอส 1 ถุง" type="number" value={editCamp.codesPerBag??30} onChange={v=>setEditCamp(p=>p&&({...p,codesPerBag:Number(v)}))} note={`ปัจจุบัน: ${editCamp.codesPerBag??30} QR/ถุง`}/>
            </div>
            <Btn onClick={saveCampaign} disabled={saving==="camp"}>{saving==="camp"?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Save size={12}/>} บันทึก</Btn>
          </div>
        )}
      </Section>

      {/* ── 2. Prizes ── */}
      <Section title="รางวัล" icon={<QrCode size={16}/>}>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
          {prizes.filter(p=>!editCamp||p.campaignId===editCamp.id).map((p,i)=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.cardAlt}}>
              <span style={{fontSize:18}}>{["🥇","🥈","🥉","🎁","🎀"][i]||"🎁"}</span>
              <div style={{flex:1}}>
                <p style={{fontWeight:500,fontSize:13,color:C.text,margin:0}}>{p.name}</p>
                <p style={{fontSize:11,color:C.muted,margin:0}}>฿{p.value.toLocaleString()} · เหลือ {p.remaining}/{p.quantity}</p>
              </div>
              <div style={{height:4,width:80,borderRadius:2,background:C.bg,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:2,background:C.blue,width:`${(p.remaining/p.quantity)*100}%`}}/>
              </div>
              <button onClick={()=>deletePrize(p.id)} style={{background:"#FEF2F2",border:`1px solid ${C.redBorder}`,borderRadius:6,padding:"4px 8px",cursor:"pointer",color:C.red,display:"flex",alignItems:"center",gap:4,fontSize:12}}>
                <Trash2 size={11}/> ลบ
              </button>
            </div>
          ))}
        </div>
        {!showNewPrize
          ?<Btn variant="secondary" onClick={()=>setShowNewPrize(true)}><Plus size={13}/> เพิ่มรางวัล</Btn>
          :<div style={{border:`1px solid ${C.border}`,borderRadius:10,padding:14,background:C.cardAlt}}>
            <p style={{fontSize:13,fontWeight:600,color:C.text,margin:"0 0 10px"}}>เพิ่มรางวัลใหม่</p>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8,marginBottom:10}}>
              <InputField label="ชื่อรางวัล *" value={newPrize.name} onChange={v=>setNewPrize(p=>({...p,name:v}))} placeholder="เช่น ส่วนลด 50 บาท"/>
              <InputField label="มูลค่า (บาท)" type="number" value={newPrize.value} onChange={v=>setNewPrize(p=>({...p,value:v}))}/>
              <InputField label="จำนวน" type="number" value={newPrize.quantity} onChange={v=>setNewPrize(p=>({...p,quantity:v}))}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={addPrize}><Save size={12}/> บันทึก</Btn>
              <Btn variant="ghost" size="sm" onClick={()=>{setShowNewPrize(false);setNewPrize({name:"",value:"",quantity:"",sortOrder:"0"});}}>ยกเลิก</Btn>
            </div>
          </div>}
      </Section>

      {/* ── 3. Collect Config ── */}
      <Section title="ตั้งค่าระบบสะสมโค้ด" icon={<Sliders size={16}/>}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <ToggleSwitch value={cf("registration_open")!=="false"} onChange={v=>setCf("registration_open",String(v))} label="เปิดรับสมัครร้านค้าใหม่" sub="ปิดเพื่อหยุดรับ merchant รายใหม่ชั่วคราว"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
            <InputField label="สิทธิ์เก็บโค้ดสูงสุด/วัน/คน" type="number" value={cf("daily_collect_limit")||"3"} onChange={v=>setCf("daily_collect_limit",v)} note="นับรวมทุกร้าน"/>
            <InputField label="รัศมี GPS (เมตร)" type="number" value={cf("gps_radius_m")||"20"} onChange={v=>setCf("gps_radius_m",v)} note="ค่าเริ่มต้น 20 เมตร"/>
          </div>
          <div style={{paddingTop:8}}>
            <Btn onClick={()=>saveConfig(["registration_open","daily_collect_limit","gps_radius_m"])} disabled={saving==="config"}>
              {saving==="config"?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Save size={12}/>} บันทึกการตั้งค่า
            </Btn>
          </div>
        </div>
      </Section>

      {/* ── 4. OTP ── */}
      <Section title="ตั้งค่า OTP" icon={<Shield size={16}/>}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <InputField label="OTP หมดอายุ (นาที)" type="number" value={cf("otp_expire_min")} onChange={v=>setCf("otp_expire_min",v)} note="ค่าเริ่มต้น 5 นาที"/>
          <InputField label="รอก่อนขอ OTP ใหม่ (วินาที)" type="number" value={cf("otp_cooldown_sec")} onChange={v=>setCf("otp_cooldown_sec",v)} note="ค่าเริ่มต้น 60 วินาที"/>
        </div>
        <Btn onClick={()=>saveConfig(["otp_expire_min","otp_cooldown_sec"])} disabled={saving==="config"}>
          {saving==="config"?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Save size={12}/>} บันทึก
        </Btn>
      </Section>

      {/* ── 5. Admin account ── */}
      <Section title="บัญชีแอดมิน" icon={<Shield size={16}/>}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <InputField label="ชื่อผู้ใช้ใหม่ (ไม่บังคับ)" value={newAdminUser} onChange={setNewAdminUser} placeholder="เว้นว่างถ้าไม่เปลี่ยน"/>
          <div>
            <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:5}}>รหัสผ่านใหม่</label>
            <div style={{position:"relative"}}>
              <input value={newAdminPw} onChange={e=>setNewAdminPw(e.target.value)} type={showAdminPw?"text":"password"} placeholder="อย่างน้อย 6 ตัวอักษร"
                style={{width:"100%",boxSizing:"border-box",height:36,padding:"0 32px 0 10px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,color:C.text,outline:"none"}}/>
              <button onClick={()=>setShowAdminPw(p=>!p)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,padding:0}}>
                {showAdminPw?<EyeOff size={13}/>:<Eye size={13}/>}
              </button>
            </div>
          </div>
        </div>
        <Btn variant="danger" onClick={changeAdminPassword}><Shield size={12}/> เปลี่ยนรหัสผ่าน</Btn>
      </Section>
    </motion.div>
  );
}

/* ════ MAIN ADMIN PAGE ════ */
export default function AdminPage(){
  const [authed,setAuthed]=useState<boolean|null>(null);
  const [tab,setTab]=useState<"dashboard"|"entries"|"codes"|"luckydraw"|"merchants"|"receipts"|"settings"|"content"|"banners"|"qrrules">("dashboard");
  const [pendingCount,setPendingCount]=useState(0);
  const [pendingMerchantsCount,setPendingMerchantsCount]=useState(0);
  const {toasts,add:toast}=useToast();

  useEffect(()=>{
    fetch("/api/admin/auth").then(r=>r.json()).then(d=>setAuthed(!!d.user)).catch(()=>setAuthed(false));
  },[]);

  useEffect(()=>{
    if(!authed)return;
    const poll=()=>{
      fetch("/api/admin/receipts?status=pending&page=1&limit=1").then(r=>r.json()).then(d=>{if(d.total!==undefined)setPendingCount(d.total);}).catch(()=>{});
      fetch("/api/admin/merchants?status=pending&page=1&limit=1").then(r=>r.json()).then(d=>{if(d.total!==undefined)setPendingMerchantsCount(d.total);}).catch(()=>{});
    };
    poll(); const t=setInterval(poll,30000); return()=>clearInterval(t);
  },[authed]);

  const logout=async()=>{await fetch("/api/admin/auth",{method:"DELETE"});setAuthed(false);};

  if(authed===null)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <Loader2 size={24} style={{animation:"spin 1s linear infinite",color:C.muted}}/>
    </div>
  );
  if(!authed)return<LoginPage onLogin={()=>setAuthed(true)}/>;

  const TABS=[
    {key:"dashboard", icon:<BarChart3 size={15}/>, label:"Dashboard",    badge:0},
    {key:"entries",   icon:<Users    size={15}/>, label:"ผู้เข้าร่วม",   badge:0},
    {key:"codes",     icon:<QrCode   size={15}/>, label:"Lucky Code",    badge:0},
    {key:"luckydraw", icon:<Trophy   size={15}/>, label:"จับรางวัล",    badge:0},
    {key:"merchants", icon:<Store    size={15}/>, label:"ร้านค้า",       badge:pendingMerchantsCount},
    {key:"receipts",  icon:<FileText size={15}/>, label:"ใบเสร็จ",       badge:pendingCount},
    {key:"settings",  icon:<Settings size={15}/>, label:"ตั้งค่า",       badge:0},
    {key:"content",   icon:<Bell     size={15}/>, label:"เนื้อหา",       badge:0},
    {key:"banners",   icon:<Tag      size={15}/>, label:"แบนเนอร์",     badge:0},
    {key:"qrrules",   icon:<ScanLine size={15}/>, label:"Smart QR",     badge:0},
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Toasts */}
      <div style={{position:"fixed",top:16,right:16,zIndex:200,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
        <AnimatePresence>
          {toasts.map(t=>(
            <motion.div key={t.id} initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:40}}
              style={{background:t.ok?C.green:C.red,color:"#fff",padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:500,pointerEvents:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>
              {t.ok?"✅":"❌"} {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sidebar — dark */}
      <aside style={{width:232,minHeight:"100vh",background:"#0F172A",display:"flex",flexDirection:"column",position:"fixed",left:0,top:0,bottom:0,zIndex:10,boxShadow:"4px 0 24px rgba(0,0,0,0.3)"}}>
        <div style={{padding:"20px 16px 16px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#6366F1,#4F46E5)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:18,flexShrink:0}}>ป</div>
            <div>
              <p style={{fontSize:15,fontWeight:700,color:"#F1F5F9",margin:0}}>ปังจัง</p>
              <p style={{fontSize:10,color:"#64748B",margin:0,letterSpacing:"0.5px"}}>LUCKY DRAW ADMIN</p>
            </div>
          </div>
        </div>
        <nav style={{flex:1,padding:"8px",overflowY:"auto"}}>
          {TABS.map(t=>{
            const isActive=tab===t.key;
            return(
              <button key={t.key} onClick={()=>setTab(t.key as any)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:2,fontSize:13,fontWeight:isActive?600:400,textAlign:"left",transition:"all .15s",
                  background:isActive?"rgba(99,102,241,0.25)":"transparent",
                  color:isActive?"#A5B4FC":"#94A3B8",
                  borderLeft:isActive?"3px solid #6366F1":"3px solid transparent"}}>
                <span style={{opacity:isActive?1:0.6}}>{t.icon}</span>
                <span style={{flex:1}}>{t.label}</span>
                {t.badge>0&&<span style={{background:"#EF4444",color:"#fff",borderRadius:10,minWidth:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,padding:"0 4px"}}>{t.badge>9?"9+":t.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{padding:"8px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.04)",marginBottom:4}}>
            <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>A</div>
            <div style={{flex:1}}><p style={{fontSize:12,fontWeight:600,color:"#F1F5F9",margin:0}}>Administrator</p></div>
          </div>
          <button onClick={logout}
            style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,color:"#64748B",background:"transparent"}}>
            <LogOut size={13}/> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{flex:1,marginLeft:232,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"0 24px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:9,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
          <span style={{fontSize:12,fontWeight:600,color:C.text}}>{TABS.find(t=>t.key===tab)?.label||"Dashboard"}</span>
          {(pendingCount+pendingMerchantsCount)>0&&<div style={{display:"flex",alignItems:"center",gap:6,background:"#FEF2F2",border:"1px solid rgba(229,62,62,0.2)",borderRadius:8,padding:"4px 10px"}}><div style={{width:6,height:6,borderRadius:"50%",background:C.red}}/><span style={{fontSize:11,fontWeight:600,color:C.red}}>{pendingCount+pendingMerchantsCount} รายการรอ</span></div>}
        </div>
        <div style={{flex:1,padding:24,maxWidth:960,width:"100%"}}>
          <AnimatePresence mode="wait">
            {tab==="dashboard"&&<DashboardTab key="d"/>}
            {tab==="entries"  &&<EntriesTab   key="e" toast={toast}/>}
            {tab==="codes"    &&<CodesTab     key="c" toast={toast}/>}
            {tab==="luckydraw"&&<LuckyDrawTab key="l" toast={toast}/>}
            {tab==="merchants"&&<MerchantsTab key="m" toast={toast}/>}
            {tab==="receipts" &&<ReceiptsTab  key="r" toast={toast}/>}
            {tab==="settings" &&<SettingsTab  key="s" toast={toast}/> }
            {tab==="content"  &&<ContentTab  key="ct" toast={toast}/>}
            {tab==="banners"  &&<BannersTab  key="b" toast={toast}/>}
            {tab==="qrrules"  &&<QrRulesTab  key="qr" toast={toast}/>}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ════ BANNER TAB ════ */
const POSITIONS = [
  { value: "user_topbar",       label: "👤 User — Top bar" },
  { value: "user_hero",         label: "👤 User — Hero banner" },
  { value: "user_infeed",       label: "👤 User — In-feed card" },
  { value: "user_popup",        label: "👤 User — Popup" },
  { value: "user_sticky",       label: "👤 User — Sticky bar" },
  { value: "user_interstitial", label: "👤 User — Interstitial" },
  { value: "merchant_hero",     label: "🏪 Merchant — Hero" },
  { value: "merchant_card",     label: "🏪 Merchant — Card" },
  { value: "merchant_popup",    label: "🏪 Merchant — Popup" },
  { value: "admin_alert",       label: "🔧 Admin — Alert bar" },
];
const BTYPES = [
  { value: "announcement", label: "Announcement bar" },
  { value: "image",        label: "Image banner" },
  { value: "card",         label: "Card (in-feed)" },
  { value: "popup",        label: "Popup modal" },
  { value: "interstitial", label: "Interstitial fullscreen" },
  { value: "sticky",       label: "Sticky bar (float)" },
];
const BFORM0 = {
  position:"user_topbar",type:"announcement",title:"",body:"",imageUrl:"",
  linkUrl:"",linkTarget:"_blank",ctaText:"",bgColor:"#FD1803",textColor:"#FFFFFF",
  targetAudience:"all",showMobile:true,showDesktop:true,
  startsAt:"",endsAt:"",priority:"0",delayMs:"0",dismissDays:"1",isActive:false,
};

/* ════ CONTENT TAB ════ */
function ContentTab({toast}:{toast:(m:string,ok?:boolean)=>void}){
  const [config,setConfig]=useState<Record<string,string>>({});
  const [local,setLocal]=useState<Record<string,string>>({});
  const [saving,setSaving]=useState("");
  const [loading,setLoading]=useState(true);
  const [steps,setSteps]=useState<{n:number;e:string;t:string;d:string}[]>([]);
  const [slides,setSlides]=useState<{emoji:string;title:string;sub:string}[]>([]);

  const load=async()=>{
    setLoading(true);
    const r=await fetch("/api/admin/config");
    const d=await r.json();
    if(d.config){
      setConfig(d.config);
      setLocal(d.config);
      try{ setSteps(JSON.parse(d.config.how_to_steps||"[]")); }catch{ setSteps([]); }
      try{ setSlides(JSON.parse(d.config.hero_slides||"[]")); }catch{ setSlides([]); }
    }
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const cf=(k:string)=>local[k]??config[k]??"";
  const setCf=(k:string,v:string)=>setLocal(p=>({...p,[k]:v}));

  const save=async(keys:string[],extraObj?:Record<string,string>)=>{
    setSaving(keys[0]||"all");
    const updates:Record<string,string>={};
    for(const k of keys) updates[k]=local[k]??config[k]??"";
    if(extraObj) Object.assign(updates,extraObj);
    const r=await fetch("/api/admin/config",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(updates)});
    const d=await r.json();
    if(r.ok){toast(d.message||"บันทึกสำเร็จ");load();}else toast(d.error||"ไม่สำเร็จ",false);
    setSaving("");
  };

  const updateStep=(i:number,field:string,val:string)=>{
    const ns=[...steps]; (ns[i] as any)[field]=val; setSteps(ns);
  };
  const saveSteps=()=>save(["how_to_steps"],{how_to_steps:JSON.stringify(steps)});

  const updateSlide=(i:number,field:string,val:string)=>{
    const ns=[...slides]; (ns[i] as any)[field]=val; setSlides(ns);
  };
  const saveSlides=()=>save(["hero_slides"],{hero_slides:JSON.stringify(slides)});

  if(loading)return<div style={{display:"flex",justifyContent:"center",padding:60}}><Loader2 size={24} style={{animation:"spin 1s linear infinite",color:C.muted}}/></div>;

  return(
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{maxWidth:720}}>
      <PageHeader title="จัดการเนื้อหา" sub="แก้ไขข้อความและ UI ที่แสดงบนหน้าผู้ใช้"/>

      {/* ── App Header ── */}
      <Section title="ส่วนหัวแอป" icon={<Home size={16}/>}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <InputField label="ชื่อแอป" value={cf("app_name")} onChange={v=>setCf("app_name",v)}/>
          <InputField label="คำโปรยใต้ชื่อ" value={cf("app_subtitle")} onChange={v=>setCf("app_subtitle",v)}/>
        </div>
        <Btn onClick={()=>save(["app_name","app_subtitle"])} disabled={saving==="app_name"}>
          {saving==="app_name"?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Save size={12}/>} บันทึก
        </Btn>
      </Section>

      {/* ── Bottom Navbar ── */}
      <Section title="เมนูด้านล่าง (Bottom Nav)" icon={<ToggleRight size={16}/>}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
          {[
            {key:"nav_home",label:"🏠 หน้าหลัก"},
            {key:"nav_prizes",label:"🏆 รางวัล"},
            {key:"nav_scan",label:"📷 สแกน (กลาง)"},
            {key:"nav_check",label:"🔍 ตรวจสอบ"},
            {key:"nav_more",label:"••• อื่นๆ"},
          ].map(f=>(
            <InputField key={f.key} label={f.label} value={cf(f.key)} onChange={v=>setCf(f.key,v)}/>
          ))}
        </div>
        <Btn onClick={()=>save(["nav_home","nav_prizes","nav_scan","nav_check","nav_more"])} disabled={saving==="nav_home"}>
          {saving==="nav_home"?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Save size={12}/>} บันทึก
        </Btn>
      </Section>

      {/* ── Scan Button ── */}
      <Section title="ปุ่มสแกน & รายละเอียด" icon={<QrCode size={16}/>}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <InputField label="ข้อความปุ่ม Scan" value={cf("scan_btn_text")} onChange={v=>setCf("scan_btn_text",v)}/>
          <InputField label="หัวข้อส่วนรางวัล" value={cf("prize_section_title")} onChange={v=>setCf("prize_section_title",v)}/>
          <div style={{gridColumn:"1/-1"}}>
            <InputField label="หัวข้อ Daily Limit" value={cf("daily_limit_title")} onChange={v=>setCf("daily_limit_title",v)}/>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <InputField label="รายละเอียด Daily Limit" value={cf("daily_limit_sub")} onChange={v=>setCf("daily_limit_sub",v)}/>
          </div>
        </div>
        <Btn onClick={()=>save(["scan_btn_text","prize_section_title","daily_limit_title","daily_limit_sub"])} disabled={saving==="scan_btn_text"}>
          {saving==="scan_btn_text"?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Save size={12}/>} บันทึก
        </Btn>
      </Section>

      {/* ── Fallback Hero Slides ── */}
      <Section title="Slides หน้าหลัก (Fallback เมื่อไม่มี Banner)" icon={<BarChart3 size={16}/>}>
        <p style={{fontSize:12,color:C.muted,marginBottom:12}}>* ถ้ามี Banner ประเภท Hero อยู่ ระบบจะใช้รูปแทน slides นี้</p>
        {slides.map((s,i)=>(
          <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:12,marginBottom:10,background:C.cardAlt}}>
            <p style={{fontSize:12,fontWeight:600,color:C.sub,marginBottom:8}}>Slide {i+1}</p>
            <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:8,marginBottom:8}}>
              <InputField label="Emoji" value={s.emoji} onChange={v=>updateSlide(i,"emoji",v)}/>
              <InputField label="หัวข้อ" value={s.title} onChange={v=>updateSlide(i,"title",v)}/>
            </div>
            <InputField label="คำอธิบาย" value={s.sub} onChange={v=>updateSlide(i,"sub",v)}/>
          </div>
        ))}
        <Btn onClick={saveSlides} disabled={saving==="hero_slides"}>
          {saving==="hero_slides"?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Save size={12}/>} บันทึก Slides
        </Btn>
      </Section>

      {/* ── How-To Steps ── */}
      <Section title="ขั้นตอนวิธีรับโค้ด" icon={<Shield size={16}/>}>
        {steps.map((s,i)=>(
          <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:12,marginBottom:10,background:C.cardAlt}}>
            <p style={{fontSize:12,fontWeight:600,color:C.sub,marginBottom:8}}>ขั้นตอนที่ {s.n}</p>
            <div style={{display:"grid",gridTemplateColumns:"60px 1fr",gap:8,marginBottom:8}}>
              <InputField label="Emoji" value={s.e} onChange={v=>updateStep(i,"e",v)}/>
              <InputField label="หัวข้อ" value={s.t} onChange={v=>updateStep(i,"t",v)}/>
            </div>
            <InputField label="คำอธิบาย" value={s.d} onChange={v=>updateStep(i,"d",v)}/>
          </div>
        ))}
        <Btn onClick={saveSteps} disabled={saving==="how_to_steps"}>
          {saving==="how_to_steps"?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Save size={12}/>} บันทึกขั้นตอน
        </Btn>
      </Section>
    </motion.div>
  );
}

/* ════ LUCKY DRAW TAB ════ */
function LuckyDrawTab({toast}:{toast:(m:string,ok?:boolean)=>void}){
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [prizes,setPrizes]=useState<Prize[]>([]);
  const [selCamp,setSelCamp]=useState<number|null>(null);
  const [selPrize,setSelPrize]=useState<number|null>(null);
  const [count,setCount]=useState(1);
  const [running,setRunning]=useState(false);
  const [winners,setWinners]=useState<{id:number;name:string;phone:string;code:string}[]>([]);
  const [stats,setStats]=useState<{eligible:number}|null>(null);

  useEffect(()=>{
    fetch("/api/admin/campaign").then(r=>r.json()).then(d=>{
      if(d.campaigns){
        setCampaigns(d.campaigns);
        const active=d.campaigns.find((c:Campaign)=>c.isActive)||d.campaigns[0];
        if(active){setSelCamp(active.id);setPrizes(active.prizes||[]);}
      }
    });
  },[]);

  useEffect(()=>{
    if(!selCamp)return;
    fetch(`/api/admin/collections?page=1&winner=no`).then(r=>r.json()).then(d=>{
      setStats({eligible:d.total||0});
    });
    const camp=campaigns.find(c=>c.id===selCamp);
    if(camp)setPrizes((camp as any).prizes||[]);
  },[selCamp,campaigns]);

  const runDraw=async()=>{
    if(!selCamp||!selPrize||count<1){toast("กรุณาเลือกแคมเปญ รางวัล และจำนวน",false);return;}
    if(!confirm(`ยืนยันจับรางวัล ${count} คน?`))return;
    setRunning(true); setWinners([]);
    const r=await fetch("/api/admin/lucky-draw",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({campaignId:selCamp,prizeId:selPrize,count})});
    const d=await r.json();
    if(r.ok){setWinners(d.winners);toast(d.message);}
    else toast(d.error||"ไม่สำเร็จ",false);
    setRunning(false);
  };

  return(
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:16}}>
      <PageHeader title="จับรางวัล" sub="สุ่มผู้โชคดีจากโค้ดที่สะสม"/>

      <Card>
        <p style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>ตั้งค่าการจับรางวัล</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div>
            <label style={{fontSize:12,color:C.sub,display:"block",marginBottom:5}}>แคมเปญ</label>
            <select value={selCamp||""} onChange={e=>setSelCamp(Number(e.target.value))}
              style={{width:"100%",height:36,padding:"0 10px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,color:C.text,background:C.card}}>
              {campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:12,color:C.sub,display:"block",marginBottom:5}}>รางวัล</label>
            <select value={selPrize||""} onChange={e=>setSelPrize(Number(e.target.value))}
              style={{width:"100%",height:36,padding:"0 10px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,color:C.text,background:C.card}}>
              <option value="">— เลือกรางวัล —</option>
              {prizes.map(p=><option key={p.id} value={p.id}>{p.name} (เหลือ {p.remaining}/{p.quantity})</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,color:C.sub,display:"block",marginBottom:5}}>จำนวนผู้โชคดี</label>
          <input type="number" min={1} max={stats?.eligible||999} value={count}
            onChange={e=>setCount(Math.max(1,parseInt(e.target.value)||1))}
            style={{width:120,height:36,padding:"0 10px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,color:C.text,background:C.card,outline:"none"}}/>
          {stats&&<span style={{fontSize:12,color:C.muted,marginLeft:10}}>สิทธิ์ที่ยังไม่ได้รางวัล: {stats.eligible.toLocaleString()} รายการ</span>}
        </div>
        <Btn onClick={runDraw} disabled={running||!selPrize}>
          {running?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> กำลังสุ่ม...</>
                  :<><Trophy size={13}/> จับรางวัลเลย</>}
        </Btn>
      </Card>

      {winners.length>0&&(
        <Card>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <Trophy size={18} style={{color:C.gold}}/>
            <p style={{fontSize:14,fontWeight:600,color:C.text,margin:0}}>ผู้โชคดี {winners.length} คน 🎉</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {winners.map((w,i)=>(
              <div key={w.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:8,
                background:i%2===0?C.card:C.cardAlt,border:`1px solid ${C.border}`}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:600,color:C.text,margin:0,fontSize:13}}>{w.name}</p>
                  <p style={{color:C.muted,margin:0,fontSize:11}}>{w.phone}</p>
                </div>
                <code style={{fontSize:11,color:C.blue,background:C.blueLight,padding:"2px 8px",borderRadius:4}}>{w.code}</code>
              </div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}

/* ════ IMAGE UPLOAD COMPONENT ════ */
function ImageUpload({value,onChange,label="Image URL (รูปภาพ)"}:{value:string;onChange:(url:string)=>void;label?:string}){
  const [uploading,setUploading]=React.useState(false);
  const [dragOver,setDragOver]=React.useState(false);
  const inputRef=React.useRef<HTMLInputElement>(null);

  const upload=async(file:File)=>{
    if(!file)return;
    const allowed=["image/jpeg","image/jpg","image/png","image/gif","image/webp"];
    if(!allowed.includes(file.type)){alert("รองรับเฉพาะ JPG, PNG, GIF, WEBP");return;}
    if(file.size>5*1024*1024){alert("ไฟล์ใหญ่เกิน 5MB");return;}
    setUploading(true);
    try{
      const base64:string=await new Promise((res,rej)=>{
        const reader=new FileReader();
        reader.onload=()=>res(reader.result as string);
        reader.onerror=rej;
        reader.readAsDataURL(file);
      });
      const r=await fetch("/api/upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:base64,filename:file.name})});
      const d=await r.json();
      if(r.ok)onChange(d.url); else alert(d.error||"อัปโหลดไม่สำเร็จ");
    }catch{alert("เกิดข้อผิดพลาด");}
    setUploading(false);
  };

  return(
    <div>
      <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:5}}>{label}</label>
      <div
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)upload(f);}}
        onClick={()=>inputRef.current?.click()}
        style={{border:`2px dashed ${dragOver?C.blue:C.borderMid}`,borderRadius:8,padding:"12px",
          cursor:"pointer",transition:"border-color .2s",background:dragOver?C.blueLight:"transparent",
          display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}}
          onChange={e=>{const f=e.target.files?.[0];if(f)upload(f);e.target.value="";}}/>
        {uploading
          ?<><Loader2 size={16} style={{animation:"spin 1s linear infinite",color:C.blue,flexShrink:0}}/><span style={{fontSize:12,color:C.sub}}>กำลังอัปโหลด...</span></>
          :<><Upload size={16} style={{color:C.muted,flexShrink:0}}/><span style={{fontSize:12,color:C.muted}}>คลิกหรือลากรูปมาวาง (JPG/PNG ≤5MB)</span></>}
      </div>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder="หรือวาง URL โดยตรง: https://..."
        style={{width:"100%",boxSizing:"border-box",height:34,padding:"0 10px",
          border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:12,color:C.text,background:C.card,outline:"none"}}/>
      {value&&(
        <div style={{marginTop:6,position:"relative",display:"inline-block"}}>
          <img src={value} alt="" style={{maxWidth:"100%",maxHeight:100,borderRadius:8,border:`1px solid ${C.border}`}}
            onError={e=>(e.currentTarget.style.display="none")}/>
          <button onClick={e=>{e.stopPropagation();onChange("");}}
            style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",
              background:C.red,border:"none",cursor:"pointer",color:"#fff",fontSize:11,
              display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
      )}
    </div>
  );
}

function BannersTab({toast}:{toast:(m:string,ok?:boolean)=>void}){
  const [banners,setBanners]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1); const [pages,setPages]=useState(1);
  const [posFilter,setPosFilter]=useState("all");
  const [editing,setEditing]=useState<any|null>(null);
  const [form,setForm]=useState<any>({...BFORM0});
  const [saving,setSaving]=useState(false);
  const [showForm,setShowForm]=useState(false);

  const load=async(p=1)=>{
    setLoading(true);
    const q=new URLSearchParams({page:String(p),...(posFilter!=="all"&&{position:posFilter})});
    const r=await fetch(`/api/admin/banners?${q}`); const d=await r.json();
    if(r.ok){setBanners(d.banners);setTotal(d.total);setPages(d.pages);setPage(p);}
    setLoading(false);
  };
  useEffect(()=>{load(1);},[posFilter]);

  const openNew=()=>{setEditing(null);setForm({...BFORM0});setShowForm(true);};
  const openEdit=(b:any)=>{
    setEditing(b);
    setForm({
      position:b.position,type:b.type,title:b.title||"",body:b.body||"",
      imageUrl:b.imageUrl||"",linkUrl:b.linkUrl||"",linkTarget:b.linkTarget,
      ctaText:b.ctaText||"",bgColor:b.bgColor,textColor:b.textColor,
      targetAudience:b.targetAudience,showMobile:b.showMobile,showDesktop:b.showDesktop,
      startsAt:b.startsAt?b.startsAt.slice(0,16):"",endsAt:b.endsAt?b.endsAt.slice(0,16):"",
      priority:String(b.priority),delayMs:String(b.delayMs),dismissDays:String(b.dismissDays),isActive:b.isActive,
    });
    setShowForm(true);
  };

  const handleSave=async()=>{
    setSaving(true);
    const body:any={...form,priority:Number(form.priority||0),delayMs:Number(form.delayMs||0),
      dismissDays:Number(form.dismissDays??1),startsAt:form.startsAt||null,endsAt:form.endsAt||null};
    if(editing)body.id=editing.id;
    const r=await fetch("/api/admin/banners",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const d=await r.json();
    if(r.ok){toast(d.message);setShowForm(false);load(page);}else toast(d.error||"ไม่สำเร็จ",false);
    setSaving(false);
  };
  const sf=(k:string,v:any)=>setForm((p:any)=>({...p,[k]:v}));
  const emoji=(t:string)=>({announcement:"📢",image:"🖼",card:"📋",popup:"💬",interstitial:"🎯",sticky:"📌"}[t]||"📋");
  const posLabel=(v:string)=>POSITIONS.find(p=>p.value===v)?.label||v;

  return(
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:16,maxWidth:900}}>
      <PageHeader title="แบนเนอร์" sub={`${total} รายการ — ทุก position บนทุกแอป`}>
        <Btn variant="secondary" onClick={()=>load(page)}><RefreshCw size={13}/></Btn>
        <Btn onClick={openNew}><Plus size={13}/> สร้าง Banner</Btn>
      </PageHeader>

      {/* Filter */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {[["all","ทั้งหมด"],...POSITIONS.map(p=>[p.value,p.label.split("—")[1]?.trim()||p.value])].map(([v,l])=>(
          <button key={v} onClick={()=>setPosFilter(v)}
            style={{padding:"4px 10px",borderRadius:8,fontSize:11,cursor:"pointer",border:`1px solid ${posFilter===v?C.blue:C.border}`,background:posFilter===v?C.blueLight:C.card,color:posFilter===v?C.blue:C.muted}}>
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      {loading
        ?<div style={{textAlign:"center",padding:40}}><Loader2 size={20} style={{animation:"spin 1s linear infinite",color:C.muted}}/></div>
        :banners.length===0
          ?<Card><p style={{textAlign:"center",color:C.muted,padding:20}}>ยังไม่มี banner</p></Card>
          :<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {banners.map(b=>(
              <Card key={b.id} style={{padding:"12px 14px",border:b.isActive?`1px solid ${C.greenBorder}`:`1px solid ${C.border}`}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{width:36,height:36,borderRadius:8,background:b.bgColor,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,overflow:"hidden"}}>
                    {b.imageUrl?<img src={b.imageUrl} loading="lazy" style={{width:36,height:36,objectFit:"cover"}}/>:emoji(b.type)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontWeight:600,fontSize:13,color:C.text}}>{b.title||b.body?.slice(0,50)||"(ไม่มีชื่อ)"}</span>
                      <Badge color={b.isActive?C.green:C.muted}>{b.isActive?"เปิด":"ปิด"}</Badge>
                      <Badge color={C.blue} bg={C.blueLight}>{b.type}</Badge>
                    </div>
                    <p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>{posLabel(b.position)}</p>
                    <div style={{display:"flex",gap:10,marginTop:3}}>
                      <span style={{fontSize:11,color:C.muted}}>👁 {b.impressions.toLocaleString()}</span>
                      <span style={{fontSize:11,color:C.muted}}>🖱 {b.clicks.toLocaleString()}</span>
                      {b.impressions>0&&<span style={{fontSize:11,color:C.blue}}>CTR {((b.clicks/b.impressions)*100).toFixed(1)}%</span>}
                      {b.endsAt&&<span style={{fontSize:11,color:C.gold}}>หมด {new Date(b.endsAt).toLocaleDateString("th-TH",{day:"numeric",month:"short"})}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    <button onClick={async()=>{
                      const r=await fetch("/api/admin/banners",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:b.id,isActive:!b.isActive})});
                      const d=await r.json(); if(r.ok){toast(d.message);load(page);}else toast(d.error||"ไม่สำเร็จ",false);
                    }} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
                      {b.isActive?<ToggleRight size={24} style={{color:C.blue}}/>:<ToggleLeft size={24} style={{color:C.muted}}/>}
                    </button>
                    <Btn size="sm" variant="secondary" onClick={()=>openEdit(b)}><Pencil size={11}/></Btn>
                    <Btn size="sm" variant="danger" onClick={async()=>{
                      if(!confirm("ยืนยันลบ?"))return;
                      const r=await fetch("/api/admin/banners",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:b.id})});
                      const d=await r.json(); if(r.ok){toast(d.message);load(page);}else toast(d.error||"ไม่สำเร็จ",false);
                    }}><Trash2 size={11}/></Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>}

      {pages>1&&(
        <div style={{display:"flex",justifyContent:"center",gap:8}}>
          <Btn size="sm" variant="ghost" onClick={()=>load(page-1)} disabled={page<=1}><ChevronLeft size={13}/></Btn>
          <span style={{fontSize:13,color:C.sub}}>{page}/{pages}</span>
          <Btn size="sm" variant="ghost" onClick={()=>load(page+1)} disabled={page>=pages}><ChevronRight size={13}/></Btn>
        </div>
      )}

      {/* Modal Form */}
      {showForm&&(
        <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px 16px",overflowY:"auto"}}>
          <div style={{background:C.card,borderRadius:16,padding:24,width:"100%",maxWidth:520,boxShadow:"0 12px 48px rgba(0,0,0,0.15)",marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <p style={{fontSize:15,fontWeight:600,color:C.text,margin:0}}>{editing?"แก้ไข":"สร้าง"} Banner</p>
              <button onClick={()=>setShowForm(false)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:18}}>✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:4}}>Position</label>
                  <select value={form.position} onChange={e=>sf("position",e.target.value)}
                    style={{width:"100%",height:34,padding:"0 8px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:12,color:C.text,background:C.card}}>
                    {POSITIONS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:4}}>Type</label>
                  <select value={form.type} onChange={e=>sf("type",e.target.value)}
                    style={{width:"100%",height:34,padding:"0 8px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:12,color:C.text,background:C.card}}>
                    {BTYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <InputField label="หัวข้อ" value={form.title} onChange={v=>sf("title",v)} placeholder="ชื่อแบนเนอร์"/>
              <div>
                <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:4}}>ข้อความ</label>
                <textarea value={form.body} onChange={e=>sf("body",e.target.value)} rows={2} placeholder="รายละเอียด..."
                  style={{width:"100%",boxSizing:"border-box",padding:"7px 10px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,color:C.text,outline:"none",resize:"none",fontFamily:"inherit"}}/>
              </div>
              <ImageUpload value={form.imageUrl} onChange={v=>sf("imageUrl",v)}/>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
                <InputField label="Link URL" value={form.linkUrl} onChange={v=>sf("linkUrl",v)} placeholder="https://..."/>
                <InputField label="CTA text" value={form.ctaText} onChange={v=>sf("ctaText",v)} placeholder="คลิกเลย"/>
              </div>
              {/* Colors */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[{label:"สี BG",key:"bgColor"},{label:"สี Text",key:"textColor"}].map(c=>(
                  <div key={c.key}>
                    <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:4}}>{c.label}</label>
                    <div style={{display:"flex",gap:6}}>
                      <input type="color" value={form[c.key]} onChange={e=>sf(c.key,e.target.value)}
                        style={{width:34,height:34,border:`1px solid ${C.borderMid}`,borderRadius:8,cursor:"pointer",padding:2}}/>
                      <input value={form[c.key]} onChange={e=>sf(c.key,e.target.value)}
                        style={{flex:1,height:34,padding:"0 8px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:12,color:C.text,outline:"none"}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:form.bgColor,color:form.textColor,borderRadius:8,padding:"9px 12px",fontSize:13,fontWeight:500}}>
                {form.title||"Preview"} {form.ctaText&&<span style={{marginLeft:8,background:"rgba(255,255,255,0.2)",borderRadius:5,padding:"2px 8px",fontSize:11}}>{form.ctaText}</span>}
              </div>
              {/* Schedule */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <InputField label="เริ่มแสดง" type="datetime-local" value={form.startsAt} onChange={v=>sf("startsAt",v)}/>
                <InputField label="หยุดแสดง" type="datetime-local" value={form.endsAt}   onChange={v=>sf("endsAt",v)}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <InputField label="Priority" type="number" value={form.priority} onChange={v=>sf("priority",v)} note="สูง = ก่อน"/>
                <InputField label="Delay ms" type="number" value={form.delayMs} onChange={v=>sf("delayMs",v)} note="popup"/>
                <InputField label="Dismiss วัน" type="number" value={form.dismissDays} onChange={v=>sf("dismissDays",v)} note="-1 = ไม่จำ"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:4}}>Target</label>
                  <select value={form.targetAudience} onChange={e=>sf("targetAudience",e.target.value)}
                    style={{width:"100%",height:34,padding:"0 8px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:12,color:C.text,background:C.card}}>
                    {[["all","ทุกคน"],["user","User"],["merchant","Merchant"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div style={{paddingTop:18}}><ToggleSwitch value={form.isActive} onChange={v=>sf("isActive",v)} label={form.isActive?"✅ เปิดทันที":"⏸ ปิดอยู่"}/></div>
              </div>
              <div style={{display:"flex",gap:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                <Btn onClick={handleSave} disabled={saving}>
                  {saving?<Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>:<Save size={13}/>}
                  {editing?"บันทึก":"สร้าง"}
                </Btn>
                <Btn variant="ghost" onClick={()=>setShowForm(false)}>ยกเลิก</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ════ QR RULES TAB ════ */
type QrRule = { id:number; name:string; ruleType:string; value:string; blockMessage:string; isActive:boolean; priority:number };
const RULE_TYPES=[{value:"time",label:"⏰ ตามเวลา",hint:"เช่น 08:00-17:00"},{value:"day_of_week",label:"📅 ตามวัน",hint:"เช่น 1,2,3,4,5"},{value:"scan_count",label:"🔢 จำนวนสแกน",hint:'{"from":1,"to":100}'},{value:"geo",label:"📍 รัศมี (m)",hint:"เช่น 50"}];
const PRESETS:Record<string,{value:string;blockMessage:string}>={time:{value:"08:00-21:00",blockMessage:"ขออภัย สแกนได้เฉพาะเวลา 08:00-21:00 น."},day_of_week:{value:"1,2,3,4,5",blockMessage:"ขออภัย สแกนได้เฉพาะวันจันทร์-ศุกร์"},scan_count:{value:'{"from":1,"to":1000}',blockMessage:"โควต้าสแกนเต็มแล้ว"},geo:{value:"50",blockMessage:"คุณอยู่นอกพื้นที่ร้านค้า 📍"}};
function QrRulesTab({toast}:{toast:(m:string,ok?:boolean)=>void}){
  const [rules,setRules]=useState<QrRule[]>([]);
  const [loading,setLoading]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState<QrRule|null>(null);
  const [form,setForm]=useState({name:"",ruleType:"time",value:"08:00-21:00",blockMessage:"ขออภัย สแกนได้เฉพาะเวลา 08:00-21:00 น.",priority:0});
  const [saving,setSaving]=useState(false);
  const sf=(k:string,v:string|number)=>setForm(p=>({...p,[k]:v}));
  const load=async()=>{setLoading(true);const r=await fetch("/api/admin/qr-rules");if(r.ok){const d=await r.json();setRules(d.rules||[]);}setLoading(false);};
  useEffect(()=>{load();},[]);
  const openNew=()=>{setEditing(null);const p=PRESETS["time"];setForm({name:"",ruleType:"time",value:p.value,blockMessage:p.blockMessage,priority:0});setShowForm(true);};
  const openEdit=(r:QrRule)=>{setEditing(r);setForm({name:r.name,ruleType:r.ruleType,value:r.value,blockMessage:r.blockMessage,priority:r.priority});setShowForm(true);};
  const onTypeChange=(t:string)=>{const p=PRESETS[t]||{value:"",blockMessage:""};setForm(prev=>({...prev,ruleType:t,value:p.value,blockMessage:p.blockMessage}));};
  const handleSave=async()=>{
    if(!form.name.trim()||!form.value.trim()||!form.blockMessage.trim()){toast("กรุณากรอกข้อมูลให้ครบ",false);return;}
    setSaving(true);
    const method=editing?"PATCH":"POST";
    const body=editing?{id:editing.id,...form}:form;
    const r=await fetch("/api/admin/qr-rules",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const d=await r.json();
    setSaving(false);
    if(r.ok){toast(editing?"อัปเดต rule แล้ว":"สร้าง rule แล้ว");setShowForm(false);load();}
    else toast(d.error||"เกิดข้อผิดพลาด",false);
  };
  const toggleActive=async(rule:QrRule)=>{
    await fetch("/api/admin/qr-rules",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:rule.id,isActive:!rule.isActive})});
    toast(rule.isActive?"ปิด rule แล้ว":"เปิด rule แล้ว");load();
  };
  const handleDelete=async(id:number)=>{
    if(!confirm("ลบ rule นี้?"))return;
    await fetch(`/api/admin/qr-rules?id=${id}`,{method:"DELETE"});
    toast("ลบ rule แล้ว");load();
  };
  return(
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
      <PageHeader title="Smart QR Rules" sub="กำหนดกฎการสแกน QR — evaluate ตามลำดับ priority">
        <Btn onClick={load} variant="secondary" size="sm"><RefreshCw size={13}/></Btn>
        <Btn onClick={openNew}><Plus size={13}/> เพิ่ม Rule</Btn>
      </PageHeader>
      <Card style={{marginBottom:16,background:C.blueLight,border:`1px solid ${C.blueBorder}`}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <Shield size={16} style={{color:C.blue,marginTop:2,flexShrink:0}}/>
          <p style={{fontSize:13,color:C.blue,margin:0}}>Rules จะถูก evaluate ตาม priority (น้อย = ก่อน) — rule ไหนไม่ผ่านจะแสดง blockMessage ทันที</p>
        </div>
      </Card>
      {loading?<div style={{textAlign:"center",padding:48}}><Loader2 size={24} style={{animation:"spin 1s linear infinite",color:C.muted}}/></div>
      :rules.length===0?<Card style={{textAlign:"center",padding:"48px 24px"}}><p style={{color:C.muted,fontSize:14}}>ยังไม่มี Smart QR Rules</p></Card>
      :<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {rules.map(rule=>(
          <Card key={rule.id} style={{opacity:rule.isActive?1:0.6}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
              <div style={{minWidth:36,height:36,borderRadius:8,background:C.blueLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.blue,flexShrink:0}}>{rule.priority}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                  <span style={{fontWeight:600,fontSize:14,color:C.text}}>{rule.name}</span>
                  <Badge color={rule.isActive?C.green:C.muted}>{rule.isActive?"✅ เปิด":"⏸ ปิด"}</Badge>
                  <Badge color={C.blue}>{RULE_TYPES.find(r=>r.value===rule.ruleType)?.label||rule.ruleType}</Badge>
                </div>
                <code style={{fontSize:12,background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 8px",color:C.sub,display:"inline-block",marginBottom:4}}>{rule.value}</code>
                <p style={{fontSize:12,color:C.muted,margin:0}}>🚫 {rule.blockMessage}</p>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <Btn size="sm" variant="secondary" onClick={()=>toggleActive(rule)}>{rule.isActive?<EyeOff size={13}/>:<Eye size={13}/>}</Btn>
                <Btn size="sm" variant="secondary" onClick={()=>openEdit(rule)}><Pencil size={13}/></Btn>
                <Btn size="sm" variant="danger" onClick={()=>handleDelete(rule.id)}><Trash2 size={13}/></Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>}
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100,padding:"0 0 0 220px"}}>
          <motion.div initial={{y:60,opacity:0}} animate={{y:0,opacity:1}}
            style={{background:C.card,borderRadius:"16px 16px 0 0",width:"100%",maxWidth:560,maxHeight:"85vh",overflow:"auto",padding:"24px",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
            <h3 style={{fontSize:16,fontWeight:600,color:C.text,margin:"0 0 20px"}}>{editing?"แก้ไข Rule":"เพิ่ม Smart QR Rule"}</h3>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <InputField label="ชื่อ Rule" value={form.name} onChange={v=>sf("name",v)} placeholder="เช่น เปิดเฉพาะวันธรรมดา" required/>
              <div>
                <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:5}}>ประเภท Rule <span style={{color:C.red}}>*</span></label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {RULE_TYPES.map(rt=>(
                    <button key={rt.value} onClick={()=>onTypeChange(rt.value)}
                      style={{padding:"8px 12px",borderRadius:8,fontSize:13,textAlign:"left",cursor:"pointer",border:`1px solid ${form.ruleType===rt.value?C.blue:C.border}`,background:form.ruleType===rt.value?C.blueLight:C.card,color:form.ruleType===rt.value?C.blue:C.sub,fontWeight:form.ruleType===rt.value?600:400}}>
                      {rt.label}<span style={{display:"block",fontSize:10,color:C.muted,marginTop:2}}>{rt.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <InputField label={`ค่า (${RULE_TYPES.find(r=>r.value===form.ruleType)?.hint||""})`} value={form.value} onChange={v=>sf("value",v)} required/>
              <div>
                <label style={{fontSize:12,fontWeight:500,color:C.sub,display:"block",marginBottom:5}}>ข้อความเมื่อถูก block <span style={{color:C.red}}>*</span></label>
                <textarea value={form.blockMessage} onChange={e=>sf("blockMessage",e.target.value)} rows={3} placeholder="เช่น ขออภัย สามารถสแกนได้เฉพาะ..."
                  style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",border:`1px solid ${C.borderMid}`,borderRadius:8,fontSize:13,color:C.text,outline:"none",resize:"none",fontFamily:"inherit"}}/>
                {form.blockMessage&&<div style={{marginTop:6,background:"#FEF2F2",border:`1px solid ${C.redBorder}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.red}}>🚫 Preview: {form.blockMessage}</div>}
              </div>
              <InputField label="Priority (น้อย = ตรวจก่อน)" type="number" value={form.priority} onChange={v=>sf("priority",Number(v))} note="0-99 แนะนำ"/>
              <div style={{display:"flex",gap:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                <Btn onClick={handleSave} disabled={saving}>{saving?<Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>:<Save size={13}/>}{editing?"บันทึก":"สร้าง Rule"}</Btn>
                <Btn variant="ghost" onClick={()=>setShowForm(false)}>ยกเลิก</Btn>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
