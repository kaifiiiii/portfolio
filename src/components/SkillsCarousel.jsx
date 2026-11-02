import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { skillCategories } from '../data/skillShowcase'
import useInView from '../hooks/useInView'

const N = skillCategories.length
const STEP_MS = 600 // input is ignored for this long after a single step
const FAST_STEP_MS = 300 // per-step time when a dot jumps several cards at once

// Where a card sits, relative to the active one
function positionOf(index, active) {
  let d = (index - active + N) % N
  if (d > N / 2) d -= N
  if (d === 0) return '0'
  if (d === 1) return '1'
  if (d === -1) return '-1'
  if (d === 2) return 'far-r'
  if (d === -2) return 'far-l'
  return 'back'
}

const arrowButton =
  'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#3B82F6]/60 bg-[#050914]/80 text-white transition-all duration-200 hover:border-[#38BDF8] hover:bg-[#3B82F6]/20 hover:shadow-[0_0_20px_rgba(56,189,248,0.35)]'

// Parts 2 and 3: a connector line, then a 3D carousel of skill categories.
export default function SkillsCarousel() {
  // Reveal once the block has scrolled a little way into view
  const [viewRef, { seen }] = useInView({ threshold: 0.2, rootMargin: '0px 0px -10% 0px' })

  const [active, setActive] = useState(0)
  const [fast, setFast] = useState(false) // quicker transition while a dot jumps several cards

  const activeRef = useRef(0) // always the latest active index, even between renders
  const lockRef = useRef(false) // true while a move is still animating
  const timerRef = useRef(null)
  const startX = useRef(null)
  const swiped = useRef(false)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Every kind of navigation goes through here, so the lock covers them all.
  // Jumping several cards steps through the cards in between,
  // so the carousel visibly turns the short way round.
  const goTo = (target) => {
    if (lockRef.current) return
    let diff = (target - activeRef.current + N) % N
    if (diff > N / 2) diff -= N
    if (diff === 0) return

    const dir = Math.sign(diff)
    const steps = Math.abs(diff)
    const ms = steps > 1 ? FAST_STEP_MS : STEP_MS
    let done = 0

    lockRef.current = true
    setFast(steps > 1)

    const tick = () => {
      activeRef.current = (activeRef.current + dir + N) % N
      setActive(activeRef.current)
      done += 1
      timerRef.current = setTimeout(
        done < steps
          ? tick
          : () => {
              lockRef.current = false
              setFast(false)
            },
        ms
      )
    }
    tick()
  }

  const next = () => goTo((activeRef.current + 1) % N)
  const prev = () => goTo((activeRef.current - 1 + N) % N)

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') next()
    else if (e.key === 'ArrowLeft') prev()
    else if (e.key === 'Home') goTo(0)
    else if (e.key === 'End') goTo(N - 1)
    else return
    e.preventDefault()
  }

  // Swipe on touch screens (and drag with a mouse)
  const onPointerDown = (e) => {
    startX.current = e.clientX
    swiped.current = false
  }
  const onPointerUp = (e) => {
    if (startX.current == null) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) > 50) {
      swiped.current = true
      if (dx < 0) next()
      else prev()
    }
  }

  return (
    <div ref={viewRef} className={seen ? 'cv-in' : ''} onKeyDown={onKeyDown}>
      {/* Connector: a line that draws itself down from the orbit into this block */}
      <div aria-hidden="true" className="cv-link">
        <span className="cv-link-line" />
        <span className="cv-link-node" />
      </div>

      {/* Heading */}
      <div className="text-center">
        <h3
          style={{ '--d': '0.1s' }}
          className="cv-head font-display text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-6xl"
        >
          <span className="text-white">Skills by </span>
          <span className="bg-linear-to-r from-[#38BDF8] to-[#8B5CF6] bg-clip-text text-transparent">
            Category
          </span>
        </h3>
        <p
          style={{ '--d': '0.22s' }}
          className="cv-head mx-auto mt-5 max-w-xl text-sm text-muted sm:text-base"
        >
          Explore the technologies behind my projects.
        </p>
      </div>

      {/* Carousel */}
      <div className="relative mt-10 sm:mt-14">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous category"
          className={`${arrowButton} absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 xl:grid`}
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next category"
          className={`${arrowButton} absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 xl:grid`}
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>

        <div
          className={`cv-stage ${fast ? 'cv-fast' : ''}`}
          role="region"
          aria-roledescription="carousel"
          aria-label="Skill categories"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (startX.current = null)}
        >
          {skillCategories.map((c, i) => {
            const pos = positionOf(i, active)
            const isActive = pos === '0'
            const HeaderIcon = c.Icon
            const cols = c.items.length === 4 ? 2 : 3
            // Entrance order depends only on the starting layout, so it never replays on navigation
            const enterDelay = i === 0 ? '0.3s' : i === 1 || i === N - 1 ? '0.6s' : '0.9s'
            return (
              <div
                key={c.id}
                className="cv-card"
                data-pos={pos}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${N}: ${c.title}`}
                aria-hidden={pos === '0' || pos === '1' || pos === '-1' ? undefined : 'true'}
                onClick={() => {
                  if (swiped.current) {
                    swiped.current = false
                    return
                  }
                  if (!isActive) goTo(i)
                }}
              >
                <div className="cv-enter" style={{ '--e': enterDelay }}>
                  <div className="cv-face">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-block rounded-lg border border-brand/40 bg-brand/15 px-2.5 py-1 font-display text-sm font-semibold text-white">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <h4 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-white">
                          {c.title}
                        </h4>
                      </div>
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-[1.5px] border-[#6366F1]/70 text-[#8AA4FF]">
                        <HeaderIcon size={24} aria-hidden="true" />
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-[#9DB4E0]">{c.description}</p>

                    <ul className="cv-tiles" style={{ '--cols': cols }}>
                      {c.items.map(({ name, Icon, color }) => (
                        <li key={name} className="cv-tile">
                          <span className="cv-tile-icon">
                            <Icon size={28} aria-hidden="true" style={{ color }} />
                          </span>
                          <span className="cv-tile-label">{name}</span>
                        </li>
                      ))}
                    </ul>

                    <span aria-hidden="true" className="cv-dim" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Announces the current card to screen readers */}
      <p className="sr-only" aria-live="polite">
        {skillCategories[active].title}, {active + 1} of {N}
      </p>

      {/* Dots, plus arrows on screens too narrow for the side buttons */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button type="button" onClick={prev} aria-label="Previous category" className={`${arrowButton} xl:hidden`}>
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div className="flex items-center">
          {skillCategories.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${c.title}`}
              aria-current={i === active ? 'true' : undefined}
              className="px-1.5 py-3"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 bg-[#38BDF8]' : 'w-2 bg-white/25 hover:bg-white/50'
                }`}
              />
            </button>
          ))}
        </div>
        <button type="button" onClick={next} aria-label="Next category" className={`${arrowButton} xl:hidden`}>
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
