import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import CertificationCube from './CertificationCube'
import './Education.css'
import {
  educationContent,
  education,
  certificationsHeading,
  certifications,
} from '../data/education'

// Oldest first, so the wheel turns forward in time as you scroll down
const stops = [...education].sort((a, b) => Number(a.year) - Number(b.year))
const stopYears = stops.map((s) => Number(s.year))
const N = stops.length

// Years shown on the rim: a little before the first entry to a little after the last
const FIRST = Math.min(...stopYears) - 2
const LAST = Math.max(...stopYears) + 1
const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i)

const DEG_PER_YEAR = 8 // how far apart the years sit on the rim
const LABEL_GAP = 40 // px between the disc edge and the labels
const PIN_TOP = 64 // gap above the pinned section
const VH_PER_STOP = 75 // scroll distance per entry, in viewport heights

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const smooth = (t) => t * t * (3 - 2 * t)

// Scroll progress (0 to 1) -> the year at the pointer. It rests on each entry for a moment
// and glides through the empty years in between.
function yearAt(p) {
  if (N === 1) return stopYears[0]
  const s = p * (N - 1)
  const i = Math.min(N - 2, Math.floor(s))
  const e = smooth(clamp((s - i - 0.2) / 0.6, 0, 1))
  return stopYears[i] + (stopYears[i + 1] - stopYears[i]) * e
}

export default function Education() {
  const trackRef = useRef(null)
  const stickyRef = useRef(null)
  const stageRef = useRef(null)
  const [yf, setYf] = useState(stopYears[0])
  const [pinned] = useState(
    () => N > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  // The section stays pinned while you scroll; the wheel turns with your scroll position
  useEffect(() => {
    if (!pinned) return
    let raf = 0
    const update = () => {
      raf = 0
      const track = trackRef.current
      const sticky = stickyRef.current
      if (!track || !sticky) return
      const rect = track.getBoundingClientRect()
      const travel = Math.max(1, rect.height - sticky.offsetHeight)
      const p = clamp((PIN_TOP - rect.top) / travel, 0, 1)
      const next = Math.round(yearAt(p) * 200) / 200
      setYf((prev) => (prev === next ? prev : next))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pinned])

  // The entry the pointer is on
  const activeId = stops.find((s) => Math.abs(Number(s.year) - yf) < 0.12)?.id

  // The entry that was active a moment ago plays the closing sequence: the details fade, then the
  // big year shrinks and flies back to its small spot on the wheel.
  const [prevActive, setPrevActive] = useState(activeId)
  const [leaving, setLeaving] = useState(null)
  if (activeId !== prevActive) {
    setPrevActive(activeId)
    if (prevActive) setLeaving(prevActive)
  }
  const leavingId = leaving && leaving !== activeId ? leaving : null
  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => setLeaving(null), 1000)
    return () => clearTimeout(t)
  }, [leaving])

  // When an entry becomes active, work out where its small wheel label sits relative to the big
  // year on the right. The reveal animation starts from there, so the wheel's year itself
  // appears to grow and travel across.
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage || !activeId) return
    const card = stage.querySelector(`.edu-card[data-id="${activeId}"]`)
    const big = card?.querySelector('.edu-card-year')
    const label = stage.querySelector('.edu-year[data-lift]')
    const wheel = stage.querySelector('.edu-wheel')
    const pointer = stage.querySelector('.edu-pointer')
    if (!card || !big || !label || !wheel || !pointer) return
    const w = wheel.getBoundingClientRect()
    const info = stage.querySelector('.edu-info').getBoundingClientRect()
    const radius = pointer.offsetLeft - 4
    const fromX = w.left + radius + LABEL_GAP
    const fromY = w.top
    const toX = info.left + big.offsetLeft
    const toY = info.top + big.offsetTop + big.offsetHeight / 2
    const small = parseFloat(getComputedStyle(label).fontSize) * 1.45
    const large = parseFloat(getComputedStyle(big).fontSize)
    card.style.setProperty('--fx', `${fromX - toX}px`)
    card.style.setProperty('--fy', `${fromY - toY}px`)
    card.style.setProperty('--fs', `${small / large}`)
  }, [activeId])

  // Same measuring for the way back: where is the wheel's label for this year right now?
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage || !leavingId) return
    const item = stops.find((s) => s.id === leavingId)
    const card = stage.querySelector(`.edu-card[data-id="${leavingId}"]`)
    const big = card?.querySelector('.edu-card-year')
    const label = stage.querySelector(`.edu-year[data-y="${item.year}"]`)
    if (!card || !big || !label) return
    const l = label.getBoundingClientRect()
    const info = stage.querySelector('.edu-info').getBoundingClientRect()
    const toX = info.left + big.offsetLeft
    const toY = info.top + big.offsetTop + big.offsetHeight / 2
    const small = parseFloat(getComputedStyle(label).fontSize) * 1.2
    const large = parseFloat(getComputedStyle(big).fontSize)
    card.style.setProperty('--bx', `${l.left - toX}px`)
    card.style.setProperty('--by', `${l.top + l.height / 2 - toY}px`)
    card.style.setProperty('--bs', `${small / large}`)
  }, [leavingId])

  const headline = (item) => item.title || item.level
  const subline = (item) => (item.title ? `${item.level} · ${item.school}` : item.school)

  return (
    <section id="education" className="relative bg-navy-900 py-24 sm:py-32">
      <div className="w-full px-5 sm:px-8 lg:px-14">
        {/* Tall track: gives the scroll distance that turns the wheel */}
        <div
          ref={trackRef}
          style={pinned ? { height: `calc(100vh + ${(N - 1) * VH_PER_STOP}vh)` } : undefined}
        >
          <div ref={stickyRef} style={pinned ? { position: 'sticky', top: PIN_TOP } : undefined}>
            {/* Heading */}
            <div data-aos="fade-up" className="max-w-2xl">
              <p className="mb-4 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-muted sm:text-sm">
                {educationContent.eyebrow}
              </p>
              <h2 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                {educationContent.heading}
              </h2>
            </div>

            {pinned ? (
              <div className="edu-stage" ref={stageRef}>
                <div className="edu-wheel" aria-hidden="true">
                  <div className="edu-disc" />
                  <div className="edu-ring" style={{ transform: `rotate(${-yf * DEG_PER_YEAR}deg)` }} />
                  <div className="edu-pointer" />
                  {YEARS.map((y) => {
                    const d = y - yf
                    const deg = d * DEG_PER_YEAR
                    const a = Math.abs(deg)
                    const near = clamp(1 - Math.abs(d), 0, 1)
                    const opacity = a > 72 ? 0 : a > 52 ? (72 - a) / 20 : 1
                    return (
                      <span
                        key={y}
                        className="edu-year"
                        data-y={y}
                        data-stop={stopYears.includes(y) ? '' : undefined}
                        data-lift={stops.some((s) => s.id === activeId && Number(s.year) === y) ? '' : undefined}
                        data-return={stops.some((s) => s.id === leavingId && Number(s.year) === y) ? '' : undefined}
                        style={{
                          opacity,
                          transform: `rotate(${deg}deg) translateX(calc(var(--edu-r) + ${LABEL_GAP}px)) scale(${
                            1 + 0.45 * near
                          }) translateY(-50%)`,
                        }}
                      >
                        {y}
                      </span>
                    )
                  })}
                </div>

                <div className="edu-info">
                  {stops.map((item) => {
                    // The entry whose year the pointer is on plays its reveal; others stay hidden
                    const on = item.id === activeId
                    return (
                      <div
                        key={item.id}
                        className="edu-card"
                        data-id={item.id}
                        data-on={on ? '' : undefined}
                        data-leave={item.id === leavingId ? '' : undefined}
                        aria-hidden={!on}
                      >
                        <p className="edu-card-year">
                          {item.year}
                          {item.yearNote && <span className="edu-card-note edu-rise">{item.yearNote}</span>}
                        </p>
                        <h3 className="edu-card-title edu-rise">{headline(item)}</h3>
                        <p className="edu-card-sub edu-rise">{subline(item)}</p>
                        {item.result && <p className="edu-card-result edu-rise">{item.result}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <ul className="edu-list">
                {stops.map((item) => (
                  <li key={item.id}>
                    <p className="font-display text-4xl font-extrabold text-brand">
                      {item.year}
                      {item.yearNote && (
                        <span className="ml-3 text-xs font-normal uppercase tracking-[0.2em] text-muted">
                          {item.yearNote}
                        </span>
                      )}
                    </p>
                    <h3 className="font-display text-2xl font-bold text-white">{headline(item)}</h3>
                    <p className="text-ink/80">{subline(item)}</p>
                    {item.result && <p className="text-sm text-brand-soft">{item.result}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-24">
          <h3
            data-aos="fade-up"
            className="mb-8 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-muted sm:text-sm"
          >
            {certificationsHeading}
          </h3>

          <div data-aos="fade-up">
            <CertificationCube items={certifications} />
          </div>
        </div>
      </div>
    </section>
  )
}
