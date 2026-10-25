import { useCallback, useEffect, useState } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Navbar from './components/Navbar'
import IntroLanding from './components/IntroLanding'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Education from './components/Education'
import Contact from './components/Contact'
import Chatbot from './components/chatbot'
import CursorRingField from './components/CursorRingField'
import { navLinks } from './data/navLinks'

// Sections that are still temporary placeholders
const done = ['home', 'about', 'skills', 'projects', 'experience', 'education', 'contact']
const placeholders = navLinks.filter((link) => !done.includes(link.id))

const FIELD_COLORS = { items: ['#6cb4ff', '#1d8bff', '#0a1226'] }

export default function App() {
  const [fieldOn, setFieldOn] = useState(false) // animated background allowed?
  const [density, setDensity] = useState(160)
  const [paused, setPaused] = useState(true) // true while the hero covers the screen
  const [introDone, setIntroDone] = useState(false) // navbar and chatbot wait for the intro

  // Intro finished (or skipped): reveal the page and let scroll animations re-measure
  const handleIntroDone = useCallback(() => {
    setIntroDone(true)
    requestAnimationFrame(() => AOS.refreshHard())
  }, [])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    AOS.init({
      duration: 700,
      easing: 'ease-out',
      once: true,
      offset: 60,
      disable: reduceMotion,
    })
    // No animated field for people who ask for less motion
    setFieldOn(!reduceMotion)
    // Fewer points on phones
    setDensity(window.innerWidth < 768 ? 100 : 160)
  }, [])

  // Stop drawing the field while the hero is hiding it
  useEffect(() => {
    const onScroll = () => setPaused(window.scrollY < window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {fieldOn && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <CursorRingField
            background="#050a16"
            colors={FIELD_COLORS}
            density={density}
            paused={paused}
          />
        </div>
      )}

      {introDone && (
        <div className="intro-fade-in">
          <Navbar />
        </div>
      )}
      <main className={`relative z-10 ${fieldOn ? 'field-on' : ''}`}>
        <IntroLanding onDone={handleIntroDone} />
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Education />
        <Contact />
        {placeholders.map((link, i) => (
          <section
            key={link.id}
            id={link.id}
            className={`flex min-h-screen items-center justify-center px-5 ${
              i % 2 === 0 ? 'bg-navy-900' : 'bg-navy-950'
            }`}
          >
            <h2 className="font-display text-4xl font-bold">
              {link.label} <span className="text-brand">section</span>
            </h2>
          </section>
        ))}
      </main>

      {introDone && (
        <div className="intro-fade-in" style={{ zIndex: 60 }}>
          <Chatbot />
        </div>
      )}
    </>
  )
}
