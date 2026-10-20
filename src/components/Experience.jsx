import { useLayoutEffect, useRef } from 'react'
import { experienceContent, experience } from '../data/experience'
import './experience.css'

const N = experience.length
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
const smooth = (t) => t * t * (3 - 2 * t)

// Extra scroll before the first panel has risen into place
const LEAD = 0.7
// Scroll distance per panel, in viewport heights
const VH_PER_PANEL = 85
// How quickly the panels catch up with the scroll position (the "scrub" smoothing)
const FOLLOW = 0.14

// Horizontal lane of each panel, as the centre's share of the screen width: right, centre-left, left.
// Further panels repeat the pattern. Vertical nudge is a share of screen height.
const LANES = [
  { x: 0.64, y: -0.02 },
  { x: 0.4, y: 0.03 },
  { x: 0.24, y: -0.01 },
]

// Scroll position in "panels", pausing on each so it can be read before the next one arrives
const withHold = (raw) => {
  const i = Math.floor(raw)
  const f = raw - i
  return i + smooth(clamp((f - 0.15) / 0.7, 0, 1))
}

export default function Experience() {
  const sectionRef = useRef(null)
  const headRef = useRef(null)
  const panelsRef = useRef(null)

  // Everything here writes straight to the DOM, so scrolling never re-renders React.
  useLayoutEffect(() => {
    const section = sectionRef.current
    const head = headRef.current
    const list = panelsRef.current
    if (!section || !head || !list) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Reduced motion (or a single entry): leave a plain, readable list
    if (reduce || N < 2) return

    const panels = [...list.querySelectorAll('[data-exp-panel]')]
    section.setAttribute('data-exp-stack', '')
    section.style.setProperty('--exp-t', String(N - 1 + LEAD))
    section.style.setProperty('--exp-vh', String(VH_PER_PANEL))

    // The layout that makes the pinned scroll work is also set inline here, so it still
    // works if the stylesheet is stale or overridden
    const stage = section.querySelector('.exp-stage')
    section.style.height = `calc(100vh + ${N - 1 + LEAD} * ${VH_PER_PANEL} * 1vh)`
    section.style.paddingBlock = '0'
    if (stage) {
      Object.assign(stage.style, {
        position: 'sticky',
        top: '0',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingTop: '3rem',
        overflow: 'hidden',
      })
    }
    Object.assign(list.style, {
      position: 'absolute',
      inset: '0',
      display: 'block',
      margin: '0',
      width: 'auto',
      pointerEvents: 'none',
    })
    const panelWidth = () => {
      const vw = window.innerWidth
      return vw < 640 ? '88vw' : vw < 1024 ? 'min(30rem, 62vw)' : 'min(34rem, 38vw)'
    }
    panels.forEach((p) => {
      Object.assign(p.style, { position: 'absolute', top: '0', left: '0', willChange: 'transform' })
    })

    // Heading: fade in the first time it is seen
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        head.setAttribute('data-seen', '')
        io.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px' }
    )
    io.observe(head)

    let sizes = []
    const measure = () => {
      const w = panelWidth()
      panels.forEach((p) => {
        p.style.width = w
      })
      sizes = panels.map((p) => ({ w: p.offsetWidth, h: p.offsetHeight }))
    }

    // Target scroll position (in panels), and the smoothed value that is actually drawn
    const target = () => {
      const vh = window.innerHeight
      const r = section.getBoundingClientRect()
      const p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1)
      return withHold(p * (N - 1 + LEAD) - LEAD)
    }

    let activeIdx = -1
    const render = (s) => {
      const vh = window.innerHeight
      const vw = window.innerWidth
      // On narrow screens the lanes close in toward the centre
      const spread = vw < 640 ? 0.12 : vw < 1024 ? 0.55 : 1
      const cy = vh / 2 + 24 // centre of the stage, below the fixed navbar

      panels.forEach((panel, i) => {
        const { w, h } = sizes[i] || { w: 0, h: 0 }
        const lane = LANES[i % LANES.length]
        const d = i - s
        // One straight vertical path: below the screen (d = 1), at rest (d = 0), above it (d = -1)
        const travel = vh / 2 + h / 2 + 40
        const cx = vw * (0.5 + (lane.x - 0.5) * spread)
        const x = cx - w / 2
        const y = cy - h / 2 + lane.y * vh + d * travel
        panel.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        panel.style.visibility = Math.abs(d) > 1.05 ? 'hidden' : 'visible'
        panel.style.pointerEvents = Math.abs(d) < 0.5 ? 'auto' : 'none'
        panel.style.zIndex = String(50 - Math.round(Math.abs(d) * 10))
      })

      const nearest = clamp(Math.round(s), 0, N - 1)
      if (nearest !== activeIdx) {
        activeIdx = nearest
        panels.forEach((panel, i) => {
          panel.toggleAttribute('data-active', i === nearest)
          panel.setAttribute('aria-hidden', i === nearest ? 'false' : 'true')
        })
      }
    }

    // Draw loop only runs while the panels are still catching up with the scroll position
    let cur = target()
    let raf = 0
    const tick = () => {
      raf = 0
      const t = target()
      const diff = t - cur
      if (Math.abs(diff) < 0.0008) cur = t
      else {
        cur += diff * FOLLOW
        raf = requestAnimationFrame(tick)
      }
      render(cur)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    measure()
    render(cur)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const ro = new ResizeObserver(() => {
      measure()
      schedule()
    })
    panels.forEach((p) => ro.observe(p))

    return () => {
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (raf) cancelAnimationFrame(raf)
      section.removeAttribute('data-exp-stack')
      section.style.removeProperty('--exp-t')
      section.style.removeProperty('--exp-vh')
      section.style.removeProperty('height')
      section.style.removeProperty('padding-block')
      if (stage) stage.removeAttribute('style')
      list.removeAttribute('style')
      panels.forEach((p) => p.removeAttribute('style'))
    }
  }, [])

  return (
    <section ref={sectionRef} id="experience" className="exp-section relative py-24 sm:py-32">
      <div className="exp-stage">
        {/* Pinned heading: stays still while the panels pass over it */}
        <div ref={headRef} className="exp-head relative z-0 mx-auto w-full max-w-5xl px-5 text-center sm:px-8">
          <p className="mb-5 flex items-center justify-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-muted sm:text-sm">
            {experienceContent.eyebrow}
          </p>
          <h2 className="mx-auto max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-white text-shadow-none sm:text-7xl lg:text-8xl">
            {experienceContent.heading}
          </h2>
        </div>

        {/* The panels */}
        <ol ref={panelsRef} className="exp-panels">
          {experience.map((item) => {
            const when = [item.period, item.status].filter(Boolean)
            return (
              <li key={item.id} data-exp-panel className="exp-panel group">
                <div style={{ backgroundColor: '#060b1a' }} className="exp-face relative z-10 rounded-xl border border-[#4f8fe0]/50 bg-[#060b1a] bg-[linear-gradient(150deg,rgba(29,139,255,0.2),transparent_45%)] p-5 shadow-[0_0_0_1px_rgba(79,143,224,0.2),0_0_60px_-6px_rgba(29,139,255,0.6),0_30px_70px_-30px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow] duration-300 group-data-active:border-brand-soft/90 group-data-active:shadow-[0_0_0_1px_rgba(108,180,255,0.4),0_0_110px_-4px_rgba(29,139,255,0.85),0_30px_70px_-30px_rgba(0,0,0,0.9)] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    {item.type && (
                      <span className="inline-block rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.15em] text-brand-soft">
                        {item.type}
                      </span>
                    )}
                    {when.length > 0 && (
                      <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">
                        <span className="text-white">{item.period}</span>
                        {item.period && item.status && ' · '}
                        {item.status && <span className="text-brand-soft">{item.status}</span>}
                      </p>
                    )}
                  </div>

                  <h3 className="mt-3 font-display text-xl font-extrabold text-white sm:mt-4 sm:text-2xl">
                    {item.role}
                  </h3>
                  <p className="mt-1 text-sm text-muted sm:text-base">{item.org}</p>

                  {item.description && (
                    <p className="mt-4 font-lora text-base leading-relaxed text-ink/85">
                      {item.description}
                    </p>
                  )}

                  {item.bullets?.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {item.bullets.map((line) => (
                        <li
                          key={line}
                          className="flex gap-3 font-lora text-[14.5px] leading-snug text-ink/85 sm:text-[15px]"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                          />
                          {line}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}