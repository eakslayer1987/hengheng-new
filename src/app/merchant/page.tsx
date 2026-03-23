'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useMerchantStatus, useStats, useReceipts, useSendOTP, useVerifyOTP, useRegisterMerchant } from '@/lib/hooks'
import { fmt, formatThaiDate, getUserLocation } from '@/lib/utils'

type Screen = 'login' | 'otp' | 'register' | 'pending' | 'main'
type MainTab = 'home' | 'receipt' | 'history' | 'profile'

export default function MerchantPage() {
  const router = useRouter()
  const [screen, setScreen]   = useState<Screen>('login')
  const [phone,  setPhone]    = useState('')
  const [otp,    setOtp]      = useState('')
  const [tab,    setTab]      = useState<MainTab>('home')
  const [merchant, setMerchant] = useState<any>(null)

  const sendOTP    = useSendOTP()
  const verifyOTP  = useVerifyOTP()
  const registerMerchant = useRegisterMerchant()

  // ── Login ─────────────────────────────────────────────────────────────────
  async function handleSendOTP() {
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 9) return alert('กรุณากรอกเบอร์โทรให้ถูกต้อง')

    // เช็คว่าเป็นร้านที่ลงทะเบียนแล้วไหม
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_PHP_API_URL}/merchant_status.php?phone=${clean}`
      )
      const d = await r.json()
      if (d.merchant) {
        setMerchant(d.merchant)
        if (d.merchant.status === 'approved') { setScreen('main'); return }
        if (d.merchant.status === 'pending')  { setScreen('pending'); return }
      }
    } catch {}

    // ส่ง OTP
    await sendOTP.trigger(phone)
    setScreen('otp')
  }

  async function handleVerifyOTP() {
    const result = await verifyOTP.trigger({ phone: phone.replace(/\D/g, ''), code: otp })
    if ((result as any)?.verified) setScreen('register')
    else alert('OTP ไม่ถูกต้อง กรุณาลองใหม่')
  }

  // ── Register ──────────────────────────────────────────────────────────────
  const [regForm, setRegForm] = useState({ name: '', ownerName: '', address: '' })
  const [locating, setLocating] = useState(false)
  const [coords, setCoords]     = useState<{ lat: number; lng: number } | null>(null)

  async function handleGetLocation() {
    setLocating(true)
    try {
      const loc = await getUserLocation()
      setCoords({ lat: loc.latitude, lng: loc.longitude })
    } catch { alert('ไม่สามารถระบุตำแหน่งได้') }
    setLocating(false)
  }

  async function handleRegister() {
    if (!regForm.name || !regForm.ownerName || !regForm.address || !coords)
      return alert('กรุณากรอกข้อมูลให้ครบ')
    await registerMerchant.trigger({
      name: regForm.name, ownerName: regForm.ownerName,
      address: regForm.address, phone: phone.replace(/\D/g, ''),
      lat: coords.lat, lng: coords.lng, 
    })
    setScreen('pending')
  }

  const iS = "w-full bg-[rgba(255,255,255,.06)] border border-[rgba(255,255,255,.1)] " +
             "rounded-xl px-4 py-3 text-sm text-white outline-none placeholder-[rgba(255,255,255,.3)]"
  const btnPrimary = "w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r " +
                     "from-[#FD1803] to-[#a00000] text-white active:scale-[.98] transition-transform"

  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto overflow-hidden
                    bg-gradient-to-b from-[#0d1117] to-[#161b22]"
         style={{ fontFamily: "'Kanit',sans-serif", color: '#e6edf3' }}>

      {/* ── LOGIN ── */}
      {screen === 'login' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          <button onClick={() => router.back()}
                  className="absolute top-5 left-5 text-[rgba(200,220,255,.4)] text-sm">
            ← กลับ
          </button>
          <div className="text-5xl">🏪</div>
          <div className="text-center">
            <h1 className="text-2xl font-black">พอร์ทัล<span style={{color:'#E8B820'}}>ร้านค้า</span></h1>
            <p className="text-sm text-[rgba(200,220,255,.5)] mt-1">สำหรับร้านค้าพาร์ทเนอร์ปังจัง</p>
          </div>
          <div className="w-full space-y-3">
            <input value={phone} onChange={e => setPhone(e.target.value)}
                   type="tel" placeholder="เบอร์โทรร้านค้า"
                   className={iS} />
            <button onClick={handleSendOTP}
                    className={btnPrimary}>
              {sendOTP.isMutating ? '⏳ กำลังส่ง OTP...' : 'ถัดไป →'}
            </button>
          </div>
        </div>
      )}

      {/* ── OTP ── */}
      {screen === 'otp' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          <div className="text-5xl">📱</div>
          <div className="text-center">
            <h1 className="text-xl font-black">ยืนยัน OTP</h1>
            <p className="text-sm text-[rgba(200,220,255,.5)] mt-1">
              รหัส 6 หลักที่ส่งไปยัง {phone}
            </p>
          </div>
          <input value={otp} onChange={e => setOtp(e.target.value)}
                 type="number" maxLength={6} placeholder="______"
                 className={`${iS} text-center text-2xl tracking-[0.5em]`} />
          <button onClick={handleVerifyOTP} className={btnPrimary}>
            {verifyOTP.isMutating ? '⏳ กำลังตรวจสอบ...' : 'ยืนยัน OTP'}
          </button>
          <button onClick={() => setScreen('login')}
                  className="text-sm text-[rgba(200,220,255,.4)]">
            ← เปลี่ยนเบอร์โทร
          </button>
        </div>
      )}

      {/* ── REGISTER ── */}
      {screen === 'register' && (
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
          <h1 className="text-xl font-black mb-2">สมัคร<span style={{color:'#E8B820'}}>ร้านค้า</span></h1>
          <input value={regForm.name} onChange={e => setRegForm(p => ({...p, name: e.target.value}))}
                 placeholder="ชื่อร้านค้า *" className={iS} />
          <input value={regForm.ownerName} onChange={e => setRegForm(p => ({...p, ownerName: e.target.value}))}
                 placeholder="ชื่อเจ้าของ *" className={iS} />
          <input value={regForm.address} onChange={e => setRegForm(p => ({...p, address: e.target.value}))}
                 placeholder="ที่อยู่ร้านค้า *" className={iS} />
          <button onClick={handleGetLocation}
                  className="w-full h-11 rounded-xl border border-[rgba(63,185,80,.4)]
                             bg-[rgba(63,185,80,.08)] text-green-400 text-sm font-bold">
            {locating ? '⏳ กำลังระบุตำแหน่ง...'
              : coords  ? `✅ ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
              : '📍 บันทึกตำแหน่ง GPS'}
          </button>
          <button onClick={handleRegister} className={btnPrimary}>
            {registerMerchant.isMutating ? '⏳ กำลังสมัคร...' : 'สมัครร้านค้า'}
          </button>
        </div>
      )}

      {/* ── PENDING ── */}
      {screen === 'pending' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4 text-center">
          <div className="text-6xl">⏳</div>
          <h1 className="text-xl font-black">รอการอนุมัติ</h1>
          <p className="text-sm text-[rgba(200,220,255,.5)] leading-relaxed">
            ทีมงานกำลังตรวจสอบข้อมูลร้านค้าของคุณ<br/>
            ปกติใช้เวลา 1-2 วันทำการครับ
          </p>
          <button onClick={() => router.push('/')}
                  className="mt-4 px-6 py-2.5 rounded-xl border border-[rgba(255,255,255,.1)]
                             text-sm text-[rgba(200,220,255,.6)]">
            กลับหน้าหลัก
          </button>
        </div>
      )}

      {/* ── MAIN APP ── */}
      {screen === 'main' && merchant && (
        <MerchantMain merchant={merchant} phone={phone.replace(/\D/g,'')}
                      tab={tab} setTab={setTab} />
      )}
    </div>
  )
}

// ── Main Merchant App ─────────────────────────────────────────────────────
function MerchantMain({ merchant, phone, tab, setTab }: {
  merchant: any; phone: string; tab: MainTab; setTab: (t: MainTab) => void
}) {
  const { data: statsData }    = useStats(phone)
  const { data: receiptsData } = useReceipts(phone)
  const stats    = statsData    ?? null
  const receipts = (receiptsData as any)?.receipts ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-[rgba(255,255,255,.06)]
                         bg-[rgba(13,17,23,.97)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8B820] to-[#A67208]
                          flex items-center justify-center text-xl flex-shrink-0">
            🏪
          </div>
          <div>
            <p className="font-black text-sm">{merchant.name}</p>
            <p className="text-[10px] text-[rgba(200,220,255,.4)]">{merchant.address}</p>
          </div>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full
                           bg-[rgba(63,185,80,.12)] border border-[rgba(63,185,80,.3)] text-green-400">
            ✓ อนุมัติแล้ว
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'home' && <MerchantHome merchant={merchant} stats={stats} />}
        {tab === 'receipt' && <MerchantReceipt phone={phone} />}
        {tab === 'history' && <MerchantHistory receipts={receipts} />}
        {tab === 'profile' && <MerchantProfile merchant={merchant} />}
      </div>

      {/* Bottom tabs */}
      <nav className="flex-shrink-0 flex border-t border-[rgba(255,255,255,.06)]
                      bg-[rgba(13,17,23,.97)]">
        {[
          { key:'home',    label:'หน้าหลัก', emoji:'🏠' },
          { key:'receipt', label:'ส่งใบเสร็จ', emoji:'📄' },
          { key:'history', label:'ประวัติ',   emoji:'📋' },
          { key:'profile', label:'โปรไฟล์',  emoji:'⚙️' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as MainTab)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all
                    ${tab === t.key ? 'text-[#E8B820]' : 'text-[rgba(200,220,255,.35)]'}`}>
            <span className="text-lg">{t.emoji}</span>
            <span className="text-[10px] font-semibold">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ── Tab: Home ─────────────────────────────────────────────────────────────
function MerchantHome({ merchant, stats }: { merchant: any; stats: any }) {
  return (
    <div className="p-4 space-y-4">
      {/* QR Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'QR ทั้งหมด', value: merchant.totalQuota ?? 0,     color:'#E8B820' },
          { label:'ใช้ไปแล้ว',  value: merchant.usedQuota ?? 0,      color:'#f85149' },
          { label:'เหลือ',      value: merchant.remainingQuota ?? 0, color:'#3fb950' },
        ].map(s => (
          <div key={s.label} className="bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.06)]
                                        rounded-xl p-3 text-center">
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-[rgba(200,220,255,.4)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 7 day chart */}
      {stats?.dailyChart && (
        <div className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)]
                        rounded-xl p-4">
          <p className="text-sm font-bold mb-3 text-[#E8B820]">สแกน 7 วันที่ผ่านมา</p>
          <div className="flex items-end gap-1.5 h-20">
            {stats.dailyChart.map((d: any, i: number) => {
              const max = Math.max(...stats.dailyChart.map((x: any) => x.count), 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm transition-all"
                       style={{
                         height: `${(d.count / max) * 64}px`,
                         background: 'linear-gradient(to top, #A67208, #E8B820)',
                         minHeight: d.count > 0 ? 4 : 0,
                       }} />
                  <span className="text-[8px] text-[rgba(200,220,255,.3)]">
                    {new Date(d.date).toLocaleDateString('th-TH', { weekday: 'narrow' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Receipt Upload ────────────────────────────────────────────────────
function MerchantReceipt({ phone }: { phone: string }) {
  const [file,     setFile]     = useState<File | null>(null)
  const [preview,  setPreview]  = useState('')
  const [bagCount, setBagCount] = useState(1)
  const [uploading,setUploading]= useState(false)
  const [done,     setDone]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function pickFile(f: File) {
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function submit() {
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('phone',    phone)
    form.append('bagCount', String(bagCount))
    form.append('image',    file)
    const r = await fetch(`${process.env.NEXT_PUBLIC_PHP_API_URL}/receipts.php`,
      { method: 'POST', body: form })
    if (r.ok) setDone(true)
    setUploading(false)
  }

  if (done) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
      <span className="text-5xl">✅</span>
      <p className="font-black text-lg">ส่งใบเสร็จสำเร็จ!</p>
      <p className="text-sm text-[rgba(200,220,255,.5)]">รอแอดมินอนุมัติ ปกติ 1-2 วันทำการ</p>
      <button onClick={() => { setDone(false); setFile(null); setPreview('') }}
              className="px-5 py-2 rounded-xl border border-[rgba(255,255,255,.1)] text-sm text-[rgba(200,220,255,.5)]">
        ส่งอีกใบ
      </button>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <p className="text-sm font-bold text-[#E8B820]">📤 ส่งใบเสร็จรับเงิน</p>

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
             className="hidden" onChange={e => { if (e.target.files?.[0]) pickFile(e.target.files[0]) }} />

      {preview ? (
        <div className="relative">
          <img src={preview} className="w-full rounded-xl object-cover" style={{ maxHeight: 200 }} />
          <button onClick={() => { setFile(null); setPreview('') }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60
                             text-white text-sm flex items-center justify-center">
            ✕
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()}
                className="w-full h-36 rounded-xl border-2 border-dashed border-[rgba(255,255,255,.1)]
                           flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">📷</span>
          <p className="text-sm text-[rgba(200,220,255,.4)]">ถ่ายภาพหรือเลือกรูปใบเสร็จ</p>
        </button>
      )}

      <div>
        <p className="text-xs text-[rgba(200,220,255,.5)] mb-2">จำนวนถุง *</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setBagCount(b => Math.max(1, b - 1))}
                  className="w-10 h-10 rounded-xl border border-[rgba(255,255,255,.1)]
                             text-xl font-black flex items-center justify-center">−</button>
          <span className="flex-1 text-center text-2xl font-black text-[#E8B820]">{bagCount}</span>
          <button onClick={() => setBagCount(b => b + 1)}
                  className="w-10 h-10 rounded-xl border border-[rgba(255,255,255,.1)]
                             text-xl font-black flex items-center justify-center">+</button>
        </div>
      </div>

      <button onClick={submit} disabled={!file || uploading}
              className="w-full h-12 rounded-2xl font-black text-sm
                         bg-gradient-to-r from-[#FD1803] to-[#a00000] text-white
                         disabled:opacity-40 disabled:cursor-not-allowed">
        {uploading ? '⏳ กำลังส่ง...' : '📤 ส่งใบเสร็จ'}
      </button>
    </div>
  )
}

// ── Tab: History ───────────────────────────────────────────────────────────
function MerchantHistory({ receipts }: { receipts: any[] }) {
  if (!receipts.length) return (
    <div className="flex flex-col items-center py-16 gap-3 text-[rgba(200,220,255,.3)]">
      <span className="text-4xl">📋</span>
      <p className="text-sm">ยังไม่มีประวัติ</p>
    </div>
  )
  return (
    <div className="p-4 space-y-3">
      {receipts.map((r: any) => (
        <div key={r.id} className="bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.06)]
                                    rounded-xl p-3 flex items-center gap-3">
          <div className="text-2xl">📄</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{r.bagCount} ถุง</p>
            <p className="text-[10px] text-[rgba(200,220,255,.4)] mt-0.5">
              {formatThaiDate(r.submittedAt)}
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
            ${r.status === 'approved' ? 'bg-[rgba(63,185,80,.12)] text-green-400 border border-[rgba(63,185,80,.3)]'
            : r.status === 'rejected' ? 'bg-[rgba(248,81,73,.1)] text-red-400 border border-[rgba(248,81,73,.3)]'
            : 'bg-[rgba(232,184,32,.1)] text-[#E8B820] border border-[rgba(232,184,32,.3)]'}`}>
            {r.status === 'approved' ? '✅ อนุมัติ'
             : r.status === 'rejected' ? '❌ ปฏิเสธ' : '⏳ รอ'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Profile ───────────────────────────────────────────────────────────
function MerchantProfile({ merchant }: { merchant: any }) {
  return (
    <div className="p-4 space-y-3">
      {[
        { label:'ชื่อร้าน',    value: merchant.name },
        { label:'เจ้าของ',     value: merchant.ownerName },
        { label:'เบอร์โทร',   value: merchant.phone },
        { label:'ที่อยู่',     value: merchant.address },
        { label:'สถานะ',       value: 'อนุมัติแล้ว ✅' },
      ].map(item => (
        <div key={item.label} className="bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.06)]
                                         rounded-xl px-4 py-3">
          <p className="text-[10px] text-[rgba(200,220,255,.4)] mb-1">{item.label}</p>
          <p className="text-sm font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

