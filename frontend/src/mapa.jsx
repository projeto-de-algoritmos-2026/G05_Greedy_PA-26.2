import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import icone from 'leaflet/dist/images/marker-icon.png'
import icone2x from 'leaflet/dist/images/marker-icon-2x.png'
import sombra from 'leaflet/dist/images/marker-shadow.png'

// O Vite não resolve sozinho os ícones padrão do Leaflet.
L.Icon.Default.mergeOptions({ iconUrl: icone, iconRetinaUrl: icone2x, shadowUrl: sombra })

export const CORES = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#be185d', '#4d7c0f']

export function pinColorido(cor, texto = '') {
  return L.divIcon({
    className: 'pin',
    html: `<span style="background:${cor}">${texto}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

export function Mapa({ centro, zoom, children, altura = 420 }) {
  return (
    <MapContainer center={centro} zoom={zoom} style={{ height: altura }} className="mapa">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  )
}

export function AoClicar({ onClick }) {
  useMapEvents({ click: (e) => onClick([e.latlng.lat, e.latlng.lng]) })
  return null
}

export function Recentralizar({ centro, zoom }) {
  const mapa = useMap()
  useEffect(() => {
    if (centro) mapa.setView(centro, zoom ?? mapa.getZoom())
  }, [centro?.[0], centro?.[1]]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function Ajustar({ pontos }) {
  const mapa = useMap()
  useEffect(() => {
    if (pontos.length > 1) mapa.fitBounds(pontos, { padding: [30, 30] })
  }, [pontos.length]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
