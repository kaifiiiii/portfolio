import { useEffect, useRef, useState } from 'react'
import { createShapes, HELIX } from './introShapes'
import { VERT, FRAG } from './introShaders'
import './IntroLanding.css'

const HERO_ID = 'home' // id of the existing hero section
const SEEN_KEY = 'kaif-intro-seen' // so repeat visits in the same tab go straight to the hero
const SCROLL_MS = 1100
const SKIP_KEYS = [' ', 'Enter', 'Escape', 'ArrowDown', 'PageDown', 'End']

// Timeline in seconds
const T = {
  fadeIn: 1.0, // particles appear
  textIn: 0.8, // text fades in
  textOut: 3.7, // text fades out
  m1: [3.3, 4.7], // ring -> funnel
  shape: [4.5, 5.5], // funnel -> barrel
  m2: [5.3, 6.9], // barrel -> helix
  cardsIn: [6.2, 7.0], // info cards fade in around the helix
  cardsOut: [9.8, 10.5], // ...and out
  m3: [10.0, 11.3], // helix -> landscape
  dim: [10.6, 12.0], // landscape settles to a calmer brightness
  finalIn: 11.0, // headline and info tabs appear over the landscape
  leave: 14.6, // fade out and scroll to the hero
}

// One number controls how fast the whole intro plays (the times above are in "intro seconds").
// 1 = original pace (about 13.6 s in total). 1.7 = about 9.7 s. 2 = about 8.4 s.
const SPEED = 1.7

// Shown over the landscape at the end. Edit the words here.
const FINAL = {
  heading: 'Building for the web, curious about AI.',
  tabs: [
    { label: 'Status', value: 'Open to full-time roles' },
    { label: 'Focus', value: 'Full stack web and Generative AI' },
    { label: 'Studying', value: 'B.Tech CSE, Jamia Hamdard' },
  ],
}

// Cards that orbit the helix. Edit the words here; keep them short.
// (All of this comes from the portfolio: projects, studies, internship, certifications.)
const CARDS = [
  {
    label: 'Projects',
    figure: '2',
    text: 'Full-stack builds: Veriqo, an AI misinformation checker, and Food Bridge, a food donation platform.',
  },
  {
    label: 'Education',
    figure: '2027',
    text: 'Graduating B.Tech in Computer Science and Engineering, Jamia Hamdard, New Delhi.',
  },
  {
    label: 'Internship',
    figure: '4 weeks',
    text: 'Data analytics with Python at Edunet Foundation, VOIS for Tech Program.',
  },
  {
    label: 'Certifications',
    figure: '4',
    text: 'Generative AI, GenAI data analytics, data science and open-source engineering.',
  },
]
const CARD_Y = [-0.16, 0.13, -0.05, 0.19] // vertical position of each card, as a share of the screen height
const CARD_SPEED = 0.35 // orbit speed in radians per intro second

// The helix flows along its axis: 'down' or 'up'
const HELIX_FLOW = 'down'
const HELIX_SPEED = 0.55 // world units per second (the helix is 5 units tall)
const HELIX_DIR = HELIX_FLOW === 'up' ? 1 : -1

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const lin = (t, [a, b]) => clamp01((t - a) / (b - a))
const smooth = (x) => {
  const v = clamp01(x)
  return v * v * (3 - 2 * v)
}

// When does the intro play?
//   'always'  every time the page loads or is reloaded
//   'session' once per browser tab; reloads go straight to the hero
const PLAY = 'always'

function shouldSkip() {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.has('nointro')) return true // ?nointro skips it (handy while you edit the site)
    if (PLAY === 'always' || params.has('intro')) return false
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

// Start downloading Three.js right away (only when the intro will actually play)
let threeLoad = null
function loadThree() {
  threeLoad = threeLoad || import('three')
  return threeLoad
}
if (typeof window !== 'undefined' && !shouldSkip()) {
  // A reload must start at the top, not where the browser last left the page
  try {
    window.history.scrollRestoration = 'manual'
  } catch {
    /* not supported: fine */
  }
  loadThree().catch(() => {}) // errors are handled when the intro starts
}

/**
 * Full-screen opening animation. It plays once, then scrolls itself into the hero
 * and removes itself from the page. Render it directly before <Hero />.
 *   onDone: called when the intro is finished (or skipped)
 */
export default function IntroLanding({ onDone }) {
  const [skip] = useState(shouldSkip)
  const [gone, setGone] = useState(false)
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const cardsRef = useRef(null)
  const glowRef = useRef(null)
  const cardRefs = useRef([])
  const leaveRef = useRef(null)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  // Returning visitor: nothing to play
  useEffect(() => {
    if (skip) onDoneRef.current?.()
  }, [skip])

  useEffect(() => {
    if (skip) return undefined
    const root = rootRef.current
    const canvas = canvasRef.current
    const html = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let cancelled = false
    let finished = false // makes sure the exit runs only once
    let raf = 0
    let scrollRaf = 0
    let timer = 0
    let elapsed = 0
    let leaveAt = Infinity
    let textOn = false
    let cardsShown = false
    let finalOn = false
    let teardownGL = () => {}

    html.classList.add('intro-lock') // no manual scrolling while it plays
    window.scrollTo({ top: 0, behavior: 'instant' }) // always start at the top, even after a reload or a #link

    // The hero is now showing: remove the intro without any visible jump
    const complete = () => {
      if (cancelled) return
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {
        /* private mode: fine */
      }
      html.classList.remove('intro-lock')
      const heroEl = document.getElementById(HERO_ID)
      if (heroEl) {
        heroEl.style.opacity = ''
        heroEl.style.transition = ''
      }
      root.style.display = 'none'
      window.scrollTo({ top: 0, behavior: 'instant' })
      setGone(true)
      window.dispatchEvent(new Event('resize')) // lets scroll animations re-measure
      onDoneRef.current?.()
    }

    const finish = (instant = false) => {
      if (finished || cancelled) return
      finished = true
      leaveAt = Math.min(leaveAt, elapsed)
      root.dataset.leaving = 'true'
      html.classList.remove('intro-lock')
      const hero = document.getElementById(HERO_ID)
      if (instant || !hero) {
        complete()
        return
      }
      hero.style.opacity = '0'
      void hero.offsetHeight // apply the start state before the transition begins
      hero.style.transition = 'opacity 0.9s ease'
      hero.style.opacity = '1'
      const from = window.scrollY
      const t0 = performance.now()
      const step = (now) => {
        if (cancelled) return
        const p = Math.min(1, (now - t0) / SCROLL_MS)
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
        const to = hero.getBoundingClientRect().top + window.scrollY
        window.scrollTo({ top: from + (to - from) * e, behavior: 'instant' })
        if (p < 1) scrollRaf = requestAnimationFrame(step)
        else complete()
      }
      scrollRaf = requestAnimationFrame(step)
    }
    leaveRef.current = () => finish(false)

    // Any scroll or key press means "take me in"
    const onUserSkip = (e) => {
      if (e.type === 'keydown' && !SKIP_KEYS.includes(e.key)) return
      finish(false)
    }
    window.addEventListener('wheel', onUserSkip, { passive: true })
    window.addEventListener('touchmove', onUserSkip, { passive: true })
    window.addEventListener('keydown', onUserSkip)

    // Text only: reduced motion, or a device without WebGL
    const textOnly = (ms, instant) => {
      root.dataset.text = 'on'
      timer = window.setTimeout(() => finish(instant), ms)
    }

    const init = async () => {
      if (reduce) {
        textOnly(1600, true)
        return
      }
      let THREE
      try {
        THREE = await loadThree()
      } catch {
        if (!cancelled) textOnly(2800, false)
        return
      }
      if (cancelled) return

      let renderer
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
        })
      } catch {
        textOnly(2800, false)
        return
      }

      // Fewer particles and a lower pixel ratio on phones and weaker machines
      const mobile = window.innerWidth < 768
      const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4
      const count = mobile ? 22000 : lowEnd ? 42000 : 70000
      const cardCount = mobile ? 3 : CARDS.length
      cardRefs.current.slice(cardCount).forEach((el) => {
        if (el) el.style.display = 'none'
      })
      let dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
      renderer.setPixelRatio(dpr)
      renderer.setClearColor(0x000000, 1)

      const S = createShapes(count)
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(S.ring, 3))
      geometry.setAttribute('aFun', new THREE.BufferAttribute(S.fun, 3))
      geometry.setAttribute('aHelix', new THREE.BufferAttribute(S.helix, 3))
      geometry.setAttribute('aLand', new THREE.BufferAttribute(S.land, 3))
      geometry.setAttribute('aCol', new THREE.BufferAttribute(S.col, 3))
      geometry.setAttribute('aColH', new THREE.BufferAttribute(S.colH, 3))
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(S.aSeed, 1))

      const uniforms = {
        uTime: { value: 0 },
        uM1: { value: 0 },
        uM2: { value: 0 },
        uM3: { value: 0 },
        uShape: { value: 0 },
        uRot: { value: 0 },
        uHelixShift: { value: 0 },
        uHelixK: { value: HELIX.K },
        uHelixHalf: { value: HELIX.half },
        uSize: { value: mobile ? 2.1 : 1.6 },
        uPixelRatio: { value: dpr },
        uBright: { value: 1 },
        uFade: { value: 0 },
        uLandY: { value: -2.1 },
        uCamZ: { value: 5 },
      }
      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      })
      const points = new THREE.Points(geometry, material)
      points.frustumCulled = false // positions are computed on the GPU
      const scene = new THREE.Scene()
      scene.add(points)
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
      let camZ = 5

      let vw = 0
      let vh = 0
      const resize = () => {
        const w = root.clientWidth
        const h = root.clientHeight
        if (!w || !h) return
        vw = w
        vh = h
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        camZ = 5 * Math.max(1, 1.5 / camera.aspect) // step back on tall screens so the ring fits
        uniforms.uCamZ.value = camZ
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(root)

      // Gentle mouse parallax on the camera (mouse only)
      let tx = 0
      let ty = 0
      let px = 0
      let py = 0
      const onPointer = (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return
        tx = e.clientX / window.innerWidth - 0.5
        ty = e.clientY / window.innerHeight - 0.5
      }
      root.addEventListener('pointermove', onPointer)

      // If the machine struggles, quietly lower the quality so the motion stays smooth
      let slow = 0
      let quality = dpr > 1 ? 2 : 1
      let last = performance.now()
      const frame = (now) => {
        raf = requestAnimationFrame(frame)
        const dt = Math.min((now - last) / 1000, 0.1) // a hidden tab pauses instead of skipping ahead
        last = now
        elapsed += dt * SPEED

        if (!finished && elapsed > 0.8) {
          slow = dt > 0.034 ? slow + 1 : Math.max(0, slow - 1)
          if (slow > 24 && quality > 0) {
            quality -= 1
            slow = 0
            if (quality === 1) {
              dpr = 1
              renderer.setPixelRatio(1)
              uniforms.uPixelRatio.value = 1
              resize()
            } else {
              geometry.setDrawRange(0, Math.floor(count * 0.6))
            }
          }
        }
        const t = elapsed

        if (!finished && t >= T.leave) finish(false)

        const wantText = !finished && t >= T.textIn && t < T.textOut
        if (wantText !== textOn) {
          textOn = wantText
          root.dataset.text = wantText ? 'on' : 'off'
        }

        const wantFinal = !finished && t >= T.finalIn
        if (wantFinal !== finalOn) {
          finalOn = wantFinal
          root.dataset.final = wantFinal ? 'on' : 'off'
        }

        uniforms.uTime.value = t
        uniforms.uM1.value = lin(t, T.m1)
        uniforms.uM2.value = lin(t, T.m2)
        uniforms.uM3.value = lin(t, T.m3)
        uniforms.uShape.value = lin(t, T.shape)
        uniforms.uRot.value = t * 0.7
        uniforms.uHelixShift.value = HELIX_DIR * HELIX_SPEED * Math.max(0, t - T.m2[0])
        uniforms.uFade.value = smooth(t / T.fadeIn) * (1 - smooth((t - leaveAt) / 0.7))
        uniforms.uBright.value = 1 - 0.45 * smooth((t - T.dim[0]) / (T.dim[1] - T.dim[0]))

        px += (tx - px) * Math.min(1, dt * 3)
        py += (ty - py) * Math.min(1, dt * 3)
        camera.position.set(
          Math.sin(t * 0.3) * 0.15 + px * 0.4,
          -py * 0.25,
          camZ * (1 - 0.1 * smooth((t - 5) / 3.5))
        )
        camera.lookAt(0, 0, 0)

        // A soft glow behind the helix, only while the helix is on screen
        const gl = glowRef.current
        if (gl) {
          const g = smooth((t - 6.2) / 1.0) * (1 - smooth((t - 9.8) / 0.9))
          gl.style.opacity = (finished ? 0 : g).toFixed(3)
        }

        // Info cards orbit the helix: they pass in front, then fade out as they go behind it
        const cs = cardsRef.current
        if (cs) {
          const env =
            smooth((t - T.cardsIn[0]) / (T.cardsIn[1] - T.cardsIn[0])) *
            (1 - smooth((t - T.cardsOut[0]) / (T.cardsOut[1] - T.cardsOut[0])))
          const showCards = env > 0.01 && !finished
          if (showCards !== cardsShown) {
            cardsShown = showCards
            cs.style.display = showCards ? 'block' : 'none'
          }
          if (showCards) {
            cs.style.opacity = env.toFixed(3)
            const w = vw
            const h = vh
            const R = Math.min(w * (mobile ? 0.34 : 0.3), 430)
            for (let k = 0; k < cardCount; k++) {
              const el = cardRefs.current[k]
              if (!el) continue
              const a = t * CARD_SPEED + (k / cardCount) * Math.PI * 2 + 0.6
              const sx = Math.sin(a)
              const cz = Math.cos(a)
              const depth = (cz + 1) / 2 // 1 = in front of the helix, 0 = behind it
              const x = sx * R
              const y = CARD_Y[k] * h + Math.sin(t * 0.9 + k * 1.7) * 5
              const z = cz * R * 0.55
              const vis = smooth((depth - 0.1) / 0.55)
              el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${(-sx * 28).toFixed(1)}deg) scale(${(0.86 + 0.14 * depth).toFixed(3)})`
              el.style.opacity = vis.toFixed(3)
              el.style.zIndex = String(Math.round(depth * 10))
            }
          }
        }
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(frame)

      teardownGL = () => {
        cancelAnimationFrame(raf)
        root.removeEventListener('pointermove', onPointer)
        ro.disconnect()
        geometry.dispose()
        material.dispose()
        renderer.dispose()
      }
    }
    init()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      cancelAnimationFrame(scrollRaf)
      window.clearTimeout(timer)
      window.removeEventListener('wheel', onUserSkip)
      window.removeEventListener('touchmove', onUserSkip)
      window.removeEventListener('keydown', onUserSkip)
      teardownGL()
      html.classList.remove('intro-lock')
    }
  }, [skip])

  if (skip || gone) return null

  return (
    <section id="intro" ref={rootRef} className="intro" aria-label="Introduction" data-text="off" data-final="off">
      <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />
      <div className="intro-vignette" aria-hidden="true" />
      <div ref={glowRef} className="intro-helix-glow" aria-hidden="true" />
      <div ref={cardsRef} className="intro-cards" aria-hidden="true">
        {CARDS.map((card, i) => (
          <div
            key={card.label}
            className="intro-card"
            ref={(el) => {
              cardRefs.current[i] = el
            }}
          >
            <p className="intro-card-label">{card.label}</p>
            <p className="intro-card-figure">{card.figure}</p>
            <p className="intro-card-text">{card.text}</p>
          </div>
        ))}
      </div>
      <div className="intro-text">
        <p className="intro-eyebrow">Welcome to the portfolio of</p>
        <h2 className="intro-name">Mohammad Kaif Ali Ansari</h2>
      </div>
      <div className="intro-final" aria-hidden="true">
        <h3 className="intro-final-heading">{FINAL.heading}</h3>
        <ul className="intro-final-tabs">
          {FINAL.tabs.map((tab) => (
            <li key={tab.label} className="intro-tab">
              <span className="intro-tab-label">{tab.label}</span>
              <span className="intro-tab-value">{tab.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <button type="button" className="intro-skip" onClick={() => leaveRef.current?.()}>
        Skip intro
      </button>
    </section>
  )
}