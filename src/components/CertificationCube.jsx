import { useCallback, useEffect, useRef, useState } from 'react'
import { Award, ArrowUpRight } from 'lucide-react'
import './CertificationCube.css'

const SIDES = 4 // four certification faces stacked around the horizontal axis; left and right are summary faces
const MOVE_MS = 1700 // one click: a full spin, then the next certification
const FAST_MS = 600 // one quick turn when a dot jumps several items
const LAND_MS = 2600 // the landing when the section comes into view

const mod = (n, m) => ((n % m) + m) % m

// A six-faced cube that flies out of the screen when the section appears, lands face-on,
// and spins on both axes to the next certification each time it is clicked.
// `items` is the certifications list.
export default function CertificationCube({ items }) {
  const N = items.length
  const rootRef = useRef(null)
  const tiltRef = useRef(null)
  const enterRef = useRef(null) // fades in on landing
  const riseRef = useRef(null) // flies in from deep inside the screen (outer, so it travels straight at you)
  const flyRef = useRef(null) // spins while landing
  const stepRef = useRef(0) // counts every flip, never resets, so the square always turns the same way
  const lockRef = useRef(false)
  const timerRef = useRef(null)

  const [step, setStep] = useState(0)
  const [moveMs, setMoveMs] = useState(MOVE_MS)
  const [spins, setSpins] = useState(0) // full 360-degree turns added on top of the quarter turns
  const spinsRef = useRef(0)
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const active = mod(step, N)

  // Follow the system "reduce motion" setting live
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Landing: when the block comes into view the cube starts far back inside the screen,
  // tiny, and flies toward you while tumbling, overshoots a little and settles face-on.
  // It plays again every time the visitor scrolls back to it.
  useEffect(() => {
    const root = rootRef.current
    const enter = enterRef.current
    const rise = riseRef.current
    const fly = flyRef.current
    if (!root || !enter || !rise || !fly || reduced || !enter.animate) return
    let running = []
    const reset = () => {
      running.forEach((a) => a.cancel())
      running = []
      enter.style.opacity = '0'
    }
    const land = () => {
      reset()
      const timing = { duration: LAND_MS, fill: 'forwards' }
      running = [
        enter.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1 }], {
          ...timing,
          easing: 'linear',
        }),
        // Travel: from far inside the screen toward you, slightly past the end point, then back
        rise.animate(
          [
            { transform: 'translateZ(-2400px) scale(0.3)' },
            { transform: 'translateZ(70px) scale(1)', offset: 0.8 },
            { transform: 'translateZ(0px) scale(1)' },
          ],
          { ...timing, easing: 'cubic-bezier(0.3, 0.45, 0.3, 1)' }
        ),
        // Spin: mostly a turn around the vertical axis with a gentle forward tilt and roll,
        // slowing down smoothly all the way to the landing instead of stopping early
        fly.animate(
          [
            { transform: 'rotateY(-540deg) rotateX(28deg) rotateZ(-14deg)' },
            { transform: 'rotateY(0deg) rotateX(0deg) rotateZ(0deg)' },
          ],
          { ...timing, easing: 'cubic-bezier(0.15, 0.55, 0.25, 1)' }
        ),
      ]
    }
    reset()
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? land() : reset()), {
      threshold: 0.35,
    })
    io.observe(root)
    return () => {
      io.disconnect()
      running.forEach((a) => a.cancel())
    }
  }, [reduced])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // A small toss and tilt on top of the turn, so the flip feels like a tumble
  const tumble = useCallback((dir, ms) => {
    const el = tiltRef.current
    if (!el || !el.animate) return
    el.animate(
      [
        { transform: 'rotateY(0deg) rotateZ(0deg) scale(1)' },
        { transform: `rotateY(${-16 * dir}deg) rotateZ(${5 * dir}deg) scale(0.84)`, offset: 0.5 },
        { transform: 'rotateY(0deg) rotateZ(0deg) scale(1)' },
      ],
      { duration: ms, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }
    )
  }, [])

  // Every kind of navigation goes through here, so the lock covers all of them
  const runSteps = useCallback(
    (dir, count) => {
      if (lockRef.current || N < 2) return
      const ms = count > 1 ? FAST_MS : MOVE_MS
      let done = 0
      lockRef.current = true
      setMoveMs(ms)
      // A single click adds one full vertical spin; jumping with the dots just turns quickly
      if (count === 1) {
        spinsRef.current += dir
        setSpins(spinsRef.current)
      }
      const tick = () => {
        stepRef.current += dir
        setStep(stepRef.current)
        if (!reduced) tumble(dir, ms)
        done += 1
        timerRef.current = setTimeout(
          done < count
            ? tick
            : () => {
                lockRef.current = false
              },
          ms
        )
      }
      tick()
    },
    [N, reduced, tumble]
  )

  const next = () => runSteps(1, 1)
  const prev = () => runSteps(-1, 1)
  const goTo = (target) => {
    let diff = mod(target - stepRef.current, N)
    if (diff > N / 2) diff -= N
    if (diff !== 0) runSteps(Math.sign(diff), Math.abs(diff))
  }

  // A click anywhere on the cube turns it to the next face (links inside it keep working)
  const onCubeClick = (e) => {
    if (e.target.closest('a')) return
    next()
  }

  const onKeyDown = (e) => {
    if (e.target.closest('a')) return
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') next()
    else if (e.key === 'ArrowLeft') prev()
    else return
    e.preventDefault()
  }

  const current = items[active]
  const tags = current.tags || []

  return (
    <div
      ref={rootRef}
      className="cc-stage"
      role="region"
      aria-roledescription="carousel"
      aria-label="Certifications"
    >
      {/* Small captions that change with each certification */}
      <ul aria-hidden="true" className="cc-caption cc-caption-a">
        {tags.slice(0, 3).map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <ul aria-hidden="true" className="cc-caption cc-caption-b">
        {tags.slice(3).concat([current.issuer]).map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <div
        ref={enterRef}
        className="cc-enter"
        role="button"
        tabIndex={0}
        aria-label="Turn to the next certification"
        onClick={onCubeClick}
        onKeyDown={onKeyDown}
      >
        <div className="cc-scene">
          <div ref={riseRef} className="cc-rise">
          <div ref={flyRef} className="cc-fly">
          <div ref={tiltRef} className="cc-tilt">
            <div
              className="cc-cube"
              style={{
                transform: `translateZ(calc(var(--size) / -2)) rotateX(${-(step * 90 + spins * 360)}deg)`,
                '--move': `${moveMs}ms`,
              }}
            >
              {Array.from({ length: SIDES }, (_, f) => {
                // 0 = facing you, 1 = turning in from the right, 3 = just left, 2 = behind
                const d = mod(f - step, SIDES)
                const item = items[mod(step + (d === 3 ? -1 : d), N)]
                const shown = d === 0
                return (
                  <div
                    key={f}
                    className="cc-face"
                    style={{ '--i': f }}
                    inert={!shown}
                    aria-hidden={shown ? undefined : 'true'}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${mod(step + (d === 3 ? -1 : d), N) + 1} of ${N}: ${item.title}`}
                  >
                    <div className="cc-card">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-semibold tracking-[0.2em] text-brand-soft">
                          {String(mod(step + (d === 3 ? -1 : d), N) + 1).padStart(2, '0')}
                          <span className="text-white/30"> / {String(N).padStart(2, '0')}</span>
                        </span>
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand-soft">
                          <Award size={18} aria-hidden="true" />
                        </span>
                      </div>

                      <h4 className="mt-4 font-display text-lg font-bold leading-snug text-white min-[400px]:text-xl sm:mt-5 sm:text-2xl">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.15em] text-brand-soft">
                        {item.issuer}
                      </p>
                      <p className="mt-auto pt-4 text-xs leading-relaxed text-ink/75 sm:text-sm">
                        {item.description}
                      </p>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-soft transition-colors hover:text-white"
                        >
                          View credential <ArrowUpRight size={14} aria-hidden="true" />
                          <span className="sr-only"> for {item.title} (opens in a new tab)</span>
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Top and bottom: built only from the real certification data */}
              <div className="cc-face cc-left" inert aria-hidden="true">
                <div className="cc-card">
                  <span className="font-display text-sm font-semibold tracking-[0.2em] text-brand-soft">
                    {String(N).padStart(2, '0')} CREDENTIALS
                  </span>
                  <ul className="mt-4 space-y-2 text-xs leading-snug text-ink/80 sm:text-sm">
                    {items.map((c) => (
                      <li key={c.id}>{c.short || c.title}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="cc-face cc-right" inert aria-hidden="true">
                <div className="cc-card">
                  <span className="font-display text-sm font-semibold tracking-[0.2em] text-brand-soft">
                    ISSUED BY
                  </span>
                  <ul className="mt-4 space-y-2 text-xs leading-snug text-ink/80 sm:text-sm">
                    {[...new Set(items.map((c) => c.issuer))].map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          </div>
          </div>
        </div>
      </div>

      {/* Progress dots: a click on the cube turns it, the dots jump straight to one */}
      {N > 1 && (
        <div className="cc-controls">
          {items.map((c, i) => (
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
                  i === active ? 'w-6 bg-brand-soft' : 'w-2 bg-white/25 hover:bg-white/50'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Announces changes, but only when the square is not turning by itself */}
      <p className="sr-only" aria-live="polite">
        {current.title}, {active + 1} of {N}
      </p>
    </div>
  )
}