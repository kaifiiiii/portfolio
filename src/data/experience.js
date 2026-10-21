export const experienceContent = {
  eyebrow: '04 — Experience',
  heading: 'Experience and leadership',
}

// Add a new role by adding an object to this list. Empty fields are simply hidden.
export const experience = [
  {
    id: 'edunet',
    type: 'Internship',
    role: 'Data Analytics Intern',
    org: 'Edunet Foundation | VOIS for Tech Program',
    period: 'Aug 2026 – Sep 2026',
    status: 'Completed',
    bullets: [
      'Selected for a project-based internship focused on data analytics.',
      'Worked with Python, data visualization and dataset analysis across HR, agriculture, and business/operations datasets.',
      'Completed an independent analytics project under mentor guidance.',
      'Took part in technical learning sessions and project-based activities.',
    ],
  },
  {
    id: 'nsdc',
    type: 'Society',
    role: 'Tech Lead',
    org: 'NSDC Society',
    period: '', // add the dates, for example 'Jan 2026 – Present'
    status: '',
    description:
      "Lead the society's tech team, guiding members on technical work and helping turn ideas into working projects.",
    bullets: [], // add one line per responsibility
  },
  {
    id: 'gfg',
    type: 'Society',
    role: 'Tech Team Member',
    org: 'GeeksforGeeks Society',
    period: '',
    status: '',
    description:
      'Part of the technical team at the GeeksforGeeks Society, contributing to technical activities and learning and building alongside fellow members in programming and development.',
    bullets: [],
  },
]
