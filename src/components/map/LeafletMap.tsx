'use client'
/**
 * LeafletMap.tsx — แผนที่ร้านค้า (Leaflet)
 * 
 * FIX:
 *  - ใช้ dynamic import แทน require('leaflet')
 *  - แก้ default marker icon หาย (webpack issue)
 *  - ธีมแดงทองตรง poster
 *  - user location pin
 *  - fly to selected merchant
 *
 * REQUIRED: npm install leaflet @types/leaflet
 */
import { useEffect, useRef, useCallback, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Fix Leaflet default icon (webpack strips the URL) ──
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface Props {
  merchants: any[]
  onSelect: (merchant: any) => void
  selectedId?: number | null
}

// ── Custom marker HTML (red-gold theme) ──────────────────────
function createMerchantIcon(m: any, isSelected: boolean) {
  const qrLeft = m.qrRemaining ?? (m.quota ?? 100) - (m.todayScans ?? 0)
  const hasQr = qrLeft > 0
  const dotColor = hasQr ? '#4ade80' : '#f87171'
  const borderColor = isSelected ? '#F7D37A' : (hasQr ? 'rgba(201,150,58,0.4)' : 'rgba(248,113,113,0.4)')
  const bgColor = isSelected ? 'rgba(61,0,8,0.98)' : 'rgba(61,0,8,0.92)'
  const name = m.name.length > 10 ? m.name.slice(0, 9) + '…' : m.name
  const scale = isSelected ? 'transform:scale(1.1);' : ''

  return L.divIcon({
    className: '',
    html: `
      <div style="
        background:${bgColor};
        border:${isSelected ? '2px' : '1.5px'} solid ${borderColor};
        border-radius:10px;
        padding:4px 10px;
        font-family:'Kanit',sans-serif;
        font-size:11px;
        font-weight:700;
        color:#FBF0C8;
        display:flex;
        align-items:center;
        gap:5px;
        white-space:nowrap;
        cursor:pointer;
        box-shadow:0 3px 12px rgba(0,0,0,0.4)${isSelected ? ',0 0 12px rgba(247,211,122,0.3)' : ''};
        ${scale}
        transition:all 0.2s;
      ">
        <span style="width:7px;height:7px;border-radius:50%;background:${dotColor};flex-shrink:0;
                      ${hasQr ? 'box-shadow:0 0 4px ' + dotColor : ''}"></span>
        ${name}
        <span style="font-size:9px;padding:1px 5px;border-radius:4px;
          background:${hasQr ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'};
          color:${hasQr ? '#4ade80' : '#f87171'};
          border:0.5px solid ${hasQr ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'};
          font-weight:800">${hasQr ? qrLeft : 'หมด'}</span>
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;
                   border-top:6px solid ${borderColor};margin:-1px auto 0;"></div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 40],
  })
}

// ── User location icon ──────────────────────────────────────
function createUserIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.2);
                     animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute;top:4px;left:4px;width:12px;height:12px;border-radius:50%;
                     background:#3b82f6;border:2.5px solid white;
                     box-shadow:0 2px 6px rgba(59,130,246,0.5);"></div>
      </div>
      <style>@keyframes ping{75%,100%{transform:scale(2.5);opacity:0}}</style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export default function LeafletMap({ merchants, onSelect, selectedId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const userMarkerRef = useRef<L.Marker | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // ── Initialize map ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [13.88, 100.54], // นนทบุรี / ปากเกร็ด area
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    })

    // Tile layer — CartoDB Voyager (สว่าง อ่านง่าย ดีกว่า dark)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map)

    // Zoom control — bottom right (ไม่บังข้อมูล)
    L.control.zoom({ position: 'topright' }).addTo(map)

    mapRef.current = map
    setMapReady(true)

    // ── Get user location ──────────────────────────────────
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const marker = L.marker([latitude, longitude], { icon: createUserIcon() })
          marker.addTo(map)
          marker.bindTooltip('คุณอยู่ที่นี่', {
            direction: 'top', offset: [0, -14],
            className: 'leaflet-tooltip-custom',
          })
          userMarkerRef.current = marker
        },
        () => {}, // Silently fail if no GPS
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Update markers when merchants change ────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    // Remove old markers
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    if (!merchants.length) return

    const bounds: L.LatLngExpression[] = []

    merchants.forEach(m => {
      if (!m.lat || !m.lng) return

      const isSelected = selectedId != null && m.id === selectedId
      const icon = createMerchantIcon(m, isSelected)
      const marker = L.marker([m.lat, m.lng], { icon })

      marker.on('click', () => onSelect(m))
      marker.addTo(map)
      markersRef.current.push(marker)
      bounds.push([m.lat, m.lng])
    })

    // Fit bounds ถ้ามีหลายร้าน
    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 })
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14)
    }
  }, [merchants, mapReady, onSelect, selectedId])

  // ── Fly to selected merchant ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return

    const m = merchants.find(x => x.id === selectedId)
    if (m?.lat && m?.lng) {
      map.flyTo([m.lat, m.lng], 15, { duration: 0.8 })
    }

    // Update marker icons to highlight selected
    markersRef.current.forEach((marker, i) => {
      const merchant = merchants[i]
      if (merchant) {
        const isSelected = merchant.id === selectedId
        marker.setIcon(createMerchantIcon(merchant, isSelected))
      }
    })
  }, [selectedId, merchants])

  return (
    <>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          minHeight: 300,
          zIndex: 1,
        }}
      />
      {/* Custom tooltip style */}
      <style>{`
        .leaflet-tooltip-custom {
          background: rgba(61,0,8,0.9) !important;
          color: #F7D37A !important;
          border: 1px solid rgba(201,150,58,0.3) !important;
          border-radius: 8px !important;
          padding: 4px 10px !important;
          font-family: 'Kanit', sans-serif !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          box-shadow: 0 3px 12px rgba(0,0,0,0.3) !important;
        }
        .leaflet-tooltip-custom::before {
          border-top-color: rgba(201,150,58,0.3) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(61,0,8,0.9) !important;
          color: #F7D37A !important;
          border-color: rgba(201,150,58,0.2) !important;
          font-weight: bold !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(139,0,26,0.95) !important;
        }
      `}</style>
    </>
  )
}
