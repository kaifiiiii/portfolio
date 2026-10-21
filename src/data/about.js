import { GraduationCap, Code, Sparkles, Briefcase } from 'lucide-react'

export const aboutContent = {
  eyebrow: '01 — About',
  heading: 'Building for the web, curious about AI.',
  hint: 'Pick a topic to read more.',
  chapters: [
    {
      id: 'background',
      label: 'Background',
      Icon: GraduationCap,
      text: "I'm a B.Tech student in Computer Science and Engineering at Jamia Hamdard, New Delhi, expected to graduate in 2027. My foundation covers Java, data structures and algorithms, DBMS, operating systems and SQL, which helps me write software that is dependable as well as functional.",
    },
    {
      id: 'web',
      label: 'Web development',
      Icon: Code,
      text: 'I build full stack web applications, from the interface to the server and database. Food Bridge connects food donors with NGOs and includes role-based dashboards, notifications and ratings, built with Node.js, Express.js and MySQL. On the front end I work with React, HTML, CSS and JavaScript.',
    },
    {
      id: 'genai',
      label: 'Generative AI',
      Icon: Sparkles,
      text: 'I apply Generative AI to practical problems. Veriqo, my AI-powered misinformation verification system, combines retrieval-augmented generation (RAG), ChromaDB, live web search and LLM-based analysis through API integration to help evaluate claims against evidence. I have also completed a Generative AI course covering prompt engineering and LLMs.',
    },
    {
      id: 'open',
      label: 'Open to work',
      Icon: Briefcase,
      text: "In September 2026 I completed a project-based Data Analytics internship with Edunet Foundation (VOIS for Tech), using Python and data visualization on HR, agriculture, and business datasets and finishing an independent analytics project under mentor guidance. I'm now open to full-time roles as a full stack web developer, and I'd welcome a conversation.",
    },
  ],
  facts: [
    { label: 'Studying', value: 'B.Tech Computer Science, Jamia Hamdard' },
    { label: 'Focus', value: 'Full stack web development' },
    { label: 'Exploring', value: 'Generative AI' },
    { label: 'Experience', value: 'Data Analytics Intern, Edunet Foundation (Aug – Sep 2026)' },
    { label: 'Status', value: 'Open to full-time roles' },
  ],
}
