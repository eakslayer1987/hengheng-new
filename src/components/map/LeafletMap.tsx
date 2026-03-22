'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

export default function LeafletMap({ merchants, onSelect }: {
  merchants: any[]
  onSelect: (m: any) => void
}) {
  const ref    = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const L = require('leaflet')
    const map = L.map(ref.current, {
      center: [13.745, 100.561], zoom: 11,
      zoomControl: true, attributionControl: false,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }).addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !merchants.length) return
    const L = require('leaflet')

    map.eachLayer((l: any) => { if (l._isMarker) map.removeLayer(l) })

    merchants.forEach(m => {
      const color  = m.qrRemaining > 0 ? '#3fb950' : '#f85149'
      const icon   = L.divIcon({
        className: '',
        html: `<div style="
          background:rgba(22,27,34,.95);border:1.5px solid ${color};
          border-radius:8px;padding:3px 8px;
          font-family:'Kanit',sans-serif;font-size:11px;font-weight:700;color:#fff;
          display:flex;align-items:center;gap:4px;white-space:nowrap;cursor:pointer;
          box-shadow:0 2px 8px rgba(0,0,0,.5)">
          <span style="width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0"></span>
          ${m.name.length > 9 ? m.name.slice(0, 8) + '…' : m.name}
          <span style="font-size:9px;padding:1px 4px;border-radius:3px;
            background:${m.qrRemaining > 0 ? 'rgba(63,185,80,.8)' : 'rgba(248,81,73,.8)'};
            color:#fff">${m.qrRemaining > 0 ? m.qrRemaining : 'หมด'}</span>
        </div>`,
        iconSize: [0, 0], iconAnchor: [0, 26],
      })
      const mk = L.marker([m.lat, m.lng], { icon })
      ;(mk as any)._isMarker = true
      mk.addTo(map).on('click', () => onSelect(m))
    })
  }, [merchants, onSelect])

  return <div ref={ref} style={{ flex: 1, width: '100%', height: '100%', minHeight: 400 }} />
}
