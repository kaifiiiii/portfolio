export const educationContent = {
  eyebrow: '05 — Education',
  heading: 'Education and learning',
}

// Add a new entry by adding an object to this list. Empty fields are simply hidden.
export const education = [
  {
    id: 'btech',
    featured: true,
    level: 'B.Tech',
    title: 'Computer Science & Engineering',
    school: 'Jamia Hamdard, New Delhi',
    year: '2027',
    yearNote: 'Expected',
    result: 'CGPA 8.0',
  },
  {
    id: 'xii',
    level: 'Class XII',
    title: '',
    school: 'Church School, Beldih',
    year: '2023',
    yearNote: '',
    result: '80%',
  },
  {
    id: 'x',
    level: 'Class X',
    title: '',
    school: 'Church School, Beldih',
    year: '2021',
    yearNote: '',
    result: '85%',
  },
]

export const certificationsHeading = 'Certifications & participation'

// link: add a credential URL and a "View credential" link appears
// short: the word that scrolls across the 3D square. tags: small captions beside it. Both are optional.
export const certifications = [
  {
    id: 'tutedude',
    short: 'Generative AI',
    tags: ['AI fundamentals', 'Prompt engineering', 'LLMs', 'Practical AI applications'],
    title: 'Generative AI',
    issuer: 'Tutedude',
    description:
      'Hands-on learning in AI fundamentals, prompt engineering, LLMs, and practical AI applications.',
    link: '',
  },
  {
    id: 'forage',
    short: 'Data Analytics',
    tags: ['Exploratory data analysis', 'AI-driven risk profiling', 'Predictive analytics', 'Business data storytelling'],
    title: 'GenAI-Powered Data Analytics Job Simulation',
    issuer: 'Forage',
    description:
      'Practical tasks in exploratory data analysis, AI-driven risk profiling, predictive analytics, and business data storytelling.',
    link: '',
  },
  {
    id: 'hacktoberfest',
    short: 'Open Source',
    tags: ['Open-source collaboration', 'Software engineering practices'],
    title: 'Hacktoberfest: Open Source and Engineers',
    issuer: 'Microsoft Learn Student Ambassador',
    description:
      'Exposure to open-source collaboration and software engineering practices.',
    link: '',
  },
  {
    id: 'hplife',
    short: 'Data Science',
    tags: ['Data science', 'Analytics methodologies', 'Data-driven business'],
    title: 'Data Science & Analytics',
    issuer: 'HP LIFE (HP Foundation)',
    description:
      'Foundational learning in data science, analytics methodologies, and data-driven business approaches.',
    link: '',
  },
]
