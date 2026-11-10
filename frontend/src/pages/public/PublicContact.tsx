import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, MessageCircle, UserRound, Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useSiteInfo, whatsappLink } from '../../lib/siteInfo';
import { SocialLinks } from '../../components/SocialLinks';

const TOPICS = ['Enrolling in a track', 'Payments & refunds', 'Certificates', 'Partnerships', 'Something else'];

export function PublicContact() {
  const info = useSiteInfo();
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: TOPICS[0], message: '', website: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Contact us · NetraNova';
    return () => { document.title = 'NetraNova Live Learning Platform'; };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      await api.post('/settings/contact', form);
      setState('sent');
    } catch (err: any) {
      setError(err.response?.data?.message || "Your message couldn't be sent. Please try again.");
      setState('idle');
    }
  };

  const channels = info ? [
    info.contactName && { icon: UserRound, label: 'NetraNova representative', value: info.contactName },
    info.contactEmail && { icon: Mail, label: 'Email', value: info.contactEmail, href: `mailto:${info.contactEmail}` },
    info.phone && { icon: Phone, label: 'Phone', value: info.phone, href: `tel:${info.phone.replace(/\s/g, '')}` },
    info.whatsapp && { icon: MessageCircle, label: 'WhatsApp', value: info.whatsapp, href: whatsappLink(info.whatsapp) },
    info.address && { icon: MapPin, label: 'Address', value: info.address },
    info.hours && { icon: Clock, label: 'Hours', value: info.hours },
  ].filter(Boolean) as { icon: any; label: string; value: string; href?: string }[] : [];

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium';

  return (
    <div className="min-h-screen bg-[#F5F8FF]">
      <section className="relative overflow-hidden bg-qore-dark pb-32 pt-16 text-white">
        <div className="nn-stars pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Get in <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">touch</span>
          </motion.h1>
          <p className="mx-auto mt-5 max-w-xl text-white/60">Questions about a track, payments or your certificate? Send us a message and we'll get back to you.</p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-20 grid max-w-5xl grid-cols-1 gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-qore-dark p-7 text-white shadow-xl">
          <h2 className="font-display text-xl font-bold">Reach us directly</h2>
          {info === null ? (
            <p className="mt-4 text-sm text-white/50">Loading…</p>
          ) : channels.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">Our contact details are coming soon.</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {channels.map(({ icon: I, label, value, href }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><I size={18} className="text-qore-highlight" /></span>
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-wider text-white/40">{label}</span>
                    {href ? (
                      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="break-words font-medium hover:underline">{value}</a>
                    ) : (
                      <span className="block whitespace-pre-line break-words font-medium">{value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <SocialLinks socials={info?.socials} className="mt-8" />
        </motion.aside>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-xl">
          {state === 'sent' ? (
            <div className="py-10 text-center">
              <CheckCircle size={44} className="mx-auto text-green-500" />
              <h2 className="mt-4 font-display text-xl font-bold text-qore-dark">Message sent</h2>
              <p className="mt-2 text-sm text-gray-500">Thanks, {form.name.split(' ')[0]}. We'll reply to {form.email}.</p>
            </div>
          ) : info && !info.acceptsMessages ? (
            <div className="py-10 text-center text-sm text-gray-500">The contact form isn't available yet. Please check back soon.</div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="font-display text-xl font-bold text-qore-dark">Send a message</h2>
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}</div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input required maxLength={100} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
                <input required type="email" maxLength={200} placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
                <input type="tel" maxLength={40} placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
                <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={input}>
                  {TOPICS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <textarea required rows={6} maxLength={5000} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={input} />
              {/* Honeypot for bots — hidden from people and screen readers */}
              <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                name="website" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              <button type="submit" disabled={state === 'sending' || !info}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB020] to-[#FF6A00] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 disabled:opacity-60">
                <Send size={15} /> {state === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
