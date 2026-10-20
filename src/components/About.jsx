import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { aboutContent } from '../data/about'

const { chapters } = aboutContent

export default function About() {
  const [active, setActive] = useState(-1) // -1 means every card is closed

  return (
    <section id="about" className="relative overflow-x-clip bg-navy-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <div data-aos="fade-up" className="max-w-3xl">
          <p className="mb-3 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-muted sm:text-sm">
            {aboutContent.eyebrow}
            <span aria-hidden="true" className="h-px w-12 bg-brand" />
          </p>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            {aboutContent.heading}
          </h2>
          <p className="mt-3 text-sm text-muted">
            <span className="hidden lg:inline">Hover over a card to open it.</span>
            <span className="lg:hidden">Tap a card to open it.</span>
          </p>
        </div>

        {/* Cards: slide in from the left one by one, closed until touched */}
        <ul
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setActive(-1) // mouse leaves: close everything
          }}
          className="mt-12 grid gap-4 lg:grid-cols-4 lg:items-start"
        >
          {chapters.map((chapter, i) => {
            const Icon = chapter.Icon
            const isActive = i === active
            return (
              // AOS animates this wrapper, so it never fights the card's own transitions
                           <li
                key={chapter.id}
                data-aos="fade-right"
                data-aos-duration="1000"
                data-aos-easing="ease-out-cubic"
                data-aos-delay={i * 150}
                data-aos-once="false"
                data-aos-mirror="true"
                data-aos-offset="120"
                className="will-change-transform"
              >
                <article
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') setActive(i)
                  }}
                  className={`relative overflow-hidden rounded-2xl border transition-[border-color,background-color,box-shadow] duration-500 ${
                    isActive
                      ? 'border-brand/60 bg-navy-900/80 shadow-lg shadow-brand/10'
                      : 'border-white/10 bg-navy-900/40'
                  }`}
                >
                  {/* Top block: always visible */}
                  <button
                    type="button"
                    id={`about-card-${i}`}
                    aria-expanded={isActive}
                    aria-controls={`about-desc-${i}`}
                    onClick={(e) => {
                      // Mouse: hover already opened it, so keep it open.
                      // Touch and keyboard: tap again to close.
                      if (e.nativeEvent.pointerType === 'mouse') setActive(i)
                      else setActive((a) => (a === i ? -1 : i))
                    }}
                    onFocus={(e) => {
                      // Only keyboard focus opens a card (a tap also focuses it)
                      if (e.currentTarget.matches(':focus-visible')) setActive(i)
                    }}
                    className="relative flex w-full flex-row items-center gap-4 px-5 py-5 text-left lg:h-60 lg:flex-col lg:justify-center lg:gap-5 lg:px-6 lg:text-center"
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(29,139,255,0.28),transparent_65%)] transition-opacity duration-500 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    <span
                      className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition-all duration-500 lg:h-20 lg:w-20 ${
                        isActive
                          ? 'scale-105 border-brand bg-brand text-white'
                          : 'border-white/10 bg-brand/10 text-brand-soft'
                      }`}
                    >
                      <Icon size={28} aria-hidden="true" />
                    </span>

                    <span className="relative">
                      <span className="block font-display text-xs tracking-[0.3em] text-brand-soft">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="mt-1 block font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
                        {chapter.label}
                      </span>
                    </span>

                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={`relative ml-auto shrink-0 transition-transform duration-500 lg:order-first lg:ml-0 ${
                        isActive ? 'rotate-180 text-brand-soft' : 'text-muted'
                      }`}
                    />
                  </button>

                  {/* Slides down: the card grows in height, then the text drops in */}
                  <div
                    id={`about-desc-${i}`}
                    role="region"
                    aria-labelledby={`about-card-${i}`}
                    aria-hidden={!isActive}
                    className={`overflow-hidden transition-[max-height,opacity] duration-700 ease-in-out ${
                      isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p
                      className={`border-t border-white/10 px-5 pb-7 pt-5 font-lora text-sm leading-relaxed text-ink/90 transition-all duration-700 ease-out lg:px-6 ${
                        isActive
                          ? 'translate-y-0 opacity-100 delay-150'
                          : '-translate-y-6 opacity-0'
                      }`}
                    >
                      {chapter.text}
                    </p>
                  </div>

                  {/* Bar at the bottom edge grows when active */}
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-brand transition-all duration-700 ${
                      isActive ? 'w-1/2' : 'w-0'
                    }`}
                  />
                </article>
              </li>
            )
          })}
        </ul>

        {/* Quick facts */}
        <dl data-aos="fade-up" className="mt-16 grid gap-x-10 gap-y-2 sm:grid-cols-2">
          {aboutContent.facts.map((fact) => (
            <div
              key={fact.label}
              className="border-l-2 border-white/10 py-3 pl-4 transition-all duration-200 hover:border-brand hover:pl-6"
            >
              <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                {fact.label}
              </dt>
              <dd className="mt-1 text-ink">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}