import { useState } from 'react'
import { ArrowUpRight, ImageOff, Plus } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'
import { projectsContent, truthlens, foodBridge, showNextProjectSlot } from '../data/projects'

// Screenshot with a clean placeholder when the file is missing
function Shot({ src, alt, whole = false }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className="grid aspect-video w-full place-items-center bg-navy-900 text-muted">
        <div className="flex flex-col items-center gap-2 text-sm">
          <ImageOff size={24} aria-hidden="true" />
          Screenshot coming soon
        </div>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={whole ? 'block aspect-[2.1/1] w-full bg-navy-900 object-contain' : 'aspect-video w-full object-cover object-top'}
    />
  )
}

// GitHub and live links: only shown when a URL is set in projects.js
function Links({ links, name }) {
  if (!links.github && !links.live) return null
  const base =
    'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200'
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {links.live && (
        <a
          href={links.live}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} bg-brand text-white hover:bg-brand-soft hover:text-navy-950`}
        >
          Live demo <ArrowUpRight size={16} aria-hidden="true" />
          <span className="sr-only"> for {name} (opens in a new tab)</span>
        </a>
      )}
      {links.github && (
        <a
          href={links.github}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} border border-white/20 text-white hover:border-brand hover:bg-brand/10`}
        >
          <FaGithub size={16} aria-hidden="true" /> GitHub
          <span className="sr-only"> repository for {name} (opens in a new tab)</span>
        </a>
      )}
    </div>
  )
}

export default function Projects() {
  const [shot, setShot] = useState(0)
  const current = truthlens.screenshots[shot]
  const [fbShot, setFbShot] = useState(0)
  const fbCurrent = foodBridge.screenshots[fbShot]

  return (
    <section id="projects" className="bg-navy-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <div data-aos="fade-up" className="max-w-2xl">
          <p className="mb-4 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-muted sm:text-sm">
            {projectsContent.eyebrow}
            <span aria-hidden="true" className="h-px w-12 bg-brand" />
          </p>
          <h2 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            {projectsContent.heading}
          </h2>
        </div>

        {/* ---------- Featured: Veriqo ---------- */}
        <article
          data-aos="fade-up"
          className="mt-14 grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14"
        >
          {/* Screenshot in a browser frame */}
          <div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-900 shadow-2xl shadow-black/40">
              <div
                className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3"
                aria-hidden="true"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              </div>
              <Shot key={current.src} src={current.src} alt={current.alt} whole />
            </div>

            <div className="mt-4 flex gap-2" role="group" aria-label="Veriqo screenshots">
              {truthlens.screenshots.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setShot(i)}
                  aria-pressed={i === shot}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors duration-200 ${
                    i === shot
                      ? 'border-brand bg-brand/15 text-white'
                      : 'border-white/15 text-muted hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Story */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-soft">
              Featured · {truthlens.category}
            </p>
            <h3 className="mt-3 font-display text-4xl font-extrabold text-white sm:text-5xl">
              {truthlens.name}
            </h3>
            <p className="mt-4 font-lora text-lg leading-relaxed text-ink/85">
              {truthlens.summary}
            </p>

            <ol className="mt-8 space-y-4 border-l border-white/10 pl-6">
              {truthlens.pipeline.map((step, i) => (
                <li key={step.title} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute left-[-2.15rem] top-0.5 grid h-6 w-6 place-items-center rounded-full bg-navy-950 text-[11px] font-bold text-brand ring-1 ring-brand/60"
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-sm text-muted">{step.text}</p>
                </li>
              ))}
            </ol>

            {truthlens.contribution && (
              <p className="mt-6 text-sm leading-relaxed text-ink/85">
                <span className="font-semibold text-white">My contribution: </span>
                {truthlens.contribution}
              </p>
            )}

            <ul aria-label="Veriqo technologies" className="mt-6 flex flex-wrap gap-2">
              {truthlens.tech.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand-soft"
                >
                  {t}
                </li>
              ))}
            </ul>

            <Links links={truthlens.links} name={truthlens.name} />
          </div>
        </article>

        {/* ---------- Food Bridge: quieter, different layout ---------- */}
        <article
          data-aos="fade-up"
          className="mt-24 grid items-center gap-10 border-t border-white/10 pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14"
        >
          <div>
            <p className="font-display text-6xl font-extrabold text-white/10" aria-hidden="true">
              02
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-brand-soft">
              {foodBridge.category}
            </p>
            <h3 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">
              {foodBridge.name}
            </h3>
            <p className="mt-4 font-lora text-lg leading-relaxed text-ink/85">
              {foodBridge.summary}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink/80 sm:text-base">
              {foodBridge.description}
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
              {foodBridge.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
                  {f}
                </li>
              ))}
            </ul>

            {foodBridge.contribution && (
              <p className="mt-6 text-sm leading-relaxed text-ink/85">
                <span className="font-semibold text-white">My contribution: </span>
                {foodBridge.contribution}
              </p>
            )}

            <p className="mt-6 text-sm text-muted">
              <span className="sr-only">Built with: </span>
              {foodBridge.stack.join('  /  ')}
            </p>

            <Links links={foodBridge.links} name={foodBridge.name} />
          </div>

          <div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-900 shadow-2xl shadow-black/40">
              <div
                className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3"
                aria-hidden="true"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              </div>
              <Shot key={fbCurrent.src} src={fbCurrent.src} alt={fbCurrent.alt} whole />
            </div>

            <div className="mt-4 flex gap-2" role="group" aria-label="Food Bridge screenshots">
              {foodBridge.screenshots.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setFbShot(i)}
                  aria-pressed={i === fbShot}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors duration-200 ${
                    i === fbShot
                      ? 'border-brand bg-brand/15 text-white'
                      : 'border-white/15 text-muted hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </article>

        {/* ---------- Empty slot for a third project ---------- */}
        {showNextProjectSlot && (
          <div
            data-aos="fade-up"
            className="mt-20 flex items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 px-6 py-8 text-sm text-muted"
          >
            <Plus size={16} aria-hidden="true" />
            Next project in progress
          </div>
        )}
      </div>
    </section>
  )
}