import { CodeXml } from 'lucide-react'
import { orbitSkills } from '../data/skillShowcase'
import useInView from '../hooks/useInView'

// Angles of the small dots on the ring around the centre circle
const DOTS = [0, 72, 144, 216, 288]

// Part 1: the heading, a still centre circle, and badges that travel around it.
export default function SkillsOrbit() {
  // seen    -> play the entrance once
  // visible -> pause the orbit whenever this block is off screen
  const [ref, { seen, visible }] = useInView({ threshold: 0.15 })

  return (
    <div ref={ref} className={`${seen ? 'sk-in' : ''} ${visible ? '' : 'sk-paused'}`}>
      {/* Heading: stays still */}
      <div className="text-center">
        <p
          style={{ '--d': '0s' }}
          className="sk-head mb-4 flex items-center justify-center gap-4 text-xs font-medium uppercase tracking-[0.22em] text-muted sm:text-sm sm:tracking-[0.35em]"
        >
          <span aria-hidden="true" className="h-px w-6 bg-brand/70 sm:w-16" />
          Technical expertise
          <span aria-hidden="true" className="h-px w-6 bg-brand/70 sm:w-16" />
        </p>
        <h2
          style={{ '--d': '0.12s' }}
          className="sk-head font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl"
        >
          <span className="text-white">My </span>
          <span className="bg-linear-to-r from-[#38BDF8] to-[#8B5CF6] bg-clip-text text-transparent">
            Skills
          </span>
        </h2>
        <p
          style={{ '--d': '0.24s' }}
          className="sk-head mx-auto mt-5 max-w-xl text-sm text-muted sm:text-base"
        >
          Building intelligent solutions through code, creativity, and continuous learning.
        </p>
      </div>

      {/* The centre never moves; only the ring of badges turns */}
      <div className="orbit-stage mt-12 sm:mt-16" style={{ '--n': orbitSkills.length }}>
        <div aria-hidden="true" className="orbit-rings">
          <span className="orbit-ring orbit-ring-outer" />
          <span className="orbit-ring orbit-ring-path" />
          <span className="orbit-ring orbit-ring-b" />
          <span className="orbit-ring orbit-ring-a" />
          {DOTS.map((a) => (
            <span key={a} className="orbit-dot" style={{ '--a': `${a}deg` }} />
          ))}
        </div>

        <div className="orbit-core">
          <div className="orbit-core-body">
            <CodeXml aria-hidden="true" className="orbit-code" strokeWidth={1.6} />
            <p className="orbit-core-title">
              Engineer
              <br />
              in progress
            </p>
            <span aria-hidden="true" className="orbit-core-rule" />
            <p className="orbit-core-caption">Learning. Building. Evolving.</p>
          </div>
        </div>

        <ul aria-label="Technologies I work with" className="orbit-spin">
          {orbitSkills.map(({ name, Icon, color }, i) => (
            <li
              key={name}
              className="orbit-slot"
              style={{ '--a': `${(360 / orbitSkills.length) * i}deg`, '--i': i }}
            >
              <div className="orbit-up">
                <div className="orbit-counter">
                  <div className="orbit-badge">
                    <div className="badge-face">
                      <span className="badge-icon">
                        <Icon aria-hidden="true" className="h-full w-full" style={{ color }} />
                      </span>
                      <span className="badge-label">{name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

