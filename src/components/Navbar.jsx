import { useEffect, useState } from 'react'
import { Download, Menu, X } from 'lucide-react'
import { navLinks } from '../data/navLinks'

const RESUME_URL = '/Kaif-Resume.pdf'

export default function Navbar() {
  const [open, setOpen] = useState(false) // mobile menu open?
  const [scrolled, setScrolled] = useState(false) // page scrolled a bit?
  const [active, setActive] = useState('home') // section currently on screen

  // Add a background to the navbar once the user scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Highlight the link of the section in the middle of the screen
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
    return () => observer.disconnect()
  }, [])

  // While the mobile menu is open: Escape closes it and the page can't scroll behind it
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

  const linkClass = (id) =>
    `relative py-1 text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:bg-brand after:transition-all after:duration-300 ${
      active === id
        ? 'text-brand after:w-full'
        : 'text-ink/80 hover:text-white after:w-0 hover:after:w-full'
    }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? 'border-b border-white/10 bg-navy-950/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8"
      >
        {/* Wordmark */}
        <a href="#home" className="flex items-center gap-2" aria-label="Kaif, back to top">
          <span className="font-display text-3xl font-extrabold leading-none text-brand">K</span>
          <span className="font-display text-lg font-bold tracking-[0.2em]">KAIF</span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className={linkClass(link.id)}
                aria-current={active === link.id ? 'page' : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop resume button */}
        <a
          href={RESUME_URL}
          download="Kaif-Resume.pdf"
          className="hidden items-center gap-2 rounded-full border border-brand px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand lg:inline-flex"
        >
          Resume <Download size={16} aria-hidden="true" />
        </a>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="rounded-md p-2 text-ink transition-colors hover:text-brand lg:hidden"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Mobile menu panel */}
      {open && (
        <div id="mobile-menu" className="border-t border-white/10 lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-5 py-4 sm:px-8">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={() => setOpen(false)}
                  aria-current={active === link.id ? 'page' : undefined}
                  className={`block py-3 text-base font-medium transition-colors ${
                    active === link.id ? 'text-brand' : 'text-ink/90 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-3">
              <a
                href={RESUME_URL}
                download="Kaif-Resume.pdf"
                className="inline-flex items-center gap-2 rounded-full border border-brand px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand"
              >
                Resume <Download size={16} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}