import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus, Send, X } from 'lucide-react'

// Chip label shown to the visitor -> question actually sent through the normal chat flow
const SUGGESTIONS = [
  { label: 'Explore Projects', question: 'What projects has Kaif built?' },
  { label: 'Technical Skills', question: 'What are his main technical skills?' },
  { label: 'View Résumé', question: "Can I see Kaif's résumé?" },
  { label: 'About Kaif', question: 'Tell me about Kaif.' },
]

const GREETING = {
  role: 'assistant',
  content:
    "Hey there! 👋\n\nI'm Kaif's AI assistant.\n\nWant to know about his projects, technical skills, experience, or résumé? Ask me anything.",
}

const FADE_MS = 220

// Chat bubble with a small AI spark in the corner
function KaiIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6.5A3.5 3.5 0 0 1 7.5 3h6A3.5 3.5 0 0 1 17 6.5v4A3.5 3.5 0 0 1 13.5 14H10l-3.6 3.2c-.5.4-1.4.1-1.4-.6V14.2A3.5 3.5 0 0 1 4 10.5v-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8.5" r="0.9" fill="currentColor" />
      <circle cx="12.5" cy="8.5" r="0.9" fill="currentColor" />
      <path
        d="M19 12.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"
        fill="currentColor"
      />
    </svg>
  )
}

// Floating assistant. It talks to /api/chat, which holds the API key on the server.
export default function Chatbot() {
  const [open, setOpen] = useState(false) // what the visitor asked for
  const [mounted, setMounted] = useState(false) // panel exists in the DOM
  const [visible, setVisible] = useState(false) // drives the fade/slide
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [vvHeight, setVvHeight] = useState(null)

  const busyRef = useRef(false) // blocks double submits before state updates land
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const launcherRef = useRef(null)
  const hasOpened = useRef(false)

  // Open: mount first, then fade in on the next frame. Close: fade out, then unmount.
  useEffect(() => {
    if (open) {
      setMounted(true)
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setVisible(false)
    const t = setTimeout(() => setMounted(false), FADE_MS)
    return () => clearTimeout(t)
  }, [open])

  // Focus the input when opened, and give focus back to the launcher when closed
  useEffect(() => {
    if (open && !minimized) {
      inputRef.current?.focus()
      hasOpened.current = true
    } else if (!open && hasOpened.current) {
      launcherRef.current?.focus()
    }
  }, [open, minimized])

  // Keep the newest message in view
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy, open, minimized])

  // Escape closes the panel
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Track the visible height so the panel stays above the mobile keyboard
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setVvHeight(vv.height)
    update()
    vv.addEventListener('resize', update)
    return () => vv.removeEventListener('resize', update)
  }, [])

  const send = useCallback(
    async (text) => {
      const question = text.trim()
      if (!question || busyRef.current) return
      busyRef.current = true
      setBusy(true)

      const next = [...messages, { role: 'user', content: question }]
      setMessages(next)
      setInput('')

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Skip the greeting and earlier error bubbles: the model does not need them
          body: JSON.stringify({
            messages: next.slice(1).filter((m) => !m.error),
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Something went wrong.')
        setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content:
              err.message && err.message !== 'Failed to fetch'
                ? err.message
                : 'Could not reach the assistant. Check your connection and try again, or use the contact form below.',
            error: true,
          },
        ])
      } finally {
        busyRef.current = false
        setBusy(false)
        inputRef.current?.focus()
      }
    },
    [messages]
  )

  const onSubmit = (e) => {
    e.preventDefault()
    send(input)
  }

  // Enter sends, Shift+Enter adds a new line
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(input)
    }
  }

  const onInput = (e) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }

  // Reset the textarea height after sending
  useEffect(() => {
    if (!input && inputRef.current) inputRef.current.style.height = 'auto'
  }, [input])

  const toggle = () => {
    if (open && minimized) {
      setMinimized(false)
    } else {
      setOpen((o) => !o)
    }
  }

  return (
    <div
      style={{ '--vvh': vvHeight ? `${vvHeight}px` : undefined }}
      className="fixed bottom-4 right-4 z-60 flex flex-col items-end sm:bottom-7 sm:right-7"
    >
      {mounted && (
        <section
          role="dialog"
          aria-label="KAI, Kaif's AI Assistant"
          className={`mb-3 flex w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-brand/40 bg-navy-950/90 shadow-[0_0_50px_-12px_rgba(29,139,255,0.55),0_24px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none sm:w-95 ${
            minimized
              ? ''
              : 'h-[75dvh] max-h-[min(75dvh,calc(var(--vvh,100dvh)-96px))] sm:h-140 sm:max-h-[min(560px,calc(var(--vvh,100dvh)-120px))]'
          } ${visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
        >
          <header className="flex items-center justify-between gap-3 border-b border-brand/20 bg-brand/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-brand/40 bg-brand/10 text-brand-soft">
                <KaiIcon size={20} />
              </span>
              <div>
                <p className="font-display text-sm font-bold leading-tight text-white">KAI</p>
                <p className="flex items-center gap-1.5 text-[11px] leading-tight text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  Kaif&rsquo;s AI Assistant
                  <span className="sr-only">, online</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMinimized((m) => !m)}
                aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
                aria-expanded={!minimized}
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-soft"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-soft"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </header>

          {!minimized && (
            <>
              <div
                ref={listRef}
                role="log"
                aria-live="polite"
                aria-label="Conversation"
                className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
              >
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <p
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'rounded-br-sm bg-brand text-white'
                          : m.error
                            ? 'rounded-bl-sm border border-red-400/30 bg-red-500/10 text-red-200'
                            : 'rounded-bl-sm border border-white/10 bg-white/5 text-ink'
                      }`}
                    >
                      {m.content}
                    </p>
                  </div>
                ))}

                {busy && (
                  <div className="flex justify-start" role="status" aria-label="KAI is typing">
                    <span className="flex gap-1 rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 px-3.5 py-3">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 rounded-full bg-brand-soft motion-safe:animate-bounce"
                          style={{ animationDelay: `${d * 150}ms` }}
                        />
                      ))}
                    </span>
                  </div>
                )}

                {showChips && (
  <div className="flex flex-wrap gap-2 pt-1">
    {SUGGESTIONS.map((s) => (
      <button
        key={s.label}
        type="button"
        onClick={() => send(s.question)}
        className="rounded-full border border-brand/40 bg-brand/10 px-3.5 py-1.5 text-left text-xs text-brand-soft transition-colors hover:bg-brand/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-soft"
      >
        {s.label}
      </button>
    ))}
  </div>
)}
                
              </div>

              <form
                onSubmit={onSubmit}
                className="flex items-end gap-2 border-t border-brand/20 bg-navy-950/60 p-3"
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={onInput}
                  onKeyDown={onKeyDown}
                  maxLength={500}
                  placeholder="Ask about Kaif..."
                  aria-label="Your question"
                  className="max-h-28 min-w-0 flex-1 resize-none rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-base leading-snug text-white placeholder:text-white/40 focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send question"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-soft hover:text-navy-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-soft disabled:opacity-40"
                >
                  <Send size={16} aria-hidden="true" />
                </button>
              </form>
            </>
          )}
        </section>
      )}

      <div className="group relative">
        {/* Tooltip: hover and keyboard focus only, hidden on touch-sized screens */}
        <span
          role="tooltip"
          className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-brand/30 bg-navy-950/95 px-3 py-1.5 text-xs text-ink opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 sm:block"
        >
          Ask Kaif&rsquo;s AI
        </span>
        <button
          ref={launcherRef}
          type="button"
          onClick={toggle}
          aria-label={open ? 'Close chat' : "Open chat: ask Kaif's AI"}
          aria-expanded={open}
          className="grid h-14 w-14 place-items-center rounded-full border border-brand/50 bg-navy-900/80 text-brand-soft shadow-[0_0_24px_-6px_rgba(29,139,255,0.6)] backdrop-blur-md transition-[transform,box-shadow,color] duration-200 hover:-translate-y-0.5 hover:text-white hover:shadow-[0_0_32px_-4px_rgba(29,139,255,0.8)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-soft motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:h-15 sm:w-15"
        >
          {open ? <X size={22} aria-hidden="true" /> : <KaiIcon size={26} />}
        </button>
      </div>
    </div>
  )
}
