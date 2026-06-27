import { useMemo } from 'react'

export default function RoutePanel({
  waypoints,
  routeDistance,
  routeDuration,
  isCalculating,
  onRemoveWaypoint,
  onMoveWaypoint,
  startPosition,
  hasStart,
}) {
  const totalAscent = useMemo(() => {
    return 0
  }, [waypoints])

  const pointCount = waypoints.length + (hasStart ? 1 : 0)

  if (pointCount === 0) {
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
        <h3>Ruta ({pointCount} pts)</h3>
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
        {hasStart && startPosition && (
          <div className="waypoint-item waypoint-start">
            <span className="waypoint-index start-index">0</span>
            <div className="waypoint-coords">
              <span className="start-label-text">Mi posición</span>
              <span className="start-coords">
                {startPosition.lat.toFixed(5)}, {startPosition.lng.toFixed(5)}
              </span>
            </div>
            <div className="waypoint-actions">
              <span className="start-badge">GPS</span>
            </div>
          </div>
        )}
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
