import { Mail, Phone, MapPin } from 'lucide-react'
import { FaGithub, FaLinkedinIn } from 'react-icons/fa'

export const contactContent = {
  eyebrow: '06 — Contact',
  heading: "Let's work together.",
  text: "I'm open to full-time roles as a full stack web developer. Send a message and I'll get back to you.",
}

// Fill in the ones you want to show. Any field left empty is hidden automatically.
// The message form opens the visitor's email app addressed to `email`, so it only appears once `email` is set.
export const contactInfo = {
  email: 'kaifi3110@gmail.com',
  phone: '',
  location: 'New Delhi, India',
  github: 'https://github.com/kaifiiiii',
  linkedin: 'https://www.linkedin.com/in/kaifi',
}

// Paste your Formspree form URL here so messages are delivered straight to your inbox.
// Get it free at https://formspree.io : New form, then copy the endpoint (looks like https://formspree.io/f/abcdwxyz).
// Leave empty to fall back to opening the visitor's email app.
export const formEndpoint = 'https://formspree.io/f/mzedwkka'

export const contactLinks = [
  { key: 'email', label: 'Email', Icon: Mail, href: (v) => `mailto:${v}` },
  { key: 'phone', label: 'Phone', Icon: Phone, href: (v) => `tel:${v.replace(/\s/g, '')}` },
  { key: 'github', label: 'GitHub', Icon: FaGithub, href: (v) => v, external: true },
  { key: 'linkedin', label: 'LinkedIn', Icon: FaLinkedinIn, href: (v) => v, external: true },
  { key: 'location', label: 'Location', Icon: MapPin },
]
