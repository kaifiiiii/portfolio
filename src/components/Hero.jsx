import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Play, Square } from 'lucide-react'
import { heroContent, introScript, techStack } from '../data/hero'

const AVATAR_VIDEO = '/videos/intro-avatar.mp4'

// Where each sentence ends, as a fraction (0 to 1) of the whole script length.
const totalChars = introScript.join(' ').length
let running = 0
const sentenceEnds = introScript.map((line) => (running += line.length + 1) / totalChars)

// NEW: elements the cursor box should not cover or react to
const INTERACTIVE = 'a, button, ul'

export default function Hero() {
  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [activeLine, setActiveLine] = useState(-1)
  const [audioError, setAudioError] = useState(false)
  // true when the avatar video file is missing: we fall back to image + audio
  const [videoFailed, setVideoFailed] = useState(false)

  // NEW: cursor-following box
  const cursorRef = useRef(null)
  const target = useRef({ x: 0, y: 0 }) // where the mouse is
  const current = useRef({ x: 0, y: 0 }) // where the box is (it eases toward the mouse)
  const [cursorOn, setCursorOn] = useState(false)

  // The element that actually plays: the video if we have it, else the audio
  const getMedia = () => (videoFailed ? audioRef.current : videoRef.current)

  useEffect(() => {
    const audio = audioRef.current
    const video = videoRef.current
    return () => {
      audio?.pause()
      video?.pause()
    }
  }, [])

  // NEW: animation loop, only runs while the box is visible
  useEffect(() => {
    if (!cursorOn) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame
    const tick = () => {
      const c = current.current
      const t = target.current
      const ease = reduce ? 1 : 0.18
      c.x += (t.x - c.x) * ease
      c.y += (t.y - c.y) * ease
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [cursorOn])

  const toggleIntro = async () => {
    const media = getMedia()
    if (!media) return

    if (playing) {
      media.pause()
      media.currentTime = 0
      setPlaying(false)
      setActiveLine(-1)
      return
    }

    try {
      setAudioError(false)
      setStarted(true)
      setActiveLine(0)
      await media.play()
      setPlaying(true)
    } catch {
      setAudioError(true)
      setPlaying(false)
    }
  }

  const handleTimeUpdate = (e) => {
    const media = e.currentTarget
    if (!media.duration) return
    const progress = media.currentTime / media.duration
    const index = sentenceEnds.findIndex((end) => progress <= end)
    setActiveLine(index === -1 ? introScript.length - 1 : index)
  }

  const handleEnded = (e) => {
    e.currentTarget.currentTime = 0
    setPlaying(false)
    setActiveLine(-1)
  }

  const handleVideoError = () => {
    setVideoFailed(true)
    setPlaying(false)
  }

  // NEW: mouse handlers for the cursor box (mouse only, not touch or pen)
  const handlePointerMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left + 18
    const y = e.clientY - rect.top + 18
    target.current = { x, y }
    const overControl = Boolean(e.target.closest(INTERACTIVE))
    if (!cursorOn && !overControl) {
      current.current = { x, y } // appear at the mouse instead of flying in
    }
    setCursorOn(!overControl)
  }

  const handlePointerLeave = () => setCursorOn(false)

  const handleSectionClick = (e) => {
    if (!cursorOn) return // touch taps and clicks on controls do nothing here
    if (e.target.closest(INTERACTIVE)) return
    toggleIntro()
  }

  return (
    <section
      id="home"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleSectionClick}
      className="relative flex min-h-screen items-center overflow-hidden bg-navy-950 pt-24 pb-16 lg:pt-20"
    >
      {/* ---------- Full-screen background scene ---------- */}
      <div className="absolute inset-0">
        {/* Still image: always there, shown when the video is not playing */}
        <img
          src="/images/hero-character.png"
          alt="Illustration of Kaif, a developer with a beard and headphones wearing a black hoodie, sitting at a desk with code on the monitors"
          className={`${
            videoFailed ? 'hero-drift' : ''
          } h-full w-full object-cover object-[78%_center]`}
          fetchPriority="high"
        />

        {/* Talking avatar video: fades in while the intro plays */}
        {!videoFailed && (
          <video
            ref={videoRef}
            src={AVATAR_VIDEO}
            poster="/images/hero-character.png"
            preload="metadata"
            playsInline
            aria-hidden="true"
            tabIndex={-1}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleVideoError}
            className={`absolute inset-0 h-full w-full object-cover object-[78%_center] transition-opacity duration-300 ${
              playing ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Phones and tablets: dim the whole scene so text stays readable */}
        <div aria-hidden="true" className="absolute inset-0 bg-navy-950/70 lg:hidden" />

        {/* Desktop: fade the left side into the page, behind the text */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-linear-to-r from-navy-950 via-navy-950/60 via-45% to-transparent to-70% lg:block"
        />

        {/* Fade under the navbar */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-navy-950/90 to-transparent"
        />

        {/* Fade into the next section */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-navy-950 to-transparent"
        />
      </div>

      {/* ---------- Content on top ---------- */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
                    <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
                        Open to full-time roles
          </p>
          <p className="mb-4 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-muted sm:text-sm">
            {heroContent.eyebrow}
            <span aria-hidden="true" className="hidden h-px w-16 bg-brand sm:block" />
          </p>

          <h1 className="font-display font-extrabold leading-[0.95]">
            <span className="block text-5xl text-white sm:text-6xl lg:text-7xl">
              {heroContent.greeting}
            </span>
            <span className="block text-7xl text-brand sm:text-8xl lg:text-9xl">
              {heroContent.name}
            </span>
            <span className="mt-3 block text-2xl text-white sm:text-3xl lg:text-4xl">
              <span className="text-brand">{heroContent.roleAccent}</span> {heroContent.role}
            </span>
          </h1>

          {/* Description in Lora */}
          <p className="mt-6 max-w-xl font-lora text-lg leading-relaxed text-ink/80 sm:text-xl">
            {heroContent.description}
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#projects"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-soft hover:text-navy-950"
            >
              Explore My Work <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-brand px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand/15"
            >
              Get In Touch
            </a>
          </div>

          {/* Intro voice */}
          <div className="mt-5">
            <button
              type="button"
              onClick={toggleIntro}
              aria-pressed={playing}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-ink backdrop-blur transition-colors duration-200 hover:border-brand hover:text-white"
            >
              {playing ? (
                <>
                  <Square size={16} aria-hidden="true" /> Stop intro
                </>
              ) : (
                <>
                  <Play size={16} aria-hidden="true" /> Hear my intro
                </>
              )}
            </button>
            <span className="ml-3 text-xs text-muted">AI-generated voice and avatar</span>

            {/* Captions in Lora, italic */}
            <div
              aria-live="polite"
              className="mt-4 max-w-xl font-lora text-base italic leading-relaxed"
            >
              {audioError && (
                <p className="text-amber-300">
                  The intro isn't available yet. Check public/videos/intro-avatar.mp4 or
                  public/audio/intro.mp3.
                </p>
              )}
              {started && !audioError && (
                <p>
                  {introScript.map((line, i) => (
                    <span
                      key={i}
                      className={`transition-colors duration-300 ${
                        i === activeLine ? 'text-white' : 'text-muted/70'
                      }`}
                    >
                      {line}{' '}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>

          {/* Tech icons: one row, below the buttons */}
                    {/* Tech icons: one row, below the buttons */}
          <ul
            aria-label="Technologies I work with"
            className="mt-8 flex max-w-xl flex-wrap justify-between gap-x-2 gap-y-2 rounded-2xl border border-white/10 bg-navy-900/60 px-3 py-3 backdrop-blur"
          >
            {techStack.map(({ name, Icon, color }) => (
              <li
                key={name}
                style={{ '--glow': color }}
                className="tech-item flex flex-col items-center gap-1.5"
              >
                <Icon size={30} style={{ color }} aria-hidden="true" className="tech-icon" />
                <span className="text-xs text-muted transition-colors duration-200">{name}</span>
              </li>
            ))}
          </ul>
          
        </div>
      </div>

      {/* NEW: the box that follows the mouse. Decorative: the real button above is the accessible one. */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-20"
      >
        <span
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/40 transition-all duration-200 ${
            cursorOn ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}
        >
          {playing ? (
            <>
              <Square size={14} /> Stop intro
            </>
          ) : (
            <>
              <Play size={14} /> Hear my intro
            </>
          )}
        </span>
      </div>

      {/* "Speaking" badge, bottom right of the screen */}
      {playing && (
        <span className="absolute bottom-8 right-5 z-10 inline-flex items-center gap-2 rounded-full bg-navy-900/80 px-3 py-1 text-xs text-ink backdrop-blur sm:right-8">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden="true" />
          Speaking
        </span>
      )}

      {/* Audio fallback: only used when the avatar video file is missing */}
      {videoFailed && (
        <audio
          ref={audioRef}
          src="/audio/intro.mp3"
          preload="none"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={() => {
            setAudioError(true)
            setPlaying(false)
          }}
        />
      )}
    </section>
  )
}