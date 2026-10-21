import { useEffect, useRef, useState } from 'react'

// Watches one element and reports two things:
//   seen    - it has been on screen at least once (use this to play an entrance once)
//   visible - it is on screen right now (use this to pause work while it is off screen)
// The observer is created once and removed when the component unmounts.
export default function useInView({ threshold = 0.2, rootMargin = '0px' } = {}) {
  const ref = useRef(null)
  // Very old browsers without IntersectionObserver: treat the element as always visible
  const [state, setState] = useState(() => {
    const unsupported = typeof IntersectionObserver === 'undefined'
    return { seen: unsupported, visible: unsupported }
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const now = entry.isIntersecting
        setState((prev) =>
          prev.visible === now && (prev.seen || !now)
            ? prev // nothing changed, so no re-render
            : { seen: prev.seen || now, visible: now }
        )
      },
      { threshold, rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, state]
}

