import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { MapPin, AlertTriangle, CheckCircle, XCircle, ZoomIn, ZoomOut, Move } from "lucide-react"
import { useAppStore } from "@/store"
import type { StoreMapPoint } from "@/types"
import { cn } from "@/lib/utils"

const statusColor: Record<StoreMapPoint["turnover_status"], string> = {
  normal: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
}

const statusLabel: Record<StoreMapPoint["turnover_status"], string> = {
  normal: "正常",
  warning: "预警",
  critical: "异常",
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ""
const USE_MAPBOX = MAPBOX_TOKEN.length > 0

const MAP_BOUNDS = { minLng: 116.1, maxLng: 117.0, minLat: 39.7, maxLat: 40.2 }

function lngLatToPercent(lng: number, lat: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100
  return { x, y }
}

function StatusDot({ status, label }: { status: StoreMapPoint["turnover_status"]; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: statusColor[status], boxShadow: `0 0 6px ${statusColor[status]}80` }}
      />
      {label}
    </span>
  )
}

function StoreMarkerSVG({
  point,
  selected,
  onClick,
}: {
  point: StoreMapPoint
  selected: boolean
  onClick: () => void
}) {
  const size = 14 + (point.vehicle_count / 200) * 18
  const color = statusColor[point.turnover_status]
  const { x, y } = lngLatToPercent(point.lng, point.lat)

  return (
    <g
      className="cursor-pointer transition-all duration-200 hover:opacity-100"
      style={{ opacity: selected ? 1 : 0.9 }}
      onClick={onClick}
      transform={`translate(${x}%, ${y}%)`}
    >
      <circle
        r={size + 8}
        fill={color}
        fillOpacity="0.15"
        className="animate-pulse"
      />
      <circle
        r={size}
        fill={color}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        style={{
          filter: `drop-shadow(0 0 8px ${color}80)`,
          transition: "r 0.2s ease",
        }}
        className="hover:r-[calc(var(--size)+4)]"
      />
      <text
        textAnchor="middle"
        dy="4"
        fill="white"
        fontSize="10"
        fontWeight="600"
        style={{ pointerEvents: "none" }}
      >
        {point.vehicle_count}
      </text>
    </g>
  )
}

function SimulatedMap() {
  const storeMapPoints = useAppStore((s) => s.storeMapPoints)
  const selectedStoreName = useAppStore((s) => s.selectedStoreName)
  const setSelectedStoreName = useAppStore((s) => s.setSelectedStoreName)
  const [hoveredStore, setHoveredStore] = useState<string | null>(null)

  const handleMarkerClick = (point: StoreMapPoint) => {
    setSelectedStoreName(point.store_name === selectedStoreName ? null : point.store_name)
  }

  const selectedPoint = storeMapPoints.find((p) => p.store_name === selectedStoreName)
  const hoveredPoint = storeMapPoints.find((p) => p.store_name === hoveredStore)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundColor: "#0d1117" }} />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <pattern id="gridPattern" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.15" fill="#2a3048" fillOpacity="0.6" />
          </pattern>
        </defs>

        <rect width="100" height="100" fill="url(#mapGlow)" />
        <rect width="100" height="100" fill="url(#gridPattern)" />

        <path
          d="M 10 30 Q 30 20, 50 35 T 90 30"
          stroke="#1e3a5f"
          strokeWidth="0.3"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M 15 60 Q 40 50, 60 65 T 95 55"
          stroke="#1e3a5f"
          strokeWidth="0.3"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M 5 45 L 95 48"
          stroke="#1e3a5f"
          strokeWidth="0.2"
          fill="none"
          opacity="0.4"
          strokeDasharray="1 0.5"
        />

        {storeMapPoints.map((point) => (
          <g key={point.store_id}>
            <StoreMarkerSVG
              point={point}
              selected={selectedStoreName === point.store_name}
              onClick={() => handleMarkerClick(point)}
            />
          </g>
        ))}
      </svg>

      {(hoveredPoint || selectedPoint) && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg border px-3 py-2 text-xs shadow-lg"
          style={{
            left: hoveredPoint
              ? `${lngLatToPercent(hoveredPoint.lng, hoveredPoint.lat).x}%`
              : `${lngLatToPercent(selectedPoint!.lng, selectedPoint!.lat).x}%`,
            top: hoveredPoint
              ? `${lngLatToPercent(hoveredPoint.lng, hoveredPoint.lat).y - 8}%`
              : `${lngLatToPercent(selectedPoint!.lng, selectedPoint!.lat).y - 8}%`,
            transform: "translate(-50%, -100%)",
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
            color: "var(--text-primary)",
            minWidth: "120px",
          }}
        >
          <div className="font-medium">
            {hoveredPoint ? hoveredPoint.store_name : selectedPoint!.store_name}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="font-mono">
              {hoveredPoint ? hoveredPoint.vehicle_count : selectedPoint!.vehicle_count} 台
            </span>
            <span
              style={{
                color: statusColor[
                  hoveredPoint ? hoveredPoint.turnover_status : selectedPoint!.turnover_status
                ],
              }}
            >
              {statusLabel[hoveredPoint ? hoveredPoint.turnover_status : selectedPoint!.turnover_status]}
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-4 rounded-lg px-3 py-1.5 text-xs" style={{ backgroundColor: "rgba(15, 18, 25, 0.85)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
        <StatusDot status="normal" label="正常" />
        <StatusDot status="warning" label="预警" />
        <StatusDot status="critical" label="异常" />
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-lg p-1" style={{ backgroundColor: "rgba(15, 18, 25, 0.85)", border: "1px solid var(--border-color)" }}>
        <button className="rounded p-1.5 transition hover:bg-brand-hover">
          <ZoomIn className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
        </button>
        <button className="rounded p-1.5 transition hover:bg-brand-hover">
          <ZoomOut className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>
    </div>
  )
}

function MapboxMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const popupsRef = useRef<mapboxgl.Popup[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const storeMapPoints = useAppStore((s) => s.storeMapPoints)
  const selectedStoreName = useAppStore((s) => s.selectedStoreName)
  const setSelectedStoreName = useAppStore((s) => s.setSelectedStoreName)

  useEffect(() => {
    if (!mapContainerRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [116.46, 39.92],
      zoom: 10.5,
      attributionControl: false,
    })

    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")

    map.on("load", () => {
      setMapLoaded(true)

      map.addSource("stores-geojson", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: storeMapPoints.map((p) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [p.lng, p.lat] },
            properties: {
              store_id: p.store_id,
              store_name: p.store_name,
              vehicle_count: p.vehicle_count,
              turnover_status: p.turnover_status,
            },
          })),
        },
      })

      map.addLayer({
        id: "stores-heat",
        type: "heatmap",
        source: "stores-geojson",
        paint: {
          "heatmap-weight": ["get", "vehicle_count"],
          "heatmap-intensity": 0.6,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(59, 130, 246, 0)",
            0.2,
            "rgba(59, 130, 246, 0.3)",
            0.5,
            "rgba(245, 158, 11, 0.5)",
            0.8,
            "rgba(239, 68, 68, 0.6)",
          ],
          "heatmap-radius": 60,
          "heatmap-opacity": 0.5,
        },
      })
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      popupsRef.current.forEach((p) => p.remove())
      markersRef.current = []
      popupsRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    markersRef.current.forEach((m) => m.remove())
    popupsRef.current.forEach((p) => p.remove())
    markersRef.current = []
    popupsRef.current = []

    storeMapPoints.forEach((point) => {
      const popup = new mapboxgl.Popup({
        offset: 12,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(
        `
          <div style="padding: 4px 2px; min-width: 140px;">
            <div style="font-weight: 600; font-size: 13px; color: #e8eaf0; margin-bottom: 4px;">
              ${point.store_name}
            </div>
            <div style="font-size: 12px; color: #8b92a8; margin-bottom: 2px;">
              在库车辆: <span style="font-family: 'JetBrains Mono', monospace; color: #e8eaf0;">${point.vehicle_count} 台</span>
            </div>
            <div style="font-size: 12px; color: #8b92a8;">
              周转状态: <span style="color: ${statusColor[point.turnover_status]}; font-weight: 500;">${statusLabel[point.turnover_status]}</span>
            </div>
          </div>
        `
      )

      popupsRef.current.push(popup)

      const el = document.createElement("div")
      const size = 20 + (point.vehicle_count / 200) * 16
      const color = statusColor[point.turnover_status]

      el.style.width = `${size}px`
      el.style.height = `${size}px`
      el.style.borderRadius = "50%"
      el.style.backgroundColor = color
      el.style.border = "2px solid rgba(255,255,255,0.3)"
      el.style.boxShadow = `0 0 12px ${color}80, 0 0 4px ${color}60`
      el.style.cursor = "pointer"
      el.style.transition = "transform 0.2s ease, box-shadow 0.2s ease"

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.25)"
        el.style.boxShadow = `0 0 20px ${color}a0, 0 0 8px ${color}80`
      })

      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)"
        el.style.boxShadow = `0 0 12px ${color}80, 0 0 4px ${color}60`
      })

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([point.lng, point.lat])
        .setPopup(popup)
        .addTo(map)

      el.addEventListener("click", (e) => {
        e.stopPropagation()
        setSelectedStoreName(point.store_name)
      })

      el.addEventListener("mouseenter", () => {
        marker.togglePopup()
      })

      el.addEventListener("mouseleave", () => {
        marker.togglePopup()
      })

      markersRef.current.push(marker)
    })
  }, [storeMapPoints, mapLoaded, setSelectedStoreName])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedStoreName) return

    const point = storeMapPoints.find((p) => p.store_name === selectedStoreName)
    if (point) {
      map.flyTo({
        center: [point.lng, point.lat],
        zoom: 12.5,
        speed: 1.2,
        curve: 1.4,
      })
    }
  }, [selectedStoreName, storeMapPoints])

  return (
    <div ref={mapContainerRef} className="h-full w-full" />
  )
}

export default function StoreMap() {
  const selectedStoreName = useAppStore((s) => s.selectedStoreName)
  const setSelectedStoreName = useAppStore((s) => s.setSelectedStoreName)

  return (
    <div className="card-base animate-fade-in relative h-[400px] w-full overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "rgba(15, 18, 25, 0.85)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
        <MapPin className="h-3.5 w-3.5" style={{ color: "var(--accent-amber)" }} />
        门店地理分布
      </div>

      {USE_MAPBOX ? <MapboxMap /> : <SimulatedMap />}

      {selectedStoreName && (
        <button
          onClick={() => setSelectedStoreName(null)}
          className="absolute top-3 right-3 z-10 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:bg-brand-hover"
          style={{ backgroundColor: "rgba(15, 18, 25, 0.85)", border: "1px solid var(--accent-amber)", color: "var(--accent-amber)" }}
        >
          重置视图
        </button>
      )}

      {USE_MAPBOX && (
        <style>{`
          .mapboxgl-popup-content {
            background: var(--bg-card) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 8px !important;
            padding: 8px 12px !important;
            color: var(--text-primary) !important;
            font-family: 'Noto Sans SC', sans-serif !important;
            font-size: 13px !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
          }
          .mapboxgl-popup-tip {
            border-top-color: var(--bg-card) !important;
          }
        `}</style>
      )}
    </div>
  )
}
