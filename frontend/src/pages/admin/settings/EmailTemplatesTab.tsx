import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Send, Save, ChevronDown } from 'lucide-react';
import api from '../../../lib/api';
import { useToast } from '../../../components/feedback';

interface Template {
  key: string; name: string; audience: string; trigger: string; subject: string;
  locked: boolean; enabled: boolean; note: string;
}

const errMsg = (e: any, fallback: string) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(', ') : m || fallback;
};

export function EmailTemplatesTab() {
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const show = (list: Template[]) => {
    setTemplates(list);
    setNotes(Object.fromEntries(list.map((t) => [t.key, t.note])));
  };

  useEffect(() => {
    api.get('/settings/email-templates').then(({ data }) => show(data)).catch((e) => setError(errMsg(e, 'Could not load email templates')));
  }, []);

  const update = async (t: Template, body: { enabled?: boolean; note?: string }, done: string) => {
    setBusy(t.key);
    try {
      const { data } = await api.patch(`/settings/email-templates/${encodeURIComponent(t.key)}`, body);
      show(data);
      toast({ message: done, variant: 'success' });
    } catch (e) {
      toast({ message: errMsg(e, 'Could not save'), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const preview = async (t: Template) => {
    setBusy(`preview-${t.key}`);
    try {
      const { data } = await api.post(`/settings/email-templates/${encodeURIComponent(t.key)}/preview`, { note: notes[t.key] ?? '' });
      toast({ message: `Preview sent to ${data.to}`, variant: 'success' });
    } catch (e) {
      toast({ message: errMsg(e, 'Could not send the preview'), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  if (error) return <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>;
  if (!templates) return <div className="py-12 text-center text-gray-400">Loading…</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-qore-text">Notification Templates</h2>
        <p className="text-sm text-gray-400 mt-1">
          Every email NetraNova sends. Switch one off, or add a note that appears in it (for example a WhatsApp group link or support number).
          Security and payment emails always go out.
        </p>
      </div>

      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
        {templates.map((t) => {
          const isOpen = open === t.key;
          const dirty = (notes[t.key] ?? '') !== t.note;
          return (
            <div key={t.key} className="p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setOpen(isOpen ? null : t.key)} className="flex flex-1 min-w-0 items-center gap-3 text-left">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.enabled ? 'bg-qore-light text-qore-medium' : 'bg-gray-100 text-gray-400'}`}>
                    <Mail size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold ${t.enabled ? 'text-qore-text' : 'text-gray-400'}`}>
                      {t.name}{t.note && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-qore-medium">Note</span>}
                    </span>
                    <span className="block truncate text-xs text-gray-400">{t.audience} · {t.trigger}</span>
                  </span>
                  <ChevronDown size={16} className={`ml-auto shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {t.locked ? (
                  <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500" title="Security and payment emails can't be switched off">
                    <Lock size={11} /> Always on
                  </span>
                ) : (
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    {t.enabled ? 'On' : 'Off'}
                    <input
                      type="checkbox"
                      checked={t.enabled}
                      disabled={busy === t.key}
                      onChange={(e) => update(t, { enabled: e.target.checked }, `"${t.name}" ${e.target.checked ? 'switched on' : 'switched off'}`)}
                      className="w-5 h-5 accent-qore-medium"
                    />
                  </label>
                )}
              </div>

              {isOpen && (
                <div className="mt-4 space-y-3 pl-12">
                  <p className="text-xs text-gray-500">Subject: <span className="font-medium text-qore-text">{t.subject}</span></p>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-500">Extra note <span className="font-normal text-gray-400">(optional, shown in a box in this email)</span></span>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={notes[t.key] ?? ''}
                      onChange={(e) => setNotes({ ...notes, [t.key]: e.target.value })}
                      placeholder="e.g. Join the learner WhatsApp group: https://chat.whatsapp.com/…"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                    />
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => preview(t)}
                      disabled={busy === `preview-${t.key}`}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300 disabled:opacity-50"
                    >
                      <Send size={14} /> {busy === `preview-${t.key}` ? 'Sending…' : 'Send me a preview'}
                    </button>
                    <button
                      onClick={() => update(t, { note: notes[t.key] ?? '' }, `Note saved for "${t.name}"`)}
                      disabled={!dirty || busy === t.key}
                      className="flex items-center gap-1.5 rounded-xl bg-qore-dark px-4 py-2 text-sm font-bold text-white hover:bg-qore-medium disabled:opacity-50"
                    >
                      <Save size={14} /> Save note
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
