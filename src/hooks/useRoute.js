import { useState, useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'moto-router-routes'

function loadRoutes() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveRoutes(routes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes))
  } catch {
  }
}

export function useRoute() {
  const [waypoints, setWaypoints] = useState([])
  const [routeCoords, setRouteCoords] = useState([])
  const [routeDistance, setRouteDistance] = useState(0)
  const [routeDuration, setRouteDuration] = useState(0)
  const [savedRoutes, setSavedRoutes] = useState(loadRoutes)
  const [isCalculating, setIsCalculating] = useState(false)
  const [profile, setProfile] = useState('driving')
  const startPosRef = useRef(null)
  const abortRef = useRef(null)

  const addWaypoint = useCallback((latlng) => {
    setWaypoints((prev) => [...prev, { lat: latlng.lat, lng: latlng.lng }])
  }, [])

  const removeWaypoint = useCallback((index) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateWaypoint = useCallback((index, latlng) => {
    setWaypoints((prev) =>
      prev.map((wp, i) => (i === index ? { lat: latlng.lat, lng: latlng.lng } : wp))
    )
  }, [])

  const moveWaypoint = useCallback((fromIndex, toIndex) => {
    setWaypoints((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const clearWaypoints = useCallback(() => {
    setWaypoints([])
    setRouteCoords([])
    setRouteDistance(0)
    setRouteDuration(0)
  }, [])

  const calculateRoute = useCallback(async (wps, startPos, routeProfile) => {
    const p = routeProfile || profile
    const points = startPos ? [startPos, ...wps] : wps
    if (points.length < 2) {
      setRouteCoords([])
      setRouteDistance(0)
      setRouteDuration(0)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsCalculating(true)
    try {
      const coordinates = points.map((wp) => `${wp.lng},${wp.lat}`).join(';')
      const url = `https://router.project-osrm.org/route/v1/${p}/${coordinates}?overview=full&geometries=geojson&steps=true`

      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error('Routing request failed')

      const data = await res.json()
      if (!data.routes || data.routes.length === 0) throw new Error('No route found')

      const route = data.routes[0]
      const coords = route.geometry.coordinates.map((c) => [c[1], c[0]])

      setRouteCoords(coords)
      setRouteDistance(route.distance / 1000)
      setRouteDuration(route.duration / 60)
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Routing error:', err)
      }
    } finally {
      setIsCalculating(false)
    }
  }, [profile])

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateRoute(waypoints, startPosRef.current, profile)
    }, 300)
    return () => clearTimeout(timer)
  }, [waypoints, calculateRoute, profile])

  const recalculateFrom = useCallback((startPos) => {
    startPosRef.current = startPos
    if (startPos && waypoints.length > 0) {
      calculateRoute(waypoints, startPos, profile)
    }
  }, [waypoints, calculateRoute, profile])

  const hasStart = !!(startPosRef.current && waypoints.length > 0)

  const saveCurrentRoute = useCallback(
    (name) => {
      const saveWps = startPosRef.current
        ? [{ lat: startPosRef.current.lat, lng: startPosRef.current.lng, _start: true }, ...waypoints]
        : [...waypoints]
      if (saveWps.length === 0) return
      const route = {
        id: Date.now().toString(),
        name: name || `Ruta ${new Date().toLocaleDateString()}`,
        waypoints: saveWps,
        distance: routeDistance,
        duration: routeDuration,
        createdAt: new Date().toISOString(),
      }
      setSavedRoutes((prev) => {
        const next = [...prev, route]
        saveRoutes(next)
        return next
      })
    },
    [waypoints, routeDistance, routeDuration]
  )

  const loadRoute = useCallback((route) => {
    setWaypoints(route.waypoints)
  }, [])

  const deleteSavedRoute = useCallback((id) => {
    setSavedRoutes((prev) => {
      const next = prev.filter((r) => r.id !== id)
      saveRoutes(next)
      return next
    })
  }, [])

  const importRoute = useCallback((wps) => {
    setWaypoints(wps)
  }, [])

  const changeProfile = useCallback((newProfile) => {
    setProfile(newProfile)
  }, [])

  return {
    waypoints,
    routeCoords,
    routeDistance,
    routeDuration,
    isCalculating,
    savedRoutes,
    hasStart,
    profile,
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
    changeProfile,
  }
}
