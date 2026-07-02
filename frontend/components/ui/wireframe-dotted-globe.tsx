"use client"

import { useEffect, useRef, useState } from "react"
import type { MotionValue } from "framer-motion"
import * as d3 from "d3"

type Coord = [number, number]

interface RotatingEarthProps {
    className?: string
    /** Scroll progress 0..1 that drives the camera (fly A -> B) and the zoom. */
    progress?: MotionValue<number>
    /** When true, the globe is a scroll-driven camera instead of a free auto-rotating globe. */
    focusMode?: boolean
    /** Journey origin [lng, lat] — where the note is encrypted. */
    sender?: Coord
    /** Journey destination [lng, lat] — where the note is read & destroyed. */
    recipient?: Coord
    /** Fires once the land data has loaded and the first real frame has drawn. */
    onReady?: () => void
}

const smoothstep = (edge0: number, edge1: number, x: number) => {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export default function RotatingEarth({
    className = "",
    progress,
    focusMode = false,
    sender = [2.3522, 48.8566], // Paris
    recipient = [-74.006, 40.7128], // New York
    onReady,
}: RotatingEarthProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [error, setError] = useState<string | null>(null)

    // Keep the latest scroll value without forcing React re-renders on every frame.
    const progressRef = useRef(0)

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return

        const canvas = canvasRef.current
        const container = containerRef.current
        const context = canvas.getContext("2d")
        if (!context) return

        const prefersReduced =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        let projection: d3.GeoProjection
        let path: d3.GeoPath
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let landFeatures: any = null
        const allDots: Coord[] = []

        let vw = 0
        let vh = 0
        let baseRadius = 0
        let frameCount = 0
        let rafId = 0
        let ready = false

        // Legacy (non-focus) auto-rotate state
        const rotation: [number, number] = [0, 0]
        let autoRotate = true
        let idleAngle = 0

        const interp = d3.geoInterpolate(sender, recipient)

        const initGlobe = () => {
            // Use the FULL container surface (not a square): while zooming the
            // sphere grows past the base radius, and a square canvas would clip
            // it at its edges (sides on desktop, top/bottom on mobile).
            const rect = container.getBoundingClientRect()
            vw = rect.width
            vh = rect.height

            const dpr = window.devicePixelRatio || 1
            canvas.width = vw * dpr
            canvas.height = vh * dpr
            canvas.style.width = `${vw}px`
            canvas.style.height = `${vh}px`
            context.setTransform(dpr, 0, 0, dpr, 0, 0)

            baseRadius = Math.min(vw, vh) / 2.2

            projection = d3
                .geoOrthographic()
                .scale(baseRadius)
                .translate([vw / 2, vh / 2])
                .clipAngle(90)

            path = d3.geoPath().projection(projection).context(context)
        }

        const drawSphere = (strokeScale: number, alpha: number) => {
            const scale = projection.scale()
            context.globalAlpha = alpha
            context.beginPath()
            context.arc(vw / 2, vh / 2, scale, 0, 2 * Math.PI)
            context.fillStyle = "#ffffff"
            context.fill()
            context.strokeStyle = "#000000"
            context.lineWidth = 1 * strokeScale
            context.stroke()
            context.globalAlpha = 1
        }

        const drawLand = (strokeScale: number, alpha: number) => {
            if (!landFeatures) return

            // Graticule
            const graticule = d3.geoGraticule()
            context.beginPath()
            path(graticule())
            context.strokeStyle = "#000000"
            context.lineWidth = 0.5 * strokeScale
            context.globalAlpha = 0.08 * alpha
            context.stroke()
            context.globalAlpha = 1

            // Land outlines
            context.beginPath()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            landFeatures.features.forEach((feature: any) => path(feature))
            context.strokeStyle = "#000000"
            context.lineWidth = 0.8 * strokeScale
            context.globalAlpha = alpha
            context.stroke()

            // Halftone dots
            const dotR = Math.max(0.6, 1 * strokeScale)
            context.fillStyle = "#000000"
            allDots.forEach((dot) => {
                const projected = projection(dot)
                if (projected) {
                    context.beginPath()
                    context.arc(projected[0], projected[1], dotR, 0, 2 * Math.PI)
                    context.fill()
                }
            })
            context.globalAlpha = 1
        }

        // Draw a great-circle segment between two coords (t0..t1 of the interpolator).
        const drawArcSegment = (
            t0: number,
            t1: number,
            color: string,
            width: number,
            alpha: number,
        ) => {
            if (t1 <= t0) return
            const steps = 64
            const coordinates: Coord[] = []
            for (let i = 0; i <= steps; i++) {
                const t = t0 + ((t1 - t0) * i) / steps
                coordinates.push(interp(t) as Coord)
            }
            context.beginPath()
            path({ type: "LineString", coordinates })
            context.strokeStyle = color
            context.lineWidth = width
            context.globalAlpha = alpha
            context.stroke()
            context.globalAlpha = 1
        }

        const drawNode = (
            coord: Coord,
            center: Coord,
            radius: number,
            color: string,
            pulse: number,
        ) => {
            // Only draw when on the visible hemisphere.
            if (d3.geoDistance(coord, center) > Math.PI / 2) return
            const p = projection(coord)
            if (!p) return
            context.beginPath()
            context.arc(p[0], p[1], radius, 0, 2 * Math.PI)
            context.fillStyle = color
            context.fill()
            if (pulse > 0) {
                context.beginPath()
                context.arc(p[0], p[1], radius + pulse * 10, 0, 2 * Math.PI)
                context.strokeStyle = color
                context.globalAlpha = Math.max(0, 1 - pulse)
                context.lineWidth = 1.5
                context.stroke()
                context.globalAlpha = 1
            }
        }

        // The travelling encrypted packet, always tracked at screen center.
        const drawPacket = (destructing: boolean) => {
            const cx = vw / 2
            const cy = vh / 2
            const pulse = (Math.sin(frameCount * 0.08) + 1) / 2 // 0..1
            const color = destructing ? "#ef4444" : "#000000"

            // Halo
            context.beginPath()
            context.arc(cx, cy, 10 + pulse * 6, 0, 2 * Math.PI)
            context.strokeStyle = color
            context.globalAlpha = 0.25 + pulse * 0.25
            context.lineWidth = 1.5
            context.stroke()
            context.globalAlpha = 1

            // Core dot
            context.beginPath()
            context.arc(cx, cy, 5, 0, 2 * Math.PI)
            context.fillStyle = color
            context.fill()

            // Tiny lock notch (a small white bite) to read as "secured"
            context.beginPath()
            context.arc(cx, cy - 1.5, 2, 0, 2 * Math.PI)
            context.fillStyle = "#ffffff"
            context.fill()
        }

        const clear = () => {
            context.clearRect(0, 0, vw, vh)
        }

        // ---- Focus (scroll-driven camera) frame ----
        const focusFrame = () => {
            if (!projection) return
            frameCount++
            const p = prefersReduced ? progressRef.current : progressRef.current

            clear()

            // Camera travels A -> B along the great circle.
            const camT = smoothstep(0.25, 0.85, p)
            const center = interp(camT) as Coord

            // Blend from an idle-facing view into the locked camera at the very start.
            const focusBlend = smoothstep(0, 0.12, p)
            if (!prefersReduced) idleAngle += 0.12
            const lng = lerp(idleAngle, -center[0], focusBlend)
            const lat = lerp(-12, -center[1], focusBlend)
            projection.rotate([lng, lat, 0])

            // Zoom: ease in onto A, hold through travel, settle onto B.
            const zoomIn = smoothstep(0.1, 0.28, p)
            const settle = smoothstep(0.82, 0.96, p)
            const zoom = 1 + zoomIn * 1.5 + settle * 0.4
            projection.scale(baseRadius * zoom)

            const strokeScale = Math.min(1.6, Math.sqrt(zoom))
            const globeAlpha = 1 - smoothstep(0.9, 1, p) * 0.25

            drawSphere(strokeScale, globeAlpha)
            drawLand(strokeScale, globeAlpha)

            // The journey path (only once we've begun to travel).
            const arcVisible = smoothstep(0.18, 0.3, p)
            if (arcVisible > 0 && landFeatures) {
                drawArcSegment(0, 1, "#000000", 1, 0.12 * arcVisible) // faint full path
                drawArcSegment(0, camT, "#000000", 1.5, 0.9 * arcVisible) // travelled, bright

                const destructing = p > 0.9
                // Origin node (sender)
                drawNode(sender, center, 4, "#000000", 0)
                // Destination node (recipient) — pulses red as the note is destroyed
                drawNode(
                    recipient,
                    center,
                    4,
                    destructing ? "#ef4444" : "#000000",
                    destructing ? (Math.sin(frameCount * 0.1) + 1) / 2 : 0,
                )

                if (p > 0.22) drawPacket(destructing)
            }

            if (!ready && landFeatures) {
                ready = true
                onReady?.()
            }
        }

        // ---- Loading placeholder (pulsing wireframe ring) ----
        const drawPlaceholder = () => {
            frameCount++
            clear()
            const pulse = (Math.sin(frameCount * 0.05) + 1) / 2
            context.beginPath()
            context.arc(vw / 2, vh / 2, baseRadius, 0, 2 * Math.PI)
            context.strokeStyle = "#000000"
            context.globalAlpha = 0.15 + pulse * 0.2
            context.lineWidth = 1
            context.stroke()
            context.globalAlpha = 1
        }

        // ---- Legacy free-spinning globe (non-focus usages) ----
        const legacyRender = () => {
            if (!projection) return
            clear()
            const strokeScale = 1
            drawSphere(strokeScale, 1)
            drawLand(strokeScale, 1)
            if (!ready && landFeatures) {
                ready = true
                onReady?.()
            }
        }

        // ---- Animation loops ----
        const focusLoop = () => {
            if (landFeatures || !focusMode) {
                landFeatures ? focusFrame() : drawPlaceholder()
            } else {
                drawPlaceholder()
            }
            rafId = requestAnimationFrame(focusLoop)
        }

        let legacyTimer: d3.Timer | null = null
        const legacyRotate = () => {
            if (autoRotate && projection) {
                rotation[0] += 0.5
                ;(projection as d3.GeoProjection).rotate(rotation)
                legacyRender()
                legacyTimer = d3.timeout(legacyRotate, 20)
            }
        }

        // ---- Point-in-polygon dot generation (land only) ----
        const pointInPolygon = (point: Coord, polygon: number[][]): boolean => {
            const [x, y] = point
            let inside = false
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const [xi, yi] = polygon[i]
                const [xj, yj] = polygon[j]
                if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                    inside = !inside
                }
            }
            return inside
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pointInFeature = (point: Coord, feature: any): boolean => {
            const geometry = feature.geometry
            if (geometry.type === "Polygon") {
                const c = geometry.coordinates
                if (!pointInPolygon(point, c[0])) return false
                for (let i = 1; i < c.length; i++) {
                    if (pointInPolygon(point, c[i])) return false
                }
                return true
            } else if (geometry.type === "MultiPolygon") {
                for (const polygon of geometry.coordinates) {
                    if (pointInPolygon(point, polygon[0])) {
                        let inHole = false
                        for (let i = 1; i < polygon.length; i++) {
                            if (pointInPolygon(point, polygon[i])) {
                                inHole = true
                                break
                            }
                        }
                        if (!inHole) return true
                    }
                }
                return false
            }
            return false
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const generateDotsInPolygon = (feature: any, dotSpacing = 16) => {
            const stepSize = dotSpacing * 0.15
            const bounds = d3.geoBounds(feature)
            const [[minLng, minLat], [maxLng, maxLat]] = bounds
            for (let lng = minLng; lng <= maxLng; lng += stepSize) {
                for (let lat = minLat; lat <= maxLat; lat += stepSize) {
                    const point: Coord = [lng, lat]
                    if (pointInFeature(point, feature)) allDots.push(point)
                }
            }
        }

        const loadWorldData = async () => {
            try {
                let response = await fetch("/geo/ne_110m_land.json")
                if (!response.ok) {
                    // Fallback to the upstream source if the local copy is missing.
                    response = await fetch(
                        "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json",
                    )
                }
                if (!response.ok) throw new Error("Failed to load land data")
                landFeatures = await response.json()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                landFeatures.features.forEach((feature: any) => generateDotsInPolygon(feature, 16))
            } catch {
                setError("Failed to load land map data")
            }
        }

        // ---- Setup ----
        initGlobe()

        // Seed the scroll value immediately so the first frame is correct.
        if (progress) progressRef.current = progress.get()
        const unsubscribe = progress
            ? progress.on("change", (v) => {
                  progressRef.current = v
              })
            : undefined

        const resizeObserver = new ResizeObserver(() => {
            initGlobe()
            if (!focusMode) legacyRender()
        })
        resizeObserver.observe(container)

        if (focusMode) {
            focusLoop()
            loadWorldData()
        } else {
            loadWorldData().then(() => {
                legacyRender()
                legacyRotate()
            })
        }

        // ---- Drag interaction (legacy free globe only) ----
        const handleMouseDown = (event: MouseEvent) => {
            autoRotate = false
            if (legacyTimer) legacyTimer.stop()
            const startX = event.clientX
            const startY = event.clientY
            const initial = [...rotation]
            const move = (e: MouseEvent) => {
                const s = 0.5
                rotation[0] = initial[0] + (e.clientX - startX) * s
                rotation[1] = Math.max(-90, Math.min(90, initial[1] - (e.clientY - startY) * s))
                ;(projection as d3.GeoProjection).rotate(rotation)
                legacyRender()
            }
            const up = () => {
                document.removeEventListener("mousemove", move)
                document.removeEventListener("mouseup", up)
                setTimeout(() => {
                    autoRotate = true
                    legacyRotate()
                }, 100)
            }
            document.addEventListener("mousemove", move)
            document.addEventListener("mouseup", up)
        }

        if (!focusMode) canvas.addEventListener("mousedown", handleMouseDown)

        return () => {
            if (rafId) cancelAnimationFrame(rafId)
            if (legacyTimer) legacyTimer.stop()
            unsubscribe?.()
            resizeObserver.disconnect()
            canvas.removeEventListener("mousedown", handleMouseDown)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusMode])

    if (error) {
        return <div className="text-red-500 text-xs p-4">{error}</div>
    }

    return (
        <div
            ref={containerRef}
            className={`w-full h-full flex items-center justify-center ${className}`}
            style={
                // In focus mode the canvas must cover the whole viewport so the
                // zoomed sphere is never clipped; the legacy globe stays square.
                focusMode
                    ? { minHeight: "300px" }
                    : { minHeight: "300px", aspectRatio: "1/1" }
            }
        >
            <canvas ref={canvasRef} />
        </div>
    )
}
