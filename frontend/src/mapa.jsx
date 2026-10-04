import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import icone from 'leaflet/dist/images/marker-icon.png'
import icone2x from 'leaflet/dist/images/marker-icon-2x.png'
import sombra from 'leaflet/dist/images/marker-shadow.png'

// O Vite não resolve sozinho os ícones padrão do Leaflet.
L.Icon.Default.mergeOptions({ iconUrl: icone, iconRetinaUrl: icone2x, shadowUrl: sombra })

// Cores de veículo: todas legíveis com texto escuro e distintas entre si sobre o mapa escuro.
export const CORES = ['#3dd6c0', '#7aa7ff', '#f07ab0', '#b79cff', '#a6e22e', '#56ccf2', '#7ee2a8', '#e8c9a0']
export const COR_LOJA = '#f4f7f5'
export const COR_PARADA = '#ffc857'
export const COR_ACENTO = '#ff6a3d'

// ícone "fuel" do Lucide, em texto, porque o pin do Leaflet é HTML puro
const bomba =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>'

export function pinColorido(cor, texto = '') {
  return L.divIcon({
    className: 'pin',
    html: `<span style="background:${cor}">${texto}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export const pinParada = () => pinColorido(COR_PARADA, bomba)

export function Mapa({ centro, zoom, children }) {
  return (
    <MapContainer center={centro} zoom={zoom} className="mapa">
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
    if (pontos.length > 1) mapa.fitBounds(pontos, { padding: [40, 40] })
  }, [pontos.length]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
