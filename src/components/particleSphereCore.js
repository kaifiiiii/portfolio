// Pure rendering core for the particle sphere (no React, no DOM), so it is easy to test.
// Particles live on a unit sphere, are drawn with an orthographic projection and
// accumulated additively into a small buffer that the component puts on a canvas.

const TAU = Math.PI * 2

function mulberry32(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Colour by screen height: magenta and violet at the bottom, blue, then cyan at the top
const STOPS = [
  [0.0, [238, 122, 255]],
  [0.18, [192, 106, 255]],
  [0.34, [122, 100, 255]],
  [0.52, [58, 140, 255]],
  [0.75, [68, 186, 255]],
  [1.0, [112, 226, 255]],
]
const LUT_SIZE = 64
const LUT = new Float32Array(LUT_SIZE * 3)
for (let i = 0; i < LUT_SIZE; i++) {
  const u = i / (LUT_SIZE - 1)
  let k = 0
  while (k < STOPS.length - 2 && u > STOPS[k + 1][0]) k++
  const [u0, c0] = STOPS[k]
  const [u1, c1] = STOPS[k + 1]
  const f = Math.min(1, Math.max(0, (u - u0) / (u1 - u0)))
  for (let c = 0; c < 3; c++) LUT[i * 3 + c] = c0[c] + (c1[c] - c0[c]) * f
}

// Thin flowing ribbons on the sphere surface (0 to 1). Particles are gathered along them.
function ribbons(x, y, z) {
  const v1 = 2.6 * x + 1.7 * Math.sin(1.9 * y + 0.7 * z) + 1.3 * Math.sin(2.4 * z - 1.5 * x)
  const v2 = 2.1 * y + 1.5 * Math.sin(2.2 * z + 0.9 * x) + 1.1 * Math.sin(1.7 * x - 1.3 * y + 1.0)
  const a = Math.pow(1 - Math.abs(Math.sin(v1)), 4)
  const b = Math.pow(1 - Math.abs(Math.sin(v2)), 4)
  return Math.max(a, b * 0.85)
}

export const MAX_PARTICLES = 3600

export function createParticles(count = MAX_PARTICLES, seed = 7) {
  const rand = mulberry32(seed)
  const px = new Float32Array(count)
  const py = new Float32Array(count)
  const pz = new Float32Array(count)
  const ph = new Float32Array(count) // random phase per particle
  const sz = new Float32Array(count) // size / weight
  const br = new Float32Array(count) // base brightness
  const mob = new Float32Array(count) // how much it drifts
  const rr = new Float32Array(count) // tiny radius jitter (shell thickness)

  for (let i = 0; i < count; i++) {
    const clustered = rand() < 0.55
    let x = 0
    let y = 0
    let z = 0
    for (let tries = 0; tries < 70; tries++) {
      z = rand() * 2 - 1
      const a = rand() * TAU
      const r = Math.sqrt(1 - z * z)
      x = r * Math.cos(a)
      y = r * Math.sin(a)
      if (!clustered || rand() < ribbons(x, y, z) * 1.1) break
    }
    px[i] = x
    py[i] = y
    pz[i] = z
    ph[i] = rand()
    const d = rand()
    br[i] = (0.3 + 0.7 * d * d) * (clustered ? 1.6 : 0.85)
    sz[i] = 0.75 + rand() * 0.7
    mob[i] = clustered ? 2.2 : 1
    rr[i] = 1 + (rand() - 0.5) * 0.03
  }
  return { count, px, py, pz, ph, sz, br, mob, rr }
}

const TILT = 0.42
const COS_X = Math.cos(TILT)
const SIN_X = Math.sin(TILT)

/**
 * Draws one frame.
 * size:   width and height of the square buffer in pixels
 * yaw:    rotation angle around the vertical axis (radians)
 * wt:     wave time, a slowly growing number
 * energy: 0 idle .. 1 thinking (more shimmer and drift)
 * pulse:  0..1 brief brightness bump
 * accum:  Float32Array(size * size * 3), out: Uint8ClampedArray(size * size * 4)
 */
export function renderFrame(P, active, size, yaw, wt, energy, pulse, accum, out) {
  accum.fill(0)
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.43
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const gain = (1 + 0.15 * pulse + 0.22 * energy) * (size / 168)
  const drift = 0.016 + 0.02 * energy
  const shimmerAmp = 0.18 * (1 + 1.4 * energy)
  const shimmerRate = 2 + 1.6 * energy

  for (let i = 0; i < active; i++) {
    const ph = P.ph[i]
    const m = P.mob[i] * drift
    let x = P.px[i] + m * Math.sin(wt * 0.55 + ph * TAU)
    let y = P.py[i] + m * Math.sin(wt * 0.47 + ph * 7.1)
    let z = P.pz[i] + m * Math.sin(wt * 0.61 + ph * 3.7)
    const inv = P.rr[i] / Math.sqrt(x * x + y * y + z * z)
    x *= inv
    y *= inv
    z *= inv

    // slow brightness bands that travel over the surface
    const wave = 0.5 + 0.5 * Math.sin(3.1 * x + 2 * Math.sin(1.7 * y + wt * 0.45) + wt * 0.35 + 1.3 * z)

    // rotate: yaw around Y, then a fixed tilt around X
    const x1 = x * cosY + z * sinY
    const z1 = -x * sinY + z * cosY
    const y2 = y * COS_X - z1 * SIN_X
    const z2 = y * SIN_X + z1 * COS_X

    const rim = 1 - Math.abs(z2)
    const edge = rim * rim
    const u = Math.min(1, Math.max(0, (y2 + 1) / 2))
    const li = ((u * (LUT_SIZE - 1)) | 0) * 3

    const shimmer = 1 - shimmerAmp + shimmerAmp * 2 * (0.5 + 0.5 * Math.sin(wt * shimmerRate + ph * TAU * 3))
    let a = P.br[i] * (0.5 + 0.75 * wave) * (0.62 + 1.25 * edge * rim) * shimmer
    if (z2 < 0) a *= 0.5
    a *= P.sz[i] * gain * 330

    // a little white at the lit bottom rim, like the reference
    const wmix = u < 0.3 ? ((0.3 - u) / 0.3) * edge * 0.45 : 0
    const r = LUT[li] + (255 - LUT[li]) * wmix
    const g = LUT[li + 1] + (235 - LUT[li + 1]) * wmix
    const b = LUT[li + 2] + (255 - LUT[li + 2]) * wmix

    // soft point: spread over the 4 nearest pixels
    const sx = cx + x1 * R - 0.5
    const sy = cy - y2 * R - 0.5
    const fx = Math.floor(sx)
    const fy = Math.floor(sy)
    const dx = sx - fx
    const dy = sy - fy
    if (fx < 0 || fy < 0 || fx >= size - 1 || fy >= size - 1) continue
    const w00 = (1 - dx) * (1 - dy) * a / 255
    const w10 = dx * (1 - dy) * a / 255
    const w01 = (1 - dx) * dy * a / 255
    const w11 = dx * dy * a / 255
    let o = (fy * size + fx) * 3
    accum[o] += r * w00
    accum[o + 1] += g * w00
    accum[o + 2] += b * w00
    accum[o + 3] += r * w10
    accum[o + 4] += g * w10
    accum[o + 5] += b * w10
    o += size * 3
    accum[o] += r * w01
    accum[o + 1] += g * w01
    accum[o + 2] += b * w01
    accum[o + 3] += r * w11
    accum[o + 4] += g * w11
    accum[o + 5] += b * w11
  }

  // accumulated light -> RGBA (colour keeps its hue, brightness becomes alpha)
  const n = size * size
  for (let p = 0; p < n; p++) {
    const r = accum[p * 3]
    const g = accum[p * 3 + 1]
    const b = accum[p * 3 + 2]
    const mx = r > g ? (r > b ? r : b) : g > b ? g : b
    const o = p * 4
    if (mx < 1) {
      out[o + 3] = 0
      continue
    }
    const k = 255 / mx
    out[o] = r * k
    out[o + 1] = g * k
    out[o + 2] = b * k
    out[o + 3] = mx > 255 ? 255 : mx
  }
}