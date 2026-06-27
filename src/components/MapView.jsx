import { useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import DraggableMarker from './DraggableMarker'

function MapClickHandler({ onMapClick, mode }) {
  useMapEvents({
    click(e) {
      if (mode === 'add') {
        onMapClick(e.latlng)
      }
    },
  })
  return null
}

function FitBounds({ waypoints }) {
  const map = useMap()
  const prevLenRef = useRef(0)

  useEffect(() => {
    if (waypoints.length > 0 && waypoints.length !== prevLenRef.current) {
      prevLenRef.current = waypoints.length
      if (waypoints.length === 1) {
        map.setView([waypoints[0].lat, waypoints[0].lng], map.getZoom())
      } else {
        const bounds = L.latLngBounds(waypoints.map((wp) => [wp.lat, wp.lng]))
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      }
    }
  }, [waypoints, map])

  return null
}

function GPSPosition({ position, heading }) {
  const map = useMap()

  useEffect(() => {
    if (!position) return
    const icon = L.divIcon({
      className: 'gps-marker',
      html: `<div class="gps-dot" style="transform: rotate(${heading || 0}deg)">▶</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
    const marker = L.marker([position.lat, position.lng], { icon, zIndexOffset: 1000 }).addTo(map)
    const accuracyCircle = L.circle([position.lat, position.lng], {
      radius: 20,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 1,
    }).addTo(map)

    return () => {
      map.removeLayer(marker)
      map.removeLayer(accuracyCircle)
    }
  }, [position, heading, map])

  return null
}

function TrackHistoryLine({ trackHistory }) {
  if (trackHistory.length < 2) return null
  return (
    <Polyline
      positions={trackHistory.map((p) => [p.lat, p.lng])}
      pathOptions={{ color: '#3b82f6', weight: 3, dashArray: '8 4', opacity: 0.6 }}
    />
  )
}

export default function MapView({
  waypoints,
  routeCoords,
  mode,
  onMapClick,
  onDragWaypoint,
  gpsPosition,
  gpsHeading,
  trackHistory,
}) {
  const defaultCenter = [40.4168, -3.7038]
  const defaultZoom = 6

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="map-container"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onMapClick={onMapClick} mode={mode} />

      <FitBounds waypoints={waypoints} />

      {waypoints.map((wp, i) => (
        <DraggableMarker
          key={`wp-${i}`}
          index={i}
          position={[wp.lat, wp.lng]}
          onDrag={onDragWaypoint}
        />
      ))}

      {routeCoords.length > 0 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: '#dc2626',
            weight: 4,
            opacity: 0.8,
            dashArray: null,
          }}
        />
      )}

      {gpsPosition && (
        <>
          <GPSPosition position={gpsPosition} heading={gpsHeading} />
          <TrackHistoryLine trackHistory={trackHistory} />
        </>
      )}
    </MapContainer>
  )
}
