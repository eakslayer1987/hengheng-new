'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PHP = process.env.NEXT_PUBLIC_PHP_API_URL!
const ADMIN_URL = PHP.replace('/api', '/admin')

// ─── Theme ───────────────────────────────────────────────────────────────
const C = {
  bg: '#0d1117', bg2: '#161b22', bg3: '#1f2937',
  g: '#E8B820', g2: '#F5D78E', g3: '#A67208',
  r: '#FD1803', grn: '#3fb950', red: '#f85149', blue: '#58a6ff',
  txt: '#e6edf3', sub: 'rgba(200,220,255,.6)', mut: 'rgba(150,170,210,.4)',
  bor: 'rgba(255,255,255,.08)', bor2: 'rgba(232,184,32,.3)',
}

// ─── Types ────────────────────────────────────────────────────────────────
type AdminTab = 'dashboard' | 'receipts' | 'merchants' | 'tickets' | 'banners' | 'config'

interface Stats {
  totalMerchants: number
  pendingMerchants: number
  pendingReceipts: number
  todayScans: number
  totalTickets: number
  totalWinners: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────
async function adminFetch(path: string, opts?: RequestInit) {
  const token = sessionStorage.getItem('admin_token') || ''
  const r = await fetch(`${ADMIN_URL}/${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
      ...(opts?.headers ?? {}),
    },
  })
  return r.json()
}

// ─── Shared UI ────────────────────────────────────────────────────────────
const sCard: React.CSSProperties = {
  background: C.bg2, border: `1px solid ${C.bor}`,
  borderRadius: 14, padding: '14px 16px',
}
const sBtn = (variant: 'primary'|'secondary'|'danger'|'gold' = 'primary'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 16px', borderRadius: 10, cursor: 'pointer',
  fontFamily: "'Kanit',sans-serif", fontSize: 12, fontWeight: 700,
  background: variant === 'primary' ? '#1D4ED8'
    : variant === 'gold'    ? `linear-gradient(135deg,${C.g3},${C.g})`
    : variant === 'danger'  ? 'rgba(248,81,73,.15)'
    : 'rgba(255,255,255,.06)',
  color: variant === 'gold' ? '#3d1f00'
    : variant === 'danger'  ? C.red : C.txt,
  border: variant === 'danger' ? `1px solid rgba(248,81,73,.3)`
    : `1px solid ${C.bor}`,
})
const sBadge = (status: string): React.CSSProperties => ({
  fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
  background: status === 'approved' ? 'rgba(63,185,80,.12)'
    : status === 'pending'  ? 'rgba(232,184,32,.12)'
    : 'rgba(248,81,73,.1)',
  color: status === 'approved' ? C.grn
    : status === 'pending'  ? C.g : C.red,
  border: `1px solid ${status === 'approved' ? 'rgba(63,185,80,.3)'
    : status === 'pending'  ? 'rgba(232,184,32,.3)' : 'rgba(248,81,73,.25)'}`,
})

// ═══════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    setLoading(true); setErr('')
    try {
      const r = await fetch(`${ADMIN_URL}/api/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      })
      const d = await r.json()
      if (r.ok && d.token) {
        sessionStorage.setItem('admin_token', d.token)
        onLogin()
      } else setErr(d.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    } catch { setErr('ไม่สามารถเชื่อมต่อได้') }
    setLoading(false)
  }

  const iS: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1px solid ${C.bor}`, background: 'rgba(255,255,255,.04)',
    color: C.txt, fontSize: 14, fontFamily: "'Kanit',sans-serif", outline: 'none',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100dvh',
      background: C.bg, fontFamily: "'Kanit',sans-serif", padding: 24,
    }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚙️</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.txt, margin: 0 }}>
            Admin <span style={{ color: C.g }}>Panel</span>
          </h1>
          <p style={{ fontSize: 13, color: C.mut, marginTop: 4 }}>เฮงเฮง ปังจัง Lucky Draw</p>
        </div>

        <div style={{ ...sCard, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.mut, display: 'block', marginBottom: 6 }}>
              Username
            </label>
            <input value={user} onChange={e => setUser(e.target.value)} style={iS}
                   placeholder="admin" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.mut, display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input value={pass} onChange={e => setPass(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && submit()}
                   type="password" style={iS} placeholder="••••••••" />
          </div>

          {err && (
            <div style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                         background: 'rgba(248,81,73,.1)', border: '1px solid rgba(248,81,73,.3)',
                         color: C.red }}>
              ⚠️ {err}
            </div>
          )}

          <button onClick={submit} disabled={loading}
                  style={{ ...sBtn('gold'), width: '100%', justifyContent: 'center',
                           height: 46, fontSize: 14, borderRadius: 14 }}>
            {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🔐 เข้าสู่ระบบ'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════
function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch('api/stats.php').then(d => { setStats(d); setLoading(false) })
  }, [])

  const kpis = stats ? [
    { label: 'ร้านค้าทั้งหมด',  value: stats.totalMerchants,  color: C.blue, icon: '🏪' },
    { label: 'รอดำเนินการ',     value: stats.pendingMerchants + stats.pendingReceipts, color: C.g, icon: '⏳' },
    { label: 'สแกนวันนี้',      value: stats.todayScans,       color: C.grn,  icon: '📱' },
    { label: 'ฉลากทั้งหมด',    value: stats.totalTickets,     color: C.blue, icon: '🎫' },
    { label: 'ผู้โชคดี',        value: stats.totalWinners,     color: C.g,    icon: '🏆' },
    { label: 'ใบเสร็จรอ',       value: stats.pendingReceipts,  color: C.red,  icon: '📋' },
  ] : []

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 18, fontWeight: 900, color: C.txt }}>
        📊 ภาพรวม<span style={{ color: C.g }}>ระบบ</span>
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.mut }}>⏳ กำลังโหลด...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {kpis.map(k => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ ...sCard, textAlign: 'center' }}>
              <div style={{ fontSize: 24 }}>{k.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: k.color, marginTop: 4 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>{k.label}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// RECEIPTS TAB
// ═══════════════════════════════════════════════════════
function ReceiptsTab() {
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [msg, setMsg]           = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const d = await adminFetch(`api/receipts.php?status=${filter}&limit=30`)
    setReceipts(d.receipts ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function approve(id: number, action: 'approve' | 'reject') {
    await adminFetch('api/receipts.php', {
      method: 'POST',
      body: JSON.stringify({ id, action }),
    })
    setMsg(action === 'approve' ? '✅ อนุมัติแล้ว' : '❌ ปฏิเสธแล้ว')
    setTimeout(() => setMsg(''), 2000)
    load()
  }

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 18, fontWeight: 900, color: C.txt }}>
          📋 ใบ<span style={{ color: C.g }}>เสร็จ</span>
        </p>
        <button onClick={load} style={sBtn('secondary')}>🔄 รีเฟรช</button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['pending','approved','rejected','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, cursor: 'pointer', border: 'none',
                    fontFamily: "'Kanit',sans-serif", fontSize: 11, fontWeight: 700,
                    background: filter === f ? `rgba(232,184,32,.15)` : 'rgba(255,255,255,.04)',
                    color: filter === f ? C.g : C.mut,
                    outline: filter === f ? `1px solid ${C.g3}` : 'none',
                  }}>
            {f === 'pending' ? '⏳ รอ' : f === 'approved' ? '✅ อนุมัติ' : f === 'rejected' ? '❌ ปฏิเสธ' : 'ทั้งหมด'}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                     background: msg.startsWith('✅') ? 'rgba(63,185,80,.1)' : 'rgba(248,81,73,.1)',
                     border: `1px solid ${msg.startsWith('✅') ? 'rgba(63,185,80,.3)' : 'rgba(248,81,73,.3)'}`,
                     color: msg.startsWith('✅') ? C.grn : C.red }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: C.mut }}>⏳ กำลังโหลด...</div>
      ) : receipts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: C.mut }}>ไม่มีรายการ</div>
      ) : receipts.map(r => (
        <div key={r.id} style={sCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {r.imageUrl && (
              <img src={r.imageUrl.startsWith('/') ? `${ADMIN_URL}${r.imageUrl}` : r.imageUrl}
                   style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover',
                            border: `1px solid ${C.bor}`, flexShrink: 0 }}
                   onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}/>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{r.merchantName ?? r.merchant?.name}</span>
                <span style={sBadge(r.status)}>
                  {r.status === 'approved' ? '✅ อนุมัติ' : r.status === 'pending' ? '⏳ รอ' : '❌ ปฏิเสธ'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: C.sub }}>
                🛍️ {r.bagCount} ถุง · {new Date(r.submittedAt).toLocaleDateString('th-TH', { day:'numeric',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit' })}
              </p>
              {r.reviewNote && (
                <p style={{ fontSize: 11, color: C.mut, marginTop: 4 }}>💬 {r.reviewNote}</p>
              )}
            </div>
          </div>

          {r.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => approve(r.id, 'approve')}
                      style={{ ...sBtn('primary'), flex: 1, justifyContent: 'center',
                               background: 'rgba(63,185,80,.15)', color: C.grn,
                               border: `1px solid rgba(63,185,80,.3)` }}>
                ✅ อนุมัติ
              </button>
              <button onClick={() => approve(r.id, 'reject')}
                      style={{ ...sBtn('danger'), flex: 1, justifyContent: 'center' }}>
                ❌ ปฏิเสธ
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// MERCHANTS TAB
// ═══════════════════════════════════════════════════════
function MerchantsTab() {
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('pending')
  const [msg, setMsg]             = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const d = await adminFetch(`api/merchants.php?status=${filter}&limit=50`)
    setMerchants(d.merchants ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function setStatus(id: number, status: 'approved' | 'rejected') {
    await adminFetch('api/merchants.php', {
      method: 'POST', body: JSON.stringify({ id, action: status }),
    })
    setMsg(status === 'approved' ? '✅ อนุมัติแล้ว' : '❌ ปฏิเสธแล้ว')
    setTimeout(() => setMsg(''), 2000)
    load()
  }

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 18, fontWeight: 900, color: C.txt }}>
          🏪 ร้าน<span style={{ color: C.g }}>ค้า</span>
        </p>
        <button onClick={load} style={sBtn('secondary')}>🔄 รีเฟรช</button>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {['pending','approved','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, cursor: 'pointer', border: 'none',
                    fontFamily: "'Kanit',sans-serif", fontSize: 11, fontWeight: 700,
                    background: filter === f ? 'rgba(232,184,32,.15)' : 'rgba(255,255,255,.04)',
                    color: filter === f ? C.g : C.mut,
                    outline: filter === f ? `1px solid ${C.g3}` : 'none',
                  }}>
            {f === 'pending' ? '⏳ รอ' : f === 'approved' ? '✅ อนุมัติ' : 'ทั้งหมด'}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                     background: msg.startsWith('✅') ? 'rgba(63,185,80,.1)' : 'rgba(248,81,73,.1)',
                     border: `1px solid ${msg.startsWith('✅') ? 'rgba(63,185,80,.3)' : 'rgba(248,81,73,.3)'}`,
                     color: msg.startsWith('✅') ? C.grn : C.red }}>{msg}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: C.mut }}>⏳ กำลังโหลด...</div>
      ) : merchants.map(m => (
        <div key={m.id} style={sCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{m.name}</span>
                <span style={sBadge(m.status)}>
                  {m.status === 'approved' ? '✅ อนุมัติ' : m.status === 'pending' ? '⏳ รอ' : '❌ ปฏิเสธ'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: C.sub }}>👤 {m.ownerName}</p>
              <p style={{ fontSize: 12, color: C.sub }}>📞 {m.phone}</p>
              <p style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>📍 {m.address}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: C.g }}>{m.qrRemaining ?? 0}</p>
              <p style={{ fontSize: 9, color: C.mut }}>QR เหลือ</p>
            </div>
          </div>
          {m.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setStatus(m.id, 'approved')}
                      style={{ ...sBtn('primary'), flex: 1, justifyContent: 'center',
                               background: 'rgba(63,185,80,.15)', color: C.grn,
                               border: `1px solid rgba(63,185,80,.3)` }}>
                ✅ อนุมัติ
              </button>
              <button onClick={() => setStatus(m.id, 'rejected')}
                      style={{ ...sBtn('danger'), flex: 1, justifyContent: 'center' }}>
                ❌ ปฏิเสธ
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// TICKETS TAB
// ═══════════════════════════════════════════════════════
function TicketsTab() {
  const [tickets, setTickets]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [winners, setWinners]   = useState<any[]>([])

  useEffect(() => {
    adminFetch('api/tickets.php?status=activated&limit=50').then(d => {
      setTickets(d.tickets ?? [])
      setLoading(false)
    })
    adminFetch('api/tickets.php?status=activated&isWinner=1&limit=20').then(d => {
      setWinners(d.tickets ?? [])
    })
  }, [])

  const filtered = search
    ? tickets.filter(t => t.ticketCode?.includes(search) || t.customerPhone?.includes(search))
    : tickets

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 18, fontWeight: 900, color: C.txt }}>
        🎫 ฉลาก<span style={{ color: C.g }}>ดิจิทัล</span>
      </p>

      {/* Winners */}
      {winners.length > 0 && (
        <div style={{ ...sCard, background: 'rgba(232,184,32,.06)', borderColor: C.bor2 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: C.g, marginBottom: 8 }}>
            🏆 ผู้โชคดี {winners.length} ราย
          </p>
          {winners.slice(0, 3).map(w => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between',
                                    fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${C.bor}` }}>
              <span style={{ color: C.txt }}>{w.customerName} · {w.ticketCode}</span>
              <span style={{ color: C.sub }}>{w.merchantName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
             placeholder="🔍 ค้นหาโค้ด หรือเบอร์โทร"
             style={{
               width: '100%', padding: '10px 14px', borderRadius: 12,
               border: `1px solid ${C.bor}`, background: 'rgba(255,255,255,.04)',
               color: C.txt, fontSize: 13, fontFamily: "'Kanit',sans-serif", outline: 'none',
             }}/>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: C.mut }}>⏳ กำลังโหลด...</div>
      ) : filtered.map(t => (
        <div key={t.id} style={{ ...sCard, padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 900, color: t.isWinner ? C.g : C.txt,
                             fontFamily: 'monospace', letterSpacing: 2 }}>
                {t.ticketCode}
              </span>
              {t.isWinner && <span style={{ marginLeft: 6, fontSize: 10, color: C.g }}>🏆</span>}
              <p style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                👤 {t.customerName} · {t.customerPhone}
              </p>
              <p style={{ fontSize: 11, color: C.mut }}>🏪 {t.merchantName}</p>
            </div>
            <span style={sBadge(t.status === 'activated' ? 'approved' : 'pending')}>
              {t.status === 'activated' ? '✅ สแกนแล้ว' : '⏳ รอสแกน'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// CONFIG TAB
// ═══════════════════════════════════════════════════════
function ConfigTab() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    adminFetch('api/config.php').then(d => {
      if (d.config) setConfig(d.config)
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    await adminFetch('api/config.php', { method: 'POST', body: JSON.stringify(config) })
    setMsg('✅ บันทึกสำเร็จ')
    setTimeout(() => setMsg(''), 2500)
    setSaving(false)
  }

  const KEYS = [
    { key: 'app_name',           label: 'ชื่อแอป' },
    { key: 'app_subtitle',       label: 'คำโปรย' },
    { key: 'daily_collect_limit',label: 'สิทธิ์สะสม/วัน' },
    { key: 'gps_radius_m',       label: 'รัศมี GPS (เมตร)' },
    { key: 'otp_expire_min',     label: 'OTP หมดอายุ (นาที)' },
    { key: 'tickets_per_bag',    label: 'ฉลากต่อถุง' },
    { key: 'registration_open',  label: 'เปิดรับสมัคร (true/false)' },
  ]

  const iS: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 10,
    border: `1px solid ${C.bor}`, background: 'rgba(255,255,255,.04)',
    color: C.txt, fontSize: 13, fontFamily: "'Kanit',sans-serif", outline: 'none',
  }

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 18, fontWeight: 900, color: C.txt }}>
        ⚙️ ตั้ง<span style={{ color: C.g }}>ค่า</span>
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: C.mut }}>⏳ กำลังโหลด...</div>
      ) : (
        <>
          {KEYS.map(({ key, label }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.mut, display: 'block', marginBottom: 5 }}>
                {label}
              </label>
              <input value={config[key] ?? ''}
                     onChange={e => setConfig(p => ({ ...p, [key]: e.target.value }))}
                     style={iS} />
            </div>
          ))}

          {msg && (
            <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                         background: 'rgba(63,185,80,.1)', border: '1px solid rgba(63,185,80,.3)',
                         color: C.grn }}>{msg}</div>
          )}

          <button onClick={save} disabled={saving}
                  style={{ ...sBtn('gold'), width: '100%', justifyContent: 'center',
                           height: 46, fontSize: 14, borderRadius: 14 }}>
            {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
          </button>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// MAIN ADMIN APP
// ═══════════════════════════════════════════════════════
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab]       = useState<AdminTab>('dashboard')

  useEffect(() => {
    if (sessionStorage.getItem('admin_token')) setAuthed(true)
  }, [])

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  const TABS: { key: AdminTab; label: string; emoji: string }[] = [
    { key: 'dashboard', label: 'ภาพรวม',   emoji: '📊' },
    { key: 'receipts',  label: 'ใบเสร็จ',  emoji: '📋' },
    { key: 'merchants', label: 'ร้านค้า',  emoji: '🏪' },
    { key: 'tickets',   label: 'ฉลาก',     emoji: '🎫' },
    { key: 'config',    label: 'ตั้งค่า',  emoji: '⚙️' },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 480, margin: '0 auto', overflow: 'hidden',
      background: C.bg, fontFamily: "'Kanit',sans-serif", color: C.txt,
    }}>
      {/* Header */}
      <header style={{
        flexShrink: 0, padding: '10px 14px 8px',
        background: C.bg2, borderBottom: `1px solid ${C.bor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 900 }}>
            Admin <span style={{ color: C.g }}>Panel</span>
          </p>
          <p style={{ fontSize: 10, color: C.mut }}>เฮงเฮง ปังจัง</p>
        </div>
        <button onClick={() => { sessionStorage.removeItem('admin_token'); setAuthed(false) }}
                style={{ fontSize: 11, color: C.red, background: 'none', border: 'none',
                         cursor: 'pointer', fontFamily: "'Kanit',sans-serif" }}>
          ออกจากระบบ
        </button>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'dashboard' && <DashboardTab />}
            {tab === 'receipts'  && <ReceiptsTab />}
            {tab === 'merchants' && <MerchantsTab />}
            {tab === 'tickets'   && <TicketsTab />}
            {tab === 'config'    && <ConfigTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <nav style={{
        flexShrink: 0, display: 'flex',
        background: C.bg2, borderTop: `1px solid ${C.bor}`,
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 2, padding: '8px 0',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: tab === t.key ? C.g : C.mut,
                    fontFamily: "'Kanit',sans-serif",
                  }}>
            <span style={{ fontSize: 18 }}>{t.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
