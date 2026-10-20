import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Sparkles, X } from 'lucide-react'

const SUGGESTIONS = [
  'What projects has Kaif built?',
  'What are his main skills?',
  'Is he open to full-time roles?',
  'How can I contact him?',
]

const GREETING = {
  role: 'assistant',
  content:
    "Hi! I can answer questions about Kaif's projects, skills, experience and education. What would you like to know?",
}

// Floating chat widget. It talks to /api/chat, which holds the API key on the server.
export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  // Keep the newest message in view
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Escape closes the panel
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const send = async (text) => {
    const question = text.trim()
    if (!question || busy) return
    const next = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The greeting is not part of the conversation the model needs
        body: JSON.stringify({ messages: next.slice(1) }),
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
              : 'I could not reach the assistant. Please try again, or use the contact form below.',
          error: true,
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="fixed bottom-4 right-4 z-60 sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label="Ask about Kaif"
          className="mb-3 flex h-[min(70vh,520px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-brand/40 bg-navy-950 shadow-[0_0_60px_-10px_rgba(29,139,255,0.5),0_20px_50px_-20px_rgba(0,0,0,0.9)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand-soft">
                <Sparkles size={16} aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-white">Ask about Kaif</p>
                <p className="text-[11px] text-muted">AI assistant · answers from this portfolio</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
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
              <div className="flex justify-start" role="status" aria-label="Assistant is typing">
                <span className="flex gap-1 rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 px-3.5 py-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-soft"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </span>
              </div>
            )}

            {messages.length === 1 && !busy && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-left text-xs text-brand-soft transition-colors hover:bg-brand/20 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Ask a question..."
              aria-label="Your question"
              className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send question"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-soft hover:text-navy-950 disabled:opacity-40"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat: ask about Kaif'}
        aria-expanded={open}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand/50 bg-navy-900 text-brand-soft shadow-[0_0_30px_-4px_rgba(29,139,255,0.7)] transition-all hover:scale-105 hover:text-white"
      >
        {open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}
      </button>
    </div>
  )
}
