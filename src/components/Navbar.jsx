import { useCallback, useEffect, useState } from 'react'
import { Download, Menu, X } from 'lucide-react'
import { navLinks } from '../data/navLinks'
import './Navbar.css'

const RESUME_URL = '/Kaif-Resume.pdf'

// Links shared by the desktop sidebar and the mobile drawer.
// The slim indicator is one element that slides to the active row (see Navbar.css).
function NavItems({ active, activeIndex, onNavigate, variant }) {
  return (
    <ul
      className={`snav-list ${variant === 'row' ? 'snav-list--row' : ''}`}
      style={{ '--i': Math.max(activeIndex, 0) }}
      data-none={activeIndex < 0 ? '' : undefined}
    >
      <li className="snav-indicator" aria-hidden="true" role="presentation" />
      {navLinks.map((link) => (
        <li key={link.id}>
          <a
            href={`#${link.id}`}
            onClick={(e) => onNavigate(e, link.id)}
            className="snav-link"
            aria-current={active === link.id ? 'page' : undefined}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

function ResumeLink() {
  return (
    <a href={RESUME_URL} download="Kaif-Resume.pdf" className="snav-resume">
      <span className="snav-resume-icon">
        <Download size={16} aria-hidden="true" />
      </span>
      <span>Resume</span>
    </a>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false) // mobile drawer open?
  const [active, setActive] = useState('home') // section currently on screen
  const activeIndex = navLinks.findIndex((link) => link.id === active)

  // Desktop sidebar: hidden until the cursor reaches the left edge, hidden again when it leaves
  const [hovered, setHovered] = useState(false)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const expanded = hovered || keyboardFocus

  // Highlight the link of the section across the middle of the screen
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.getElementById(link.id))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' } // a thin band across the screen middle
    )
    sections.forEach((section) => observer.observe(section))

    // At the very bottom the last section may never reach the middle band
    const last = navLinks[navLinks.length - 1].id
    const onScroll = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      if (atBottom) setActive(last)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // While the mobile drawer is open: Escape closes it and the page can't scroll behind it
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  // Smooth scroll to the section. If the section is missing the browser follows the hash.
  const goTo = useCallback((e, id) => {
    const target = document.getElementById(id)
    if (!target) return
    e.preventDefault()
    document.body.style.overflow = '' // release the drawer's scroll lock first
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${id}`)
    setActive(id)
    setOpen(false)
  }, [])

  return (
    <>
      {/* Mouse screens: invisible until the cursor reaches the left edge (a thin strip of this
          element stays on screen as the hover target) */}
      <nav
        aria-label="Main"
        className="snav"
        data-expanded={expanded ? '' : undefined}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={(e) => e.target.matches(':focus-visible') && setKeyboardFocus(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setKeyboardFocus(false)
        }}
      >
        <a href="#home" onClick={(e) => goTo(e, 'home')} className="snav-logo" aria-label="Kaif, back to top">
          K
        </a>
        <NavItems active={active} activeIndex={activeIndex} onNavigate={goTo} variant="stack" />
        <ResumeLink />
      </nav>

      {/* Touch screens and phones: compact button that opens a slide-in drawer */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="snav-toggle"
      >
        {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>

      <div id="mobile-menu" className="snav-drawer" data-open={open ? '' : undefined}>
        <button type="button" className="snav-scrim" tabIndex={-1} aria-label="Close menu" onClick={() => setOpen(false)} />
        <nav aria-label="Main" className="snav-panel">
          <a href="#home" onClick={(e) => goTo(e, 'home')} className="snav-wordmark" aria-label="Kaif, back to top">
            <span className="snav-wordmark-k">K</span>
            <span>KAIF</span>
          </a>
          <NavItems active={active} activeIndex={activeIndex} onNavigate={goTo} variant="row" />
          <ResumeLink />
        </nav>
      </div>
    </>
  )
}
