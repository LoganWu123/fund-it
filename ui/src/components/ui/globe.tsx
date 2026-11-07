import { useEffect, useRef, useState } from "react"
import createGlobe, { type COBEOptions } from "cobe"
import { useMotionValue, useSpring } from "motion/react"

import { cn } from "@/lib/utils"

const MOVEMENT_DAMPING = 1400

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [251 / 255, 100 / 255, 21 / 255],
  glowColor: [1, 1, 1],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [23.8103, 90.4125], size: 0.05 },
    { location: [30.0444, 31.2357], size: 0.07 },
    { location: [39.9042, 116.4074], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.1 },
    { location: [19.4326, -99.1332], size: 0.1 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [41.0082, 28.9784], size: 0.06 },
  ],
}

export function Globe({
  className,
  config = GLOBE_CONFIG,
  paused = false,
}: {
  className?: string
  config?: COBEOptions
  paused?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phiRef = useRef(config.phi)
  const pausedRef = useRef(paused)
  const [reduced, setReduced] = useState(false)
  useEffect(() => { pausedRef.current = paused || reduced }, [paused, reduced])
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(media.matches)
    update(); media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  const widthRef = useRef(0)
  const pointerInteracting = useRef<number | null>(null)

  const r = useMotionValue(0)
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  })

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteracting.current = clientX
      r.set(r.get() + delta / MOVEMENT_DAMPING)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pixelRatio = config.devicePixelRatio || 1
    widthRef.current = canvas.getBoundingClientRect().width

    const globe = createGlobe(canvas, {
      ...config,
      width: Math.round(widthRef.current * pixelRatio),
      height: Math.round(widthRef.current * pixelRatio),
      onRender: (state) => {
        if (pointerInteracting.current === null && !pausedRef.current) phiRef.current += 0.002
        state.phi = phiRef.current + rs.get()
        // Use the actual drawing buffer, including its pixel ratio and rounding.
        state.width = canvas.width
        state.height = canvas.height
      },
    })

    const resize = () => {
      widthRef.current = canvas.getBoundingClientRect().width
      globe.resize()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const revealTimer = setTimeout(() => { if(canvasRef.current) canvasRef.current.style.opacity = "1" }, 0)
    return () => {
      clearTimeout(revealTimer)
      observer.disconnect()
      globe.destroy()
    }
  }, [rs, config])

  return (
    <div
      className={cn(
        "fundit-globe-canvas",
        className
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 contain-[layout_paint_size]"
        )}
        aria-label="Rotating globe with an Orange County marker"
        role="img"
        ref={canvasRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          updatePointerInteraction(e.clientX)
        }}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerCancel={() => updatePointerInteraction(null)}
        onLostPointerCapture={() => updatePointerInteraction(null)}
        onPointerMove={(e) => updateMovement(e.clientX)}
      />
    </div>
  )
}
