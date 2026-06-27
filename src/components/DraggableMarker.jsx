import { useRef, useMemo, useCallback } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const colors = [
  '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a',
  '#0891b2', '#2563eb', '#7c3aed', '#c026d3', '#be185d',
]

const svgIcon = (color, label) => L.divIcon({
  className: 'waypoint-marker',
  html: `<div style="
    background:${color};color:white;width:28px;height:28px;
    border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:bold;border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  ">${label}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export default function DraggableMarker({ index, position, onDrag }) {
  const ref = useRef(null)
  const color = useMemo(() => colors[index % colors.length], [index])
  const icon = useMemo(() => svgIcon(color, index + 1), [color, index])

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = ref.current
        if (marker) {
          const latlng = marker.getLatLng()
          onDrag(index, latlng)
        }
      },
      dblclick() {
        onDrag(index, null)
      },
    }),
    [index, onDrag]
  )

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      icon={icon}
      position={position}
      ref={ref}
    >
      <Popup>
        <div style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
          <strong>Punto {index + 1}</strong>
          <br />
          <span style={{ fontSize: '11px', color: '#666' }}>
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </span>
          <br />
          <span style={{ fontSize: '10px', color: '#999' }}>
            Arrastra para mover · Doble clic para eliminar
          </span>
        </div>
      </Popup>
    </Marker>
  )
}
