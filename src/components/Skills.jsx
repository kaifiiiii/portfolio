import SkillsOrbit from './SkillsOrbit'
import SkillsCarousel from './SkillsCarousel'

// One section, two connected stages: the orbit first, the category carousel below it.
export default function Skills() {
  return (
    <section id="skills" className="skills-section relative overflow-hidden bg-[#050914] py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SkillsOrbit />
        <SkillsCarousel />
      </div>
    </section>
  )
}
