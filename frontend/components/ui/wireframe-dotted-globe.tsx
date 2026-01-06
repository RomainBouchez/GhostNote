"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

interface RotatingEarthProps {
    width?: number
    height?: number
    className?: string
}

export default function RotatingEarth({ className = "" }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return

        const canvas = canvasRef.current
        const container = containerRef.current
        const context = canvas.getContext("2d")
        if (!context) return

        let animationFrameId: number
        let projection: d3.GeoProjection
        let path: d3.GeoPath
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let landFeatures: any
        const allDots: { lng: number; lat: number }[] = []

        // Rotation state
        const rotation: [number, number] = [0, 0]
        let autoRotate = true
        const rotationSpeed = 0.5
        let timer: d3.Timer | null = null

        const initGlobe = () => {
            // Get actual container dimensions
            const { width, height } = container.getBoundingClientRect()

            // Make it square based on the smallest dimension to keep aspect ratio 1:1
            // OR use the full available space but maintain projection aspect ratio
            const size = Math.min(width, height)

            const dpr = window.devicePixelRatio || 1
            canvas.width = size * dpr
            canvas.height = size * dpr
            canvas.style.width = `${size}px`
            canvas.style.height = `${size}px`
            context.scale(dpr, dpr)

            const radius = size / 2.2 // Slightly smaller than full container

            projection = d3
                .geoOrthographic()
                .scale(radius)
                .translate([size / 2, size / 2])
                .clipAngle(90)

            path = d3.geoPath().projection(projection).context(context)
        }

        const render = () => {
            const width = canvas.width / (window.devicePixelRatio || 1)
            const height = canvas.height / (window.devicePixelRatio || 1)

            context.clearRect(0, 0, width, height)

            if (!projection) return

            const currentScale = projection.scale()
            // Recalculate radius based on current scale needed vs initial radius
            // But actually we just need relative scale for stroke width
            // Let's approximate base radius
            const baseRadius = width / 2.2
            const scaleFactor = currentScale / baseRadius

            // Draw ocean (globe background)
            context.beginPath()
            context.arc(width / 2, height / 2, currentScale, 0, 2 * Math.PI)
            context.fillStyle = "#ffffff"
            context.fill()
            context.strokeStyle = "#000000"
            context.lineWidth = 1 * scaleFactor // Thinner line
            context.stroke()

            if (landFeatures) {
                // Draw graticule
                const graticule = d3.geoGraticule()
                context.beginPath()
                path(graticule())
                context.strokeStyle = "#000000"
                context.lineWidth = 0.5 * scaleFactor
                context.globalAlpha = 0.1
                context.stroke()
                context.globalAlpha = 1

                // Draw land outlines
                context.beginPath()
                landFeatures.features.forEach((feature: any) => {
                    path(feature)
                })
                context.strokeStyle = "#000000"
                context.lineWidth = 0.8 * scaleFactor
                context.stroke()

                // Draw halftone dots
                allDots.forEach((dot) => {
                    const projected = projection([dot.lng, dot.lat])
                    if (projected) {
                        // Check visibility (clip angle handles mostly backend, but manual check ensures)
                        // d3 geoOrthographic clipAngle(90) should handle visibility, but let's trust d3
                        context.beginPath()
                        context.arc(projected[0], projected[1], 1 * scaleFactor, 0, 2 * Math.PI)
                        context.fillStyle = "#000000"
                        context.fill()
                    }
                })
            }
        }

        const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
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
        const pointInFeature = (point: [number, number], feature: any): boolean => {
            const geometry = feature.geometry
            if (geometry.type === "Polygon") {
                const coordinates = geometry.coordinates
                if (!pointInPolygon(point, coordinates[0])) return false
                for (let i = 1; i < coordinates.length; i++) {
                    if (pointInPolygon(point, coordinates[i])) return false
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
        const generateDotsInPolygon = (feature: any, dotSpacing = 12) => {
            const stepSize = dotSpacing * 0.15 // Sparse dots
            const bounds = d3.geoBounds(feature)
            const [[minLng, minLat], [maxLng, maxLat]] = bounds

            for (let lng = minLng; lng <= maxLng; lng += stepSize) {
                for (let lat = minLat; lat <= maxLat; lat += stepSize) {
                    const point: [number, number] = [lng, lat]
                    if (pointInFeature(point, feature)) {
                        allDots.push({ lng, lat })
                    }
                }
            }
        }

        const loadWorldData = async () => {
            try {
                const response = await fetch(
                    "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json",
                )
                if (!response.ok) throw new Error("Failed to load land data")

                landFeatures = await response.json()

                // Generate dots
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                landFeatures.features.forEach((feature: any) => {
                    generateDotsInPolygon(feature, 16)
                })

                render()
            } catch (err) {
                setError("Failed to load land map data")
            }
        }

        const rotate = () => {
            if (autoRotate && projection) {
                rotation[0] += rotationSpeed;
                (projection as any).rotate(rotation)
                render()
                timer = d3.timeout(rotate, 20) // Use d3 timeout/interval loop
            }
        }

        const startRotation = () => {
            if (timer) timer.stop()
            rotate()
        }

        // Initial setup
        initGlobe()
        loadWorldData().then(() => {
            startRotation()
        })

        // Resize observer
        const resizeObserver = new ResizeObserver(() => {
            initGlobe()
            render()
        })
        resizeObserver.observe(container)


        // Interaction
        const handleMouseDown = (event: MouseEvent) => {
            autoRotate = false
            if (timer) timer.stop()

            const startX = event.clientX
            const startY = event.clientY
            const initialRotation = [...rotation]

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const sensitivity = 0.5
                const dx = moveEvent.clientX - startX
                const dy = moveEvent.clientY - startY

                rotation[0] = initialRotation[0] + dx * sensitivity
                rotation[1] = initialRotation[1] - dy * sensitivity
                rotation[1] = Math.max(-90, Math.min(90, rotation[1]))

                if (projection) {
                    (projection as any).rotate(rotation as [number, number])
                    render()
                }
            }

            const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
                setTimeout(() => {
                    autoRotate = true
                    startRotation()
                }, 100)
            }

            document.addEventListener("mousemove", handleMouseMove)
            document.addEventListener("mouseup", handleMouseUp)
        }

        // Touch support for mobile
        const handleTouchStart = (event: TouchEvent) => {
            autoRotate = false
            if (timer) timer.stop()

            const touch = event.touches[0]
            const startX = touch.clientX
            const startY = touch.clientY
            const initialRotation = [...rotation]

            const handleTouchMove = (moveEvent: TouchEvent) => {
                const moveTouch = moveEvent.touches[0]
                const sensitivity = 0.5
                const dx = moveTouch.clientX - startX
                const dy = moveTouch.clientY - startY

                rotation[0] = initialRotation[0] + dx * sensitivity
                rotation[1] = initialRotation[1] - dy * sensitivity
                rotation[1] = Math.max(-90, Math.min(90, rotation[1]))

                if (projection) {
                    (projection as any).rotate(rotation as [number, number])
                    render()
                }
            }

            const handleTouchEnd = () => {
                document.removeEventListener("touchmove", handleTouchMove)
                document.removeEventListener("touchend", handleTouchEnd)
                setTimeout(() => {
                    autoRotate = true
                    startRotation()
                }, 100)
            }

            document.addEventListener("touchmove", handleTouchMove)
            document.addEventListener("touchend", handleTouchEnd)
        }


        canvas.addEventListener("mousedown", handleMouseDown)
        canvas.addEventListener("touchstart", handleTouchStart)

        return () => {
            if (timer) timer.stop()
            resizeObserver.disconnect()
            canvas.removeEventListener("mousedown", handleMouseDown)
            canvas.removeEventListener("touchstart", handleTouchStart)
        }
    }, [])

    if (error) {
        return <div className="text-red-500 text-xs p-4">{error}</div>
    }

    return (
        <div
            ref={containerRef}
            className={`w-full h-full flex items-center justify-center ${className}`}
            style={{
                minHeight: '300px',
                aspectRatio: '1/1' // Important to force aspect ratio
            }}
        >
            <canvas ref={canvasRef} />
        </div>
    )
}
