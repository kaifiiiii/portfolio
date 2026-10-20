import { useEffect, useRef, useState } from 'react'
import CertificationCube from './CertificationCube'
import {
  educationContent,
  education,
  certificationsHeading,
  certifications,
} from '../data/education'

const N = education.length
const PIN_TOP = 96 // gap under the fixed navbar while the list is pinned
const VH_PER_ROW = 45 // scroll distance per row, in viewport heights

export default function Education() {
  const trackRef = useRef(null)
  const stickyRef = useRef(null)
  const [active, setActive] = useState(0)
  const [pinned] = useState(
    () => N > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  // The list stays pinned while you scroll; the highlight moves down one row at a time as
  // you scroll down, and back up one row at a time as you scroll up.
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
      const p = Math.min(1, Math.max(0, (PIN_TOP - rect.top) / travel))
      const idx = Math.min(N - 1, Math.floor(p * N))
      setActive((prev) => (prev === idx ? prev : idx))
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

  return (
    <section id="education" className="relative bg-navy-900 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Tall track: gives the scroll distance that moves the highlight */}
        <div
          ref={trackRef}
          style={pinned ? { height: `calc(100vh + ${(N - 1) * VH_PER_ROW}vh)` } : undefined}
        >
          <div
            ref={stickyRef}
            style={pinned ? { position: 'sticky', top: PIN_TOP } : undefined}
          >
            {/* Heading */}
            <div data-aos="fade-up" className="max-w-2xl">
              <p className="mb-4 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-muted sm:text-sm">
                {educationContent.eyebrow}
                <span aria-hidden="true" className="h-px w-12 bg-brand" />
              </p>
              <h2 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                {educationContent.heading}
              </h2>
            </div>

            {/* Education: one ruled row per level; the blue highlight follows your scroll */}
            <ul className="mt-14 border-b border-white/10">
              {education.map((item, i) => {
                const on = i === active
                return (
                  <li
                    key={item.id}
                    aria-current={on ? 'true' : undefined}
                    className={`relative grid gap-x-8 gap-y-3 border-t py-7 transition-colors duration-500 sm:grid-cols-[8rem_1fr_auto] sm:items-center ${
                      on ? 'border-brand/40' : 'border-white/10'
                    }`}
                  >
                    {/* Blue marker that slides to whichever row is active */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-0 -left-4 w-0.5 origin-center rounded-full bg-brand transition-all duration-500 ${
                        on ? 'scale-y-100 opacity-100 shadow-[0_0_18px_rgba(29,139,255,0.9)]' : 'scale-y-0 opacity-0'
                      }`}
                    />
                    <div>
                      <p
                        className={`font-display text-5xl font-extrabold leading-none transition-colors duration-500 ${
                          on ? 'text-brand' : 'text-white/25'
                        }`}
                      >
                        {item.year}
                      </p>
                      {item.yearNote && (
                        <p className="mt-1.5 text-xs uppercase tracking-[0.2em] text-muted">
                          {item.yearNote}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-soft">
                        {item.level}
                      </p>
                      <h3
                        className={`mt-1 font-display text-2xl font-bold transition-colors duration-500 sm:text-3xl ${
                          on ? 'text-white' : 'text-white/55'
                        }`}
                      >
                        {item.title || item.school}
                      </h3>
                      {item.title && (
                        <p className={`mt-1 transition-colors duration-500 ${on ? 'text-ink/80' : 'text-ink/40'}`}>
                          {item.school}
                        </p>
                      )}
                    </div>

                    {item.result && (
                      <p
                        className={`justify-self-start rounded-full border px-4 py-1.5 font-display text-sm font-semibold transition-all duration-500 sm:justify-self-end ${
                          on
                            ? 'border-brand/50 bg-brand/15 text-white shadow-[0_0_24px_-6px_rgba(29,139,255,0.8)]'
                            : 'border-white/15 text-ink/60'
                        }`}
                      >
                        {item.result}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-24">
          <h3
            data-aos="fade-up"
            className="mb-8 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-muted sm:text-sm"
          >
            {certificationsHeading}
            <span aria-hidden="true" className="h-px w-12 bg-brand" />
          </h3>

          <div data-aos="fade-up">
            <CertificationCube items={certifications} />
          </div>
        </div>
      </div>
    </section>
  )
}