import { useMemo } from 'react'

export default function RoutePanel({
  waypoints,
  routeDistance,
  routeDuration,
  isCalculating,
  onRemoveWaypoint,
  onMoveWaypoint,
}) {
  const totalAscent = useMemo(() => {
    return 0
  }, [waypoints])

  if (waypoints.length === 0) {
    return (
      <div className="route-panel">
        <div className="route-panel-header">
          <h3>Ruta</h3>
        </div>
        <div className="route-panel-empty">
          <p>Activa el modo <strong>Añadir</strong> y haz clic en el mapa para crear tu ruta.</p>
          <p className="hint">Arrastra los puntos para ajustar la ruta · Doble clic para eliminar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="route-panel">
      <div className="route-panel-header">
        <h3>Ruta ({waypoints.length} pts)</h3>
      </div>

      <div className="route-stats">
        <div className="stat">
          <span className="stat-label">Distancia</span>
          <span className="stat-value">
            {isCalculating ? (
              <span className="calculating">...</span>
            ) : (
              `${routeDistance.toFixed(1)} km`
            )}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Duración estimada</span>
          <span className="stat-value">
            {isCalculating ? (
              <span className="calculating">...</span>
            ) : (
              formatDuration(routeDuration)
            )}
          </span>
        </div>
      </div>

      <div className="waypoint-list">
        {waypoints.map((wp, i) => (
          <div key={`wp-${i}`} className="waypoint-item">
            <span className="waypoint-index">{i + 1}</span>
            <div className="waypoint-coords">
              {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
            </div>
            <div className="waypoint-actions">
              <button
                className="wp-btn"
                onClick={() => onMoveWaypoint(i, i - 1)}
                disabled={i === 0}
                title="Mover arriba"
              >
                ↑
              </button>
              <button
                className="wp-btn"
                onClick={() => onMoveWaypoint(i, i + 1)}
                disabled={i === waypoints.length - 1}
                title="Mover abajo"
              >
                ↓
              </button>
              <button
                className="wp-btn wp-btn-delete"
                onClick={() => onRemoveWaypoint(i)}
                title="Eliminar punto"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '-'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m} min`
  return `${h}h ${m}min`
}
