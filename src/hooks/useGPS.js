import { useState, useRef, useCallback, useEffect } from 'react'

export function useGPS() {
  const [position, setPosition] = useState(null)
  const [heading, setHeading] = useState(null)
  const [speed, setSpeed] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState(null)
  const [trackHistory, setTrackHistory] = useState([])
  const watchIdRef = useRef(null)
  const lastPointRef = useRef(null)

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada')
      return
    }

    const onSuccess = (pos) => {
      const { latitude, longitude, heading: h, speed: s, accuracy: a } = pos.coords
      const newPos = { lat: latitude, lng: longitude }

      setPosition(newPos)
      setHeading(h)
      setSpeed(s !== null && s !== undefined ? s * 3.6 : null)
      setAccuracy(a)
      setError(null)

      const now = Date.now()
      if (
        lastPointRef.current &&
        lastPointRef.current.lat === latitude &&
        lastPointRef.current.lng === longitude
      ) {
        return
      }
      lastPointRef.current = { lat: latitude, lng: longitude }

      setTrackHistory((prev) => {
        if (prev.length === 0) return [newPos]
        const last = prev[prev.length - 1]
        if (last.lat === latitude && last.lng === longitude) return prev
        return [...prev, { ...newPos, time: now }]
      })
    }

    const onError = (err) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('Permiso de ubicación denegado')
          break
        case err.POSITION_UNAVAILABLE:
          setError('Ubicación no disponible')
          break
        case err.TIMEOUT:
          setError('Tiempo de espera agotado')
          break
        default:
          setError('Error desconocido')
      }
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000,
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      options
    )
    setIsTracking(true)
  }, [])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
    setTrackHistory([])
    lastPointRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return {
    position,
    heading,
    speed,
    accuracy,
    isTracking,
    error,
    trackHistory,
    startTracking,
    stopTracking,
  }
}
