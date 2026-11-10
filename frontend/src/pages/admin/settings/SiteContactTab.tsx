import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, CheckCircle, ExternalLink } from 'lucide-react';
import api from '../../../lib/api';
import { loadSiteInfo, SiteInfo } from '../../../lib/siteInfo';

const SOCIALS: [keyof SiteInfo['socials'], string, string][] = [
  ['instagram', 'Instagram', 'https://instagram.com/…'],
  ['x', 'X (Twitter)', 'https://x.com/…'],
  ['linkedin', 'LinkedIn', 'https://linkedin.com/company/…'],
  ['facebook', 'Facebook', 'https://facebook.com/…'],
  ['youtube', 'YouTube', 'https://youtube.com/@…'],
  ['tiktok', 'TikTok', 'https://tiktok.com/@…'],
];

const errMsg = (e: any, fallback: string) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(', ') : m || fallback;
};

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium';
const label = 'block text-xs font-semibold text-gray-500 mb-1.5';

export function SiteContactTab() {
  const [form, setForm] = useState<SiteInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings/site').then(({ data }) => setForm(data)).catch(() => setError('Could not load site details'));
  }, []);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      const { acceptsMessages, ...body } = form;
      const { data } = await api.patch('/settings/site', body);
      setForm({ ...data, acceptsMessages: !!data.contactEmail });
      loadSiteInfo(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(errMsg(e, 'Failed to save site details'));
    } finally {
      setSaving(false);
    }
  };

  if (!form) return error ? <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div> : <div className="py-12 text-center text-gray-400">Loading…</div>;
  const set = (k: keyof SiteInfo, v: string) => setForm({ ...form, [k]: v });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-qore-text">Site &amp; Contact</h2>
        <p className="text-sm text-gray-400 mt-1">
          Shown on the public <a href="/public/contact" target="_blank" rel="noreferrer" className="text-qore-medium hover:underline">Contact page <ExternalLink size={11} className="inline" /></a> and in the site footer. Leave anything blank to hide it.
        </p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={label}>Contact email</label>
          <input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="hello@netrasoft.co" className={input} />
          <p className="text-xs text-gray-400 mt-1">Contact-form messages are emailed here (reply directly to answer the sender). Without it, the form is hidden.</p>
        </div>
        <div><label className={label}>Contact person</label><input value={form.contactName ?? ''} onChange={(e) => set('contactName', e.target.value)} placeholder="e.g. NetraNova Representative" className={input} /></div>
        <div><label className={label}>Phone</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+234 …" className={input} /></div>
        <div><label className={label}>WhatsApp number</label><input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+234 …" className={input} /></div>
        <div><label className={label}>Address</label><textarea rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} className={input} /></div>
        <div><label className={label}>Opening hours</label><input value={form.hours} onChange={(e) => set('hours', e.target.value)} placeholder="Mon–Fri, 9am–5pm WAT" className={input} /></div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-qore-text mb-3">Social media</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SOCIALS.map(([k, name, ph]) => (
            <div key={k}>
              <label className={label}>{name}</label>
              <input value={form.socials[k] ?? ''} onChange={(e) => setForm({ ...form, socials: { ...form.socials, [k]: e.target.value } })} placeholder={ph} className={input} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-qore-text">Legal pages</h3>
          <p className="text-xs text-gray-400 mt-1">
            Paste your Terms of Service and Privacy Policy. They're published at /public/terms and /public/privacy, and the sign-up page links to them.
            Leave blank until you have them; use a blank line between paragraphs.
          </p>
        </div>
        <div><label className={label}>Terms of Service</label><textarea rows={8} value={form.termsText} onChange={(e) => set('termsText', e.target.value)} className={input} /></div>
        <div><label className={label}>Privacy Policy</label><textarea rows={8} value={form.privacyText} onChange={(e) => set('privacyText', e.target.value)} className={input} /></div>
      </section>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><CheckCircle size={16} /> Saved</span>}
        <button onClick={save} disabled={saving}
          className="bg-qore-medium hover:bg-qore-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-60">
          <Save size={18} /> {saving ? 'Saving…' : 'Save Details'}
        </button>
      </div>
    </motion.div>
  );
}
