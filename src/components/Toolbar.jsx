import { useState, useRef } from 'react'
import { exportGPX, importGPX } from '../utils/gpx'

export default function Toolbar({
  mode,
  onModeChange,
  waypoints,
  routeCoords,
  isTracking,
  onStartGPS,
  onStopGPS,
  onClear,
  onSave,
  savedRoutes,
  onLoadRoute,
  onDeleteRoute,
  onImportRoute,
  gpsError,
}) {
  const fileInputRef = useRef(null)
  const [showSaved, setShowSaved] = useState(false)
  const [saveName, setSaveName] = useState('')

  const handleExportGPX = () => {
    exportGPX(waypoints, routeCoords, 'MotoRouter Ruta')
  }

  const handleImportGPX = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const wps = await importGPX(file)
      onImportRoute(wps)
    } catch (err) {
      alert(err.message)
    }
    e.target.value = ''
  }

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">Modo</span>
        <div className="toolbar-buttons">
          <button
            className={`tool-btn ${mode === 'add' ? 'active' : ''}`}
            onClick={() => onModeChange(mode === 'add' ? 'view' : 'add')}
            title="Añadir puntos en el mapa"
          >
            <span className="tool-icon">📍</span>
            <span className="tool-text">Añadir</span>
          </button>
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <span className="toolbar-label">GPS</span>
        <button
          className={`tool-btn ${isTracking ? 'active gps-active' : ''}`}
          onClick={isTracking ? onStopGPS : onStartGPS}
          title={isTracking ? 'Detener GPS' : 'Iniciar GPS'}
        >
          <span className="tool-icon">{isTracking ? '🛑' : '🛰️'}</span>
          <span className="tool-text">{isTracking ? 'Detener' : 'GPS'}</span>
        </button>
        {gpsError && <span className="gps-error">{gpsError}</span>}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <span className="toolbar-label">Ruta</span>
        <div className="toolbar-buttons">
          <button
            className="tool-btn"
            onClick={onClear}
            disabled={waypoints.length === 0}
            title="Limpiar todos los puntos"
          >
            <span className="tool-icon">🧹</span>
            <span className="tool-text">Limpiar</span>
          </button>
          <button
            className="tool-btn"
            onClick={handleExportGPX}
            disabled={waypoints.length < 2}
            title="Exportar a GPX"
          >
            <span className="tool-icon">📤</span>
            <span className="tool-text">Exportar</span>
          </button>
          <button
            className="tool-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Importar desde GPX"
          >
            <span className="tool-icon">📥</span>
            <span className="tool-text">Importar</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx"
            onChange={handleImportGPX}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <span className="toolbar-label">Guardar</span>
        <div className="toolbar-save">
          <input
            type="text"
            className="save-input"
            placeholder="Nombre de la ruta..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && saveName.trim()) {
                onSave(saveName.trim())
                setSaveName('')
              }
            }}
          />
          <button
            className="tool-btn"
            onClick={() => {
              if (saveName.trim()) {
                onSave(saveName.trim())
                setSaveName('')
              }
            }}
            disabled={waypoints.length < 2 || !saveName.trim()}
          >
            💾
          </button>
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section saved-section">
        <button
          className="tool-btn"
          onClick={() => setShowSaved(!showSaved)}
          disabled={savedRoutes.length === 0}
        >
          <span className="tool-icon">📂</span>
          <span className="tool-text">
            Guardadas ({savedRoutes.length})
          </span>
          <span className={`arrow ${showSaved ? 'up' : ''}`}>▾</span>
        </button>

        {showSaved && (
          <div className="saved-list">
            {savedRoutes.length === 0 ? (
              <div className="saved-empty">No hay rutas guardadas</div>
            ) : (
              savedRoutes.map((route) => (
                <div key={route.id} className="saved-item">
                  <div
                    className="saved-item-info"
                    onClick={() => {
                      onLoadRoute(route)
                      setShowSaved(false)
                    }}
                  >
                    <div className="saved-item-name">{route.name}</div>
                    <div className="saved-item-meta">
                      {route.waypoints.length} pts · {route.distance.toFixed(1)} km
                    </div>
                  </div>
                  <button
                    className="saved-item-delete"
                    onClick={() => onDeleteRoute(route.id)}
                    title="Eliminar ruta guardada"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
