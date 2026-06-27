import { useMemo } from 'react'

export default function GPSPanel({
  position,
  speed,
  heading,
  accuracy,
  isTracking,
  trackHistory,
  compact,
}) {
  const totalDistance = useMemo(() => {
    if (trackHistory.length < 2) return 0
    let total = 0
    for (let i = 1; i < trackHistory.length; i++) {
      const p1 = trackHistory[i - 1]
      const p2 = trackHistory[i]
      total += haversine(p1.lat, p1.lng, p2.lat, p2.lng)
    }
    return total
  }, [trackHistory])

  if (compact) {
    if (!isTracking || !position) return null
    return (
      <div className="gps-hud">
        <div className="gps-hud-row">
          <span className="gps-hud-value">{speed !== null ? `${speed.toFixed(0)}` : '0'}</span>
          <span className="gps-hud-unit">km/h</span>
        </div>
        <div className="gps-hud-row gps-hud-sub">
          <span>{totalDistance.toFixed(1)} km</span>
          <span className="gps-hud-dot">·</span>
          <span>±{accuracy !== null ? accuracy.toFixed(0) : '?'}m</span>
        </div>
      </div>
    )
  }

  if (!isTracking) {
    return (
      <div className="gps-panel">
        <div className="gps-panel-header">
          <h3>GPS</h3>
          <span className="gps-status offline">Inactivo</span>
        </div>
        <div className="gps-panel-empty">
          Activa el GPS desde la barra de herramientas
        </div>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="gps-panel">
        <div className="gps-panel-header">
          <h3>GPS</h3>
          <span className="gps-status searching">Buscando...</span>
        </div>
        <div className="gps-panel-empty">
          Esperando señal GPS...
        </div>
      </div>
    )
  }

  return (
    <div className="gps-panel">
      <div className="gps-panel-header">
        <h3>GPS</h3>
        <span className="gps-status online">Activo</span>
      </div>

      <div className="gps-stats">
        <div className="gps-stat">
          <span className="gps-stat-label">Velocidad</span>
          <span className="gps-stat-value">
            {speed !== null ? `${speed.toFixed(1)} km/h` : '0 km/h'}
          </span>
        </div>
        <div className="gps-stat">
          <span className="gps-stat-label">Dirección</span>
          <span className="gps-stat-value">
            {heading !== null ? `${heading.toFixed(0)}°` : '-'}
          </span>
        </div>
        <div className="gps-stat">
          <span className="gps-stat-label">Precisión</span>
          <span className="gps-stat-value">
            {accuracy !== null ? `±${accuracy.toFixed(0)}m` : '-'}
          </span>
        </div>
        <div className="gps-stat">
          <span className="gps-stat-label">Recorrido</span>
          <span className="gps-stat-value">
            {totalDistance.toFixed(2)} km
          </span>
        </div>
        <div className="gps-stat">
          <span className="gps-stat-label">Latitud</span>
          <span className="gps-stat-value">
            {position.lat.toFixed(5)}
          </span>
        </div>
        <div className="gps-stat">
          <span className="gps-stat-label">Longitud</span>
          <span className="gps-stat-value">
            {position.lng.toFixed(5)}
          </span>
        </div>
      </div>
    </div>
  )
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
