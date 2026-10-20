import { useState } from 'react'
import { Send } from 'lucide-react'
import { contactContent, contactInfo, contactLinks, formEndpoint } from '../data/contact'

const field =
  'w-full rounded-lg border border-white/15 bg-navy-950/60 px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-brand focus:outline-none'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const rows = contactLinks.filter((l) => contactInfo[l.key])
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    // Hidden field that only bots fill in
    if (e.currentTarget.elements.company?.value) return

    // No form service set: open the visitor's own email app instead
    if (!formEndpoint) {
      const subject = `Portfolio message from ${form.name}`
      const body = `${form.message}\n\n${form.name}\n${form.email}`
      window.location.href = `mailto:${contactInfo.email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`
      return
    }

    setStatus('sending')
    try {
      const res = await fetch(formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="relative bg-navy-950 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="mb-4 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-muted sm:text-sm">
            {contactContent.eyebrow}
            <span aria-hidden="true" className="h-px w-12 bg-brand" />
          </p>
          <h2 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            {contactContent.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink/80">{contactContent.text}</p>
        </div>

        <div
          className={`mt-14 grid gap-12 ${
            contactInfo.email && rows.length ? 'lg:grid-cols-[1fr_1.2fr]' : ''
          }`}
        >
          {rows.length > 0 && (
            <ul className="border-b border-white/10">
              {rows.map(({ key, label, Icon, href, external }) => {
                const value = contactInfo[key]
                const inner = (
                  <>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand-soft">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
                        {label}
                      </span>
                      <span className="block wrap-break-word text-base text-white">{value}</span>
                    </span>
                  </>
                )
                return (
                  <li key={key} className="border-t border-white/10">
                    {href ? (
                      <a
                        href={href(value)}
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="flex items-center gap-4 py-5 transition-colors hover:text-brand-soft"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 py-5">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {contactInfo.email && (
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-xs uppercase tracking-[0.15em] text-muted">
                  Name
                  <input required className={field} value={form.name} onChange={update('name')} placeholder="Your name" autoComplete="name" />
                </label>
                <label className="grid gap-2 text-xs uppercase tracking-[0.15em] text-muted">
                  Email
                  <input required type="email" className={field} value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email" />
                </label>
              </div>
              <label className="grid gap-2 text-xs uppercase tracking-[0.15em] text-muted">
                Message
                <textarea required rows={5} className={`${field} resize-y`} value={form.message} onChange={update('message')} placeholder="How can I help?" />
              </label>
              <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex items-center justify-center gap-2 justify-self-start rounded-full border border-brand/50 bg-brand/15 px-6 py-3 font-display text-sm font-semibold text-white transition-all hover:border-brand-soft hover:bg-brand/25 disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending...' : 'Send message'} <Send size={16} aria-hidden="true" />
              </button>
              <p role="status" aria-live="polite" className={`text-sm ${status === 'error' ? 'text-red-300' : 'text-brand-soft'}`}>
                {status === 'sent' && "Thanks, your message was sent. I'll get back to you soon."}
                {status === 'error' && `Something went wrong. Please try again or email ${contactInfo.email}.`}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}