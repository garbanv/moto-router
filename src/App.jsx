import { useState, useCallback } from 'react'
import MapView from './components/MapView'
import Toolbar from './components/Toolbar'
import RoutePanel from './components/RoutePanel'
import GPSPanel from './components/GPSPanel'
import { useRoute } from './hooks/useRoute'
import { useGPS } from './hooks/useGPS'

export default function App() {
  const [mode, setMode] = useState('add')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
  } = useRoute(gpsPosition)

  const handleMapClick = useCallback(
    (latlng) => {
      addWaypoint(latlng)
    },
    [addWaypoint]
  )

  const handleDragWaypoint = useCallback(
    (index, latlng) => {
      if (latlng === null) {
        removeWaypoint(index)
      } else {
        updateWaypoint(index, latlng)
      }
    },
    [removeWaypoint, updateWaypoint]
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
          />

          {isCalculating && (
            <div className="calculating-overlay">
              <div className="spinner" />
              Calculando ruta...
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
            className="sidebar-toggle"
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
