// Two small icons drawn to match the reference image
// (lucide has no "AI chip" or "cloud with nodes").
export function ChipAI(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="5" width="14" height="14" rx="2.5" />
      <path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3" />
      <path d="M9.5 15v-3.2a2.5 2.5 0 0 1 5 0V15M9.5 13.6h5" strokeWidth="1.3" />
    </svg>
  )
}
export function CloudNodes(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 15a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 7.5 3.8 3.8 0 0 1 17.5 15" />
      <path d="M12 15v2.5M12 17.5H6.5v1.5M12 17.5h5.5v1.5" />
      <circle cx="6.5" cy="20.5" r="1.3" />
      <circle cx="12" cy="20.5" r="1.3" />
      <circle cx="17.5" cy="20.5" r="1.3" />
    </svg>
  )
}

