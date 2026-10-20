import { truthlensUi, truthlensResult } from './truthlensImages'
import { foodbridgeHome, foodbridgeDashboard } from './foodbridgeImages'

export const projectsContent = {
  eyebrow: '03 — Projects',
  heading: 'Things I have built',
}

export const truthlens = {
  name: 'Veriqo',
  category: 'Full Stack / Generative AI',
  summary:
    'An AI-powered misinformation verification system that evaluates claims using retrieved evidence, live web search and LLM analysis, then explains the verdict with sources.',
  pipeline: [
    { title: 'Submit a claim', text: 'Paste a text claim or a YouTube link.' },
    { title: 'Classify', text: 'An ML classifier gives an initial label with a confidence score.' },
    { title: 'Retrieve evidence', text: 'Top-k semantic search finds the most relevant sources.' },
    {
      title: 'Explain',
      text: 'An AI-generated explanation, grounded in the evidence, with the sources listed.',
    },
  ],
  tech: ['Python', 'RAG', 'ChromaDB', 'Groq API', 'Tavily API', 'LLMs'],
  contribution: '',
  links: {
    github: '',
    live: 'https://truthlens-eight-blue.vercel.app',
  },
  screenshots: [
    {
      label: 'Interface',
      src: truthlensUi,
      alt: 'Veriqo home screen with a text claim and YouTube input and a Verify button',
    },
    {
      label: 'Result',
      src: truthlensResult,
      alt: 'Veriqo verification result with verdict, confidence, explanation and evidence tabs',
    },
  ],
}

export const foodBridge = {
  name: 'Food Bridge',
  category: 'Full Stack Web Application',
  summary:
    'A full-stack platform that connects food donors with NGOs, so surplus food reaches people who need it instead of going to waste.',
  description:
    'Donors list the food they can spare, with quantity, location and a collection deadline. NGOs browse the live listings and claim a donation for pickup. Each donation moves through a clear lifecycle (available, accepted, collected, cancelled or expired), and every user gets a role-based dashboard to track their activity, filter donations by status and manage new listings. Notifications keep both sides informed, and ratings build trust between donors and NGOs.',
  features: ['Role-based dashboards', 'Notifications', 'Ratings', 'Donation status tracking', 'Light and dark theme'],
  stack: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express.js', 'MySQL'],
  contribution: '',
  links: {
    github: '',
    live: '',
  },
  screenshots: [
    {
      label: 'Home',
      src: foodbridgeHome,
      alt: 'Food Bridge landing page with the headline "Turn surplus food into meals for people who need them" and example donation cards',
    },
    {
      label: 'Dashboard',
      src: foodbridgeDashboard,
      alt: 'Food Bridge donor dashboard with donation status counts, a status filter, a New donation button and a list of donations',
    },
  ],
}

// Set to false to hide the empty third-project slot
export const showNextProjectSlot = true