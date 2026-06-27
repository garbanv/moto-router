function toXML(obj) {
  if (typeof obj === 'string') return obj
  let xml = ''
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (val === undefined || val === null) continue
    if (Array.isArray(val)) {
      xml += val.map((item) => `<${key}>${toXML(item)}</${key}>`).join('')
    } else if (typeof val === 'object') {
      xml += `<${key}>${toXML(val)}</${key}>`
    } else {
      xml += `<${key}>${escapeXml(String(val))}</${key}>`
    }
  }
  return xml
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function exportGPX(waypoints, routeCoords, name) {
  const now = new Date().toISOString()
  const wptElements = waypoints.map((wp, i) => ({
    wpt: {
      _attributes: `lat="${wp.lat}" lon="${wp.lng}"`,
      name: `Punto ${i + 1}`,
      sym: 'Waypoint',
    },
  }))

  const trkptElements = routeCoords.map((coord) => ({
    trkpt: {
      _attributes: `lat="${coord[0]}" lon="${coord[1]}"`,
      ele: '0',
    },
  }))

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MotoRouter"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name || 'Ruta MotoRouter')}</name>
    <time>${now}</time>
  </metadata>
  ${wptElements.map((w) => `<wpt ${w.wpt._attributes}><name>${w.wpt.name}</name><sym>${w.wpt.sym}</sym></wpt>`).join('\n  ')}
  <trk>
    <name>${escapeXml(name || 'Ruta MotoRouter')}</name>
    <trkseg>
      ${trkptElements.map((t) => `<trkpt ${t.trkpt._attributes}><ele>${t.trkpt.ele}</ele></trkpt>`).join('\n      ')}
    </trkseg>
  </trk>
</gpx>`

  const blob = new Blob([gpx], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(name || 'ruta').replace(/\s+/g, '_')}.gpx`
  a.click()
  URL.revokeObjectURL(url)
}

export function importGPX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(e.target.result, 'text/xml')

        const parsedWpts = []
        const wpts = doc.querySelectorAll('wpt')
        wpts.forEach((wpt) => {
          const lat = parseFloat(wpt.getAttribute('lat'))
          const lon = parseFloat(wpt.getAttribute('lon'))
          if (!isNaN(lat) && !isNaN(lon)) {
            parsedWpts.push({ lat, lng: lon })
          }
        })

        const trkpts = doc.querySelectorAll('trkpt')
        const parsedTrk = []
        trkpts.forEach((trkpt) => {
          const lat = parseFloat(trkpt.getAttribute('lat'))
          const lon = parseFloat(trkpt.getAttribute('lon'))
          if (!isNaN(lat) && !isNaN(lon)) {
            parsedTrk.push({ lat, lng: lon })
          }
        })

        const result = parsedWpts.length >= 2 ? parsedWpts : parsedTrk
        if (result.length < 2) {
          reject(new Error('El archivo GPX debe contener al menos 2 puntos'))
          return
        }
        resolve(result)
      } catch (err) {
        reject(new Error('Error al parsear el archivo GPX'))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsText(file)
  })
}
