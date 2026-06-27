import { useState, useCallback, useEffect, useRef } from 'react'
import MapView from './components/MapView'
import Toolbar from './components/Toolbar'
import RoutePanel from './components/RoutePanel'
import GPSPanel from './components/GPSPanel'
import { useRoute } from './hooks/useRoute'
import { useGPS } from './hooks/useGPS'

const PASS_THRESHOLD_KM = 0.05
const OFF_ROUTE_THRESHOLD_KM = 0.05

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

function distanceToRoute(point, routeCoords) {
  if (routeCoords.length < 2) return Infinity
  const step = Math.max(1, Math.floor(routeCoords.length / 100))
  let minDist = Infinity
  for (let i = 0; i < routeCoords.length; i += step) {
    const d = haversine(point.lat, point.lng, routeCoords[i][0], routeCoords[i][1])
    if (d < minDist) minDist = d
  }
  return minDist
}

export default function App() {
  const [mode, setMode] = useState('add')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [followMode, setFollowMode] = useState(true)
  const [offRoute, setOffRoute] = useState(false)
  const recalcLockRef = useRef(false)

  const {
    position: gpsPosition,
    heading: gpsHeading,
    speed: gpsSpeed,
    accuracy: gpsAccuracy,
    isTracking,
    error: gpsError,
    trackHistory,
    startTracking,
    stopTracking,
  } = useGPS()

  const {
    waypoints,
    routeCoords,
    routeDistance,
    routeDuration,
    isCalculating,
    savedRoutes,
    hasStart,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    moveWaypoint,
    clearWaypoints,
    saveCurrentRoute,
    loadRoute,
    deleteSavedRoute,
    importRoute,
    recalculateFrom,
    profile,
    changeProfile,
  } = useRoute()

  useEffect(() => {
    if (gpsPosition && isTracking && waypoints.length > 0) {
      recalculateFrom(gpsPosition)
    }
  }, [isTracking])

  useEffect(() => {
    if (!gpsPosition || !isTracking) return
    if (waypoints.length === 0) {
      setOffRoute(false)
      return
    }

    const distToFirst = haversine(
      gpsPosition.lat, gpsPosition.lng,
      waypoints[0].lat, waypoints[0].lng
    )
    if (distToFirst < PASS_THRESHOLD_KM) {
      removeWaypoint(0)
      return
    }

    if (routeCoords.length > 0 && !recalcLockRef.current) {
      const distToRoute = distanceToRoute(gpsPosition, routeCoords)
      if (distToRoute > OFF_ROUTE_THRESHOLD_KM) {
        setOffRoute(true)
        recalcLockRef.current = true
        recalculateFrom(gpsPosition)
        setTimeout(() => {
          recalcLockRef.current = false
          setOffRoute(false)
        }, 3000)
      } else {
        setOffRoute(false)
      }
    }
  }, [gpsPosition, isTracking, waypoints, routeCoords, removeWaypoint, recalculateFrom])

  const handleMapClick = useCallback(
    (latlng) => {
      addWaypoint(latlng)
      if (gpsPosition && isTracking) {
        recalculateFrom(gpsPosition)
      }
    },
    [addWaypoint, gpsPosition, isTracking, recalculateFrom]
  )

  const handleDragWaypoint = useCallback(
    (index, latlng) => {
      if (latlng === null) {
        removeWaypoint(index)
      } else {
        updateWaypoint(index, latlng)
      }
      if (gpsPosition && isTracking) {
        setTimeout(() => recalculateFrom(gpsPosition), 100)
      }
    },
    [removeWaypoint, updateWaypoint, gpsPosition, isTracking, recalculateFrom]
  )

  const handleRemoveWaypoint = useCallback(
    (index) => removeWaypoint(index),
    [removeWaypoint]
  )

  const handleMoveWaypoint = useCallback(
    (from, to) => moveWaypoint(from, to),
    [moveWaypoint]
  )

  return (
    <div className="app">
      <header className="app-header">
        <h1>MotoRouter</h1>
        <span className="app-subtitle">Planificador de rutas en moto</span>
      </header>

      <Toolbar
        mode={mode}
        onModeChange={setMode}
        waypoints={waypoints}
        routeCoords={routeCoords}
        isTracking={isTracking}
        onStartGPS={startTracking}
        onStopGPS={stopTracking}
        onClear={clearWaypoints}
        onSave={saveCurrentRoute}
        savedRoutes={savedRoutes}
        onLoadRoute={loadRoute}
        onDeleteRoute={deleteSavedRoute}
        onImportRoute={importRoute}
        gpsError={gpsError}
        profile={profile}
        onProfileChange={changeProfile}
      />

      <div className="main-content">
        <div className="map-wrapper">
          <MapView
            waypoints={waypoints}
            routeCoords={routeCoords}
            mode={mode}
            onMapClick={handleMapClick}
            onDragWaypoint={handleDragWaypoint}
            gpsPosition={gpsPosition}
            gpsHeading={gpsHeading}
            trackHistory={trackHistory}
            hasStart={hasStart}
            followMode={followMode}
            isTracking={isTracking}
          />

          {isCalculating && (
            <div className="calculating-overlay">
              <div className="spinner" />
              Calculando ruta...
            </div>
          )}

          {offRoute && (
            <div className="offroute-badge">
              <span>⚠</span> Fuera de ruta — recalculando...
            </div>
          )}

          <div className="gps-hud-mobile">
            <GPSPanel
              position={gpsPosition}
              speed={gpsSpeed}
              heading={gpsHeading}
              accuracy={gpsAccuracy}
              isTracking={isTracking}
              trackHistory={trackHistory}
              compact
            />
          </div>

          <button
            className={`sidebar-toggle ${sidebarOpen ? 'open' : ''}`}
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
          >
            <span className="sidebar-toggle-icon">
              {sidebarOpen ? '▾' : '▴'}
            </span>
            <span className="sidebar-toggle-text">
              {sidebarOpen ? 'Cerrar' : `${waypoints.length + (hasStart ? 1 : 0)} pts`}
            </span>
          </button>

          <button
            className={`follow-btn ${followMode ? 'active' : ''}`}
            onClick={() => setFollowMode((f) => !f)}
            title={followMode ? 'Seguimiento activo' : 'Seguimiento desactivado'}
          >
            <span className="follow-icon">{followMode ? '📌' : '📍'}</span>
          </button>
        </div>

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-handle" onClick={() => setSidebarOpen(false)}>
            <div className="sidebar-handle-bar" />
          </div>
          <RoutePanel
            waypoints={waypoints}
            routeDistance={routeDistance}
            routeDuration={routeDuration}
            isCalculating={isCalculating}
            onRemoveWaypoint={handleRemoveWaypoint}
            onMoveWaypoint={handleMoveWaypoint}
            startPosition={gpsPosition}
            hasStart={hasStart}
          />
          <GPSPanel
            position={gpsPosition}
            speed={gpsSpeed}
            heading={gpsHeading}
            accuracy={gpsAccuracy}
            isTracking={isTracking}
            trackHistory={trackHistory}
          />
        </aside>
      </div>
    </div>
  )
}
