import { useEffect, useRef, useState } from 'react'
import { createParticles, renderFrame } from './particleSphereCore'

// Particles are generated once and shared by every instance
let shared = null
const getParticles = () => (shared ??= createParticles())

const FRAME_MS = 33 // about 30 frames per second is plenty for a small icon

/**
 * Animated particle sphere drawn on a 2D canvas (no extra libraries).
 * It fills its parent, so the parent decides the size.
 *   busy:     KAI is thinking -> more shimmer and drift, slightly brighter
 *   pulseKey: change this number to give a brief brightness pulse (chat opened)
 */
export default function ParticleSphere({ busy = false, pulseKey = 0 }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const energyTarget = useRef(0)
  const pulseRef = useRef(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    energyTarget.current = busy ? 1 : 0
  }, [busy])

  useEffect(() => {
    if (pulseKey) pulseRef.current = 1
  }, [pulseKey])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) {
      setFailed(true)
      return
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const P = getParticles()

    let size = 0
    let active = 0
    let accum = null
    let image = null
    let raf = 0
    let last = 0
    let yaw = 0.8
    let wt = 3
    let energy = 0

    const draw = () => {
      renderFrame(P, active, size, yaw, wt, energy, pulseRef.current, accum, image.data)
      ctx.putImageData(image, 0, 0)
    }

    // Match the canvas to its on-screen size (and screen sharpness, capped at 2x)
    const setup = () => {
      const css = wrap.clientWidth || 72
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size = Math.max(48, Math.round(css * dpr))
      canvas.width = size
      canvas.height = size
      accum = new Float32Array(size * size * 3)
      image = ctx.createImageData(size, size)
      active = Math.min(P.count, css >= 66 ? 3400 : 2400) // fewer particles on small screens
      draw()
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (now - last < FRAME_MS) return
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      energy += (energyTarget.current - energy) * Math.min(1, dt * 3)
      pulseRef.current = Math.max(0, pulseRef.current - dt * 1.6)
      yaw += dt * (0.17 + 0.1 * energy) // slow rotation
      wt += dt * (1 + 0.8 * energy)
      draw()
    }

    const start = () => {
      if (raf || document.hidden || reduce.matches) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const onVisibility = () => (document.hidden ? stop() : start())
    const onMotion = () => {
      if (reduce.matches) {
        stop()
        draw()
      } else {
        start()
      }
    }

    setup()
    start()

    const ro = new ResizeObserver(setup)
    ro.observe(wrap)
    document.addEventListener('visibilitychange', onVisibility)
    reduce.addEventListener('change', onMotion)

    return () => {
      stop()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      reduce.removeEventListener('change', onMotion)
    }
  }, [])

  // No canvas support: a simple gradient ball in the same colours
  if (failed) return <span aria-hidden="true" className="kai-pfallback block h-full w-full" />

  return (
    <span ref={wrapRef} aria-hidden="true" className="relative block h-full w-full">
      <canvas ref={canvasRef} className="kai-pcanvas block h-full w-full" />
    </span>
  )
}