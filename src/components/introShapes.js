// Target positions for every particle in each stage of the intro.
// Pure maths (no Three.js, no DOM). The GPU blends between these targets.
// World units: the camera sits at z = 5, where the screen is about 4.7 units tall.

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

// Bell-shaped random number between -1 and 1
const gauss = (r) => (r() + r() + r() - 1.5) / 1.5

// Ring colour by angle (degrees, 0 = right, 90 = top): red-pink on the right and top,
// violet to blue on the left and bottom, like the reference
const RING_STOPS = [
  [0, [1.0, 0.34, 0.5]],
  [45, [1.0, 0.36, 0.36]],
  [90, [1.0, 0.42, 0.46]],
  [135, [0.66, 0.38, 1.0]],
  [180, [0.4, 0.42, 1.0]],
  [225, [0.28, 0.44, 1.0]],
  [270, [0.46, 0.4, 1.0]],
  [315, [0.82, 0.36, 0.95]],
  [360, [1.0, 0.34, 0.5]],
]
function ringColor(deg) {
  let k = 0
  while (k < RING_STOPS.length - 2 && deg > RING_STOPS[k + 1][0]) k++
  const [d0, c0] = RING_STOPS[k]
  const [d1, c1] = RING_STOPS[k + 1]
  const f = Math.min(1, Math.max(0, (deg - d0) / (d1 - d0)))
  const s = f * f * (3 - 2 * f)
  return [c0[0] + (c1[0] - c0[0]) * s, c0[1] + (c1[1] - c0[1]) * s, c0[2] + (c1[2] - c0[2]) * s]
}

// Helix: one full turn over its height, so there are about two crossings on screen.
// The shader needs K to keep the bright knots on the crossings as the helix turns.
export const HELIX = { half: 2.5, turns: 1.0 }
HELIX.K = (TAU * HELIX.turns) / (HELIX.half * 2)

export const SHAPE = {
  ringR: 2.95,
  funnelHalf: 2.9,
  helixR: 0.78,
  helixHalf: 2.5,
  landY: -2.1,
}

export function createShapes(count, seed = 11) {
  const r = mulberry32(seed)
  const aSeed = new Float32Array(count)
  const ring = new Float32Array(count * 3)
  const fun = new Float32Array(count * 3) // x = angle, y = height (the shader builds the shape)
  const helix = new Float32Array(count * 3)
  const land = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const colH = new Float32Array(count * 3)

  // Ring: one thin band made of many fine fibres that weave around each other
  const R = SHAPE.ringR
  const FIBRES = 22
  const fibres = Array.from({ length: FIBRES }, (_, k) => ({
    off: (k / (FIBRES - 1) - 0.5) * 0.11,
    f: 9 + Math.floor(r() * 16),
    amp: 0.012 + 0.02 * r(),
    ph: r() * TAU,
    z: gauss(r) * 0.06,
  }))
  const baseWave = r() * TAU

  // Funnel: a sparse lattice of dots
  const ROWS = 62
  const COLS = 200
  const FH = SHAPE.funnelHalf

  // Helix: thick granular strands, a soft fuzz around them, dotted rungs and bright knots
  const Rh = SHAPE.helixR
  const HH = HELIX.half
  const K = HELIX.K
  const RUNGS = 22 // bands about 0.22 units apart, like the photo

  // Landscape: a mesh of dotted rows and columns; the far edge is the bright crest line
  const LROWS = 24
  const landX = (z) => 5.0 - z // half-width that is on screen at that depth

  for (let i = 0; i < count; i++) {
    const s = r()
    aSeed[i] = s
    const i3 = i * 3

    // ---- ring ----
    const th = r() * TAU
    let rad
    let z
    if (r() < 0.94) {
      const fb = fibres[(r() * FIBRES) | 0]
      // a shared slow wave moves all fibres together, each fibre adds its own fine ripple
      const shared = 0.03 * Math.sin(5 * th + baseWave) + 0.015 * Math.sin(11 * th + 1.7)
      rad = R * (1 + fb.off + shared + fb.amp * Math.sin(fb.f * th + fb.ph)) + gauss(r) * 0.003 * R
      z = fb.z + 0.05 * Math.sin(3 * th + fb.ph) + gauss(r) * 0.01
    } else {
      rad = R * (1 + gauss(r) * 0.06)
      z = gauss(r) * 0.15
    }
    ring[i3] = rad * Math.cos(th)
    ring[i3 + 1] = rad * Math.sin(th)
    ring[i3 + 2] = z
    const c = ringColor(((th * 180) / Math.PI) % 360)
    const k = 0.75 + 0.45 * r()
    col[i3] = c[0] * k
    col[i3 + 1] = c[1] * k
    col[i3 + 2] = c[2] * k

    // ---- funnel: each particle keeps its ring angle, so the ring opens up into the tube ----
    const row = (r() * ROWS) | 0
    const col0 = Math.round((th / TAU) * COLS)
    fun[i3] = ((col0 + (row & 1) * 0.5) / COLS) * TAU
    fun[i3 + 1] = -FH + (row / (ROWS - 1)) * FH * 2
    fun[i3 + 2] = 0

    // ---- helix ----
    const q = r()
    let hx
    let hy
    let hz
    let hc
    let hk = 0.4 + 0.5 * r()
    if (q < 0.62) {
      // the two strands: thick bands of fine particles
      const which = r() < 0.5 ? 0 : 1
      hy = (r() - 0.5) * HH * 2
      const ph = K * hy + which * Math.PI
      hx = Rh * Math.cos(ph) + gauss(r) * 0.22
      hz = Rh * Math.sin(ph) + gauss(r) * 0.22
      hy += gauss(r) * 0.12
      hc = which ? [0.52, 0.46, 1.0] : [0.45, 0.5, 1.0]
      if (r() < 0.16) hk = 1.5 // bright sparks
    } else if (q < 0.74) {
      // loose fuzz that fades outward from the strands
      const which = r() < 0.5 ? 0 : 1
      hy = (r() - 0.5) * HH * 2
      const ph = K * hy + which * Math.PI
      hx = Rh * Math.cos(ph) + gauss(r) * 0.5
      hz = Rh * Math.sin(ph) + gauss(r) * 0.5
      hy += gauss(r) * 0.3
      hc = [0.42, 0.42, 1.0]
      hk = 0.35 + 0.45 * r()
    } else if (q < 0.95) {
      // rungs: evenly spaced bands of scattered sparkles across the open loops
      const n = (r() * RUNGS) | 0
      hy = ((n + 0.5) / RUNGS) * HH * 2 - HH
      const ph = K * hy
      const ax = Rh * Math.cos(ph)
      const az = Rh * Math.sin(ph)
      const m = r()
      hx = ax + (-ax - ax) * m + gauss(r) * 0.03
      hz = az + (-az - az) * m + gauss(r) * 0.03
      hy += gauss(r) * 0.09 // band thickness
      hc = [0.62, 0.64, 1.0]
      hk = r() < 0.22 ? 1.4 : 0.45 + 0.45 * r()
    } else {
      // bright knots where the strands cross: marked by y > 50, placed by the shader
      const n = (r() * 2) | 0
      hx = gauss(r) * 0.2
      hz = gauss(r) * 0.25
      hy = 100 + n * 10 + 5 + gauss(r) * 0.2
      hc = [0.74, 0.72, 1.0]
      hk = 0.45 + 0.35 * r()
    }
    helix[i3] = hx
    helix[i3 + 1] = hy
    helix[i3 + 2] = hz
    colH[i3] = hc[0] * hk
    colH[i3 + 1] = hc[1] * hk
    colH[i3 + 2] = hc[2] * hk

    // ---- landscape (height is added by the shader so it can move) ----
    const lk = r()
    let lx
    let lz
    let ly
    if (lk < 0.14) {
      // crest: the far edge, a little thick so it glows
      lx = (r() * 2 - 1) * 8
      lz = -3.0 + gauss(r) * 0.03
      ly = gauss(r) * 0.08
    } else if (lk < 0.18) {
      // soft haze just above the crest
      lx = (r() * 2 - 1) * 8
      lz = -3.0 + gauss(r) * 0.06
      ly = Math.pow(r(), 2) * 0.1
    } else if (lk < 0.86) {
      // dotted contour rows coming toward the viewer
      lz = -2.9 + ((r() * LROWS) | 0) * 0.15
      lx = (r() * 2 - 1) * landX(lz)
      ly = gauss(r) * 0.008
    } else {
      // a few gently slanted lines crossing the rows
      lz = -2.9 + r() * 3.6
      const slope = r() < 0.5 ? 0.5 : -0.5
      lx = ((((r() * 51) | 0) / 25) - 1) * 8 + slope * (lz + 2.9)
      ly = gauss(r) * 0.008
    }
    land[i3] = lx
    land[i3 + 1] = ly
    land[i3 + 2] = lz
  }
  return { count, aSeed, ring, fun, helix, land, col, colH }
}