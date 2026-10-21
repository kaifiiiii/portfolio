import { useCallback, useEffect, useRef, useState } from 'react'
import { Brain, ChevronUp, FileText, Minus, MoreVertical, Rocket, Send, User, X } from 'lucide-react'
import ParticleSphere from './ParticleSphere'
import './chatbot.css'

// Chip label shown to the visitor -> question actually sent through the normal chat flow
const SUGGESTIONS = [
  { label: 'Explore Projects', Icon: Rocket, question: 'What projects has Kaif built?' },
  { label: 'Technical Skills', Icon: Brain, question: 'What are his main technical skills?' },
  { label: 'View Résumé', Icon: FileText, question: "Can I see Kaif's résumé?" },
  { label: 'About Kaif', Icon: User, question: 'Tell me about Kaif.' },
]

const GREETING = {
  role: 'assistant',
  content:
    "Hey there! 👋\n\nI'm Kaif's AI assistant.\n\nWant to know about his projects, technical skills, experience, or résumé? Ask me anything.",
}

const FADE_MS = 220

// The glass sphere (public/images/kai-sphere.webp). A CSS glow sits behind it.
// Used for the launcher (floating), the header, and beside assistant messages.
const SPHERE = '/images/kai-sphere.webp'

function Orb({ size, busy = false, floating = false }) {
  return (
    <span
      aria-hidden="true"
      data-busy={busy ? 'true' : 'false'}
      style={size ? { width: size, height: size } : undefined}
      className={`kai-orb relative inline-grid shrink-0 place-items-center ${
        size ? '' : 'h-full w-full'
      } ${floating ? 'kai-float' : ''}`}
    >
      <span className="kai-orb-glow" />
      <img
        src={SPHERE}
        width={256}
        height={256}
        alt=""
        draggable="false"
        className="relative h-full w-full select-none object-contain"
      />
    </span>
  )
}

// Make links in assistant replies clickable
function linkify(text) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
    if (!/^https?:\/\//.test(part)) return part
    const [, url, tail] = part.match(/^(.*?)([.,;:!?)]*)$/)
    return (
      <span key={i}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-300 underline underline-offset-2 hover:text-white"
        >
          {url}
        </a>
        {tail}
      </span>
    )
  })
}

const iconBtn =
  'grid h-8 w-8 place-items-center rounded-full text-sky-100/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300'

// Floating assistant. It talks to /api/chat, which holds the API key on the server.
export default function Chatbot() {
  const [open, setOpen] = useState(false) // what the visitor asked for
  const [mounted, setMounted] = useState(false) // panel exists in the DOM
  const [visible, setVisible] = useState(false) // drives the fade/slide
  const [minimized, setMinimized] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [vvHeight, setVvHeight] = useState(null)
  const [pulse, setPulse] = useState(0) // bumps each time the chat opens

  const busyRef = useRef(false) // blocks double submits before state updates land
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const launcherRef = useRef(null)
  const menuRef = useRef(null)
  const menuBtnRef = useRef(null)
  const hasOpened = useRef(false)

  // One chip group, shown only when the last message is a finished assistant reply
  const showChips = !busy && messages[messages.length - 1]?.role === 'assistant'

  // Open: mount first, then fade in on the next frame. Close: fade out, then unmount.
  useEffect(() => {
    if (open) {
      setMounted(true)
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setVisible(false)
    setMenuOpen(false)
    const t = setTimeout(() => setMounted(false), FADE_MS)
    return () => clearTimeout(t)
  }, [open])

  // Brief brightness pulse on the launcher sphere when the chat opens
  useEffect(() => {
    if (open) setPulse((p) => p + 1)
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

  // Escape closes the menu first, then the panel
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (menuOpen) {
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      } else {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, menuOpen])

  // Clicking outside the menu closes it
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [menuOpen])

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

  const clearChat = () => {
    if (busyRef.current) return
    setMessages([GREETING])
    setInput('')
    setMenuOpen(false)
    inputRef.current?.focus()
  }

  const toggleMinimize = () => {
    setMinimized((m) => !m)
    setMenuOpen(false)
  }

  const toggle = () => {
    if (open && minimized) setMinimized(false)
    else setOpen((o) => !o)
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
          className={`kai-frame -mr-1 mb-3 w-[calc(100vw-24px)] transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none sm:mr-0 sm:w-100 ${
            minimized
              ? ''
              : 'h-[75dvh] max-h-[min(75dvh,calc(var(--vvh,100dvh)-96px))] sm:h-140 sm:max-h-[min(560px,calc(var(--vvh,100dvh)-120px))]'
          } ${visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
        >
          <div
            className={`kai-inner relative flex flex-col overflow-hidden rounded-[28px] ${
              minimized ? '' : 'h-full'
            }`}
          >
            {/* Ambient background: gradients only */}
            <div aria-hidden="true" className="kai-particles pointer-events-none absolute inset-0" />
            <div aria-hidden="true" className="kai-poly-a" />
            <div aria-hidden="true" className="kai-poly-b" />

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between gap-3 border-b border-sky-400/25 px-4 py-3">
              <div className="flex items-center gap-3">
                <Orb size={44} busy={busy} />
                <div>
                  <p className="font-display text-base font-bold leading-tight text-white">KAI</p>
                  <p className="flex items-center gap-1.5 text-xs leading-tight text-sky-100/70">
                    <span
                      className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                      aria-hidden="true"
                    />
                    Online
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleMinimize}
                  aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
                  aria-expanded={!minimized}
                  className={iconBtn}
                >
                  {minimized ? (
                    <ChevronUp size={18} aria-hidden="true" />
                  ) : (
                    <Minus size={18} aria-hidden="true" />
                  )}
                </button>
                {!minimized && (
                  <div ref={menuRef} className="relative">
                    <button
                      ref={menuBtnRef}
                      type="button"
                      onClick={() => setMenuOpen((o) => !o)}
                      aria-label="Chat options"
                      aria-expanded={menuOpen}
                      aria-controls="kai-menu"
                      className={iconBtn}
                    >
                      <MoreVertical size={18} aria-hidden="true" />
                    </button>
                    {menuOpen && (
                      <div
                        id="kai-menu"
                        className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-sky-400/40 bg-navy-950 p-1 shadow-[0_0_24px_-6px_rgba(47,139,255,0.7)]"
                      >
                        <button
                          type="button"
                          onClick={clearChat}
                          disabled={busy}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-brand/15 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300 disabled:opacity-40"
                        >
                          Clear conversation
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className={iconBtn}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </header>

            {!minimized && (
              <>
                {/* Conversation: scrolls on its own, header and input stay put */}
                <div
                  ref={listRef}
                  role="log"
                  aria-live="polite"
                  aria-label="Conversation"
                  className="kai-scroll relative z-10 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
                >
                  {messages.map((m, i) =>
                    m.role === 'user' ? (
                      <div key={i} className="flex justify-end">
                        <p className="max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-sm border border-sky-300/50 bg-linear-to-b from-brand to-blue-700 px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_0_18px_-4px_rgba(47,139,255,0.8)]">
                          {m.content}
                        </p>
                      </div>
                    ) : (
                      <div key={i} className="flex items-start gap-2.5">
                        <Orb size={32} />
                        <p
                          className={`max-w-[82%] whitespace-pre-wrap wrap-break-word rounded-2xl rounded-tl-sm border px-4 py-3 text-sm leading-relaxed ${
                            m.error
                              ? 'border-red-400/40 bg-red-500/10 text-red-200'
                              : 'border-sky-400/30 bg-linear-to-br from-white/8 to-white/2 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                          }`}
                        >
                          {linkify(m.content)}
                        </p>
                      </div>
                    )
                  )}

                  {busy && (
                    <div className="flex items-start gap-2.5" role="status" aria-label="KAI is typing">
                      <Orb size={32} busy />
                      <span className="flex gap-1 rounded-2xl rounded-tl-sm border border-sky-400/30 bg-white/5 px-4 py-3.5">
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className="h-1.5 w-1.5 rounded-full bg-sky-300 motion-safe:animate-bounce"
                            style={{ animationDelay: `${d * 150}ms` }}
                          />
                        ))}
                      </span>
                    </div>
                  )}

                  {/* One chip group, below the latest finished answer */}
                  {showChips && (
                    <div className="flex flex-wrap gap-2 pl-[42px]">
                      {SUGGESTIONS.map(({ label, Icon, question }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => send(question)}
                          className="inline-flex items-center gap-2 rounded-full border border-sky-400/50 bg-navy-950/50 px-3.5 py-1.5 text-xs text-sky-100 shadow-[0_0_12px_-4px_rgba(47,139,255,0.7)] transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-brand/15 hover:shadow-[0_0_18px_-3px_rgba(80,170,255,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                        >
                          <Icon size={15} className="text-sky-300" aria-hidden="true" />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input: always visible at the bottom */}
                <form onSubmit={onSubmit} className="relative z-10 px-3 pb-3 pt-1">
                  <div className="flex items-end gap-2 rounded-2xl border border-sky-400/40 bg-linear-to-b from-white/6 to-white/2 p-1.5 transition-[border-color,box-shadow] focus-within:border-sky-300 focus-within:shadow-[0_0_18px_-4px_rgba(80,170,255,0.8)]">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={input}
                      onChange={onInput}
                      onKeyDown={onKeyDown}
                      maxLength={500}
                      placeholder="Type message..."
                      aria-label="Your question"
                      className="max-h-28 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-snug text-white placeholder:text-sky-100/45 focus:outline-none sm:text-sm"
                    />
                    <button
                      type="submit"
                      disabled={busy || !input.trim()}
                      aria-label="Send question"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-brand text-white shadow-[0_0_16px_-2px_rgba(34,211,238,0.7)] transition-[opacity,box-shadow] hover:shadow-[0_0_22px_0_rgba(34,211,238,0.85)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:opacity-40 disabled:shadow-none"
                    >
                      <Send size={17} aria-hidden="true" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      )}

      <div className="group relative">
        {/* Tooltip: hover and keyboard focus only, hidden on small screens */}
        <span
          role="tooltip"
          className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-brand/30 bg-navy-950/95 px-3 py-1.5 text-xs font-semibold tracking-[0.15em] text-ink opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 sm:block"
        >
          ASK KAI
        </span>
        <button
          ref={launcherRef}
          type="button"
          onClick={toggle}
          aria-label={open ? 'Close chat' : 'Open chat: ask KAI'}
          aria-expanded={open}
          className="kai-launcher relative grid h-17 w-17 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 sm:h-21 sm:w-21"
        >
          <span className="kai-orb relative block h-full w-full" data-busy={busy ? 'true' : 'false'}>
            <span className="kai-orb-glow" />
            <span className="kai-pdisc" />
            <ParticleSphere busy={busy} pulseKey={pulse} />
          </span>
        </button>
      </div>
    </div>
  )
}