import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Eye, EyeOff, ImageUp, KeyRound, Mail, RotateCcw, Send, ShieldAlert } from 'lucide-react';
import api from '../../lib/api';
import { useConfirm, useToast } from '../../components/feedback';

interface Status {
  paystack: { configured: boolean; mode: 'test' | 'live' | 'unknown'; secretKey: string; publicKey: string; source: 'dashboard' | 'server'; updatedAt?: string | null; updatedBy?: string | null };
  resend: { configured: boolean; apiKey: string; mailFrom: string; source: 'dashboard' | 'server'; updatedAt?: string | null; updatedBy?: string | null };
  publitio: { configured: boolean; apiKey: string; source: 'dashboard' | 'server'; updatedAt?: string | null; updatedBy?: string | null };
}
type Provider = 'paystack' | 'resend' | 'publitio';
const WHAT: Record<Provider, string> = { paystack: 'Paystack keys', resend: 'email settings', publitio: 'Publitio keys' };

const when = (d?: string | null) => (d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const errMsg = (e: any, fallback: string) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(', ') : m || fallback;
};

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-11 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={show ? 'Hide' : 'Show'}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Source({ source, updatedAt, updatedBy }: { source: string; updatedAt?: string | null; updatedBy?: string | null }) {
  return source === 'dashboard' ? (
    <p className="text-xs text-gray-400">Set here{updatedBy ? ` by ${updatedBy}` : ''}{updatedAt ? ` · ${when(updatedAt)}` : ''}</p>
  ) : (
    <p className="text-xs text-gray-400">Using the server default (Render environment)</p>
  );
}

export function AdminIntegrations() {
  const confirm = useConfirm();
  const toast = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [ps, setPs] = useState({ secretKey: '', publicKey: '' });
  const [rs, setRs] = useState({ apiKey: '', mailFrom: '' });
  const [fs, setFs] = useState({ apiKey: '', apiSecret: '' });
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    api.get('/integrations').then(({ data }) => { setStatus(data); setRs((r) => ({ ...r, mailFrom: r.mailFrom || data.resend.mailFrom })); }).catch((e) => setError(errMsg(e, 'Could not load integrations')));
  useEffect(() => { load(); }, []);

  const savePaystack = async () => {
    const goingLive = ps.secretKey.trim().startsWith('sk_live_');
    if (goingLive && status?.paystack.mode !== 'live') {
      const ok = await confirm({
        title: 'Switch payments to LIVE?',
        message: 'From now on every checkout charges real cards and refunds return real money. Payments made with test keys can no longer be verified.',
        confirmLabel: 'Switch to live',
        variant: 'danger',
      });
      if (!ok) return;
    }
    setBusy('paystack');
    try {
      const { data } = await api.put('/integrations/paystack', ps);
      setStatus(data);
      setPs({ secretKey: '', publicKey: '' });
      toast({ message: `Paystack keys saved — ${data.paystack.mode.toUpperCase()} mode`, variant: 'success' });
    } catch (e) {
      toast({ message: errMsg(e, 'Could not save Paystack keys'), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const saveResend = async () => {
    setBusy('resend');
    try {
      const { data } = await api.put('/integrations/resend', { apiKey: rs.apiKey || undefined, mailFrom: rs.mailFrom || undefined });
      setStatus(data);
      setRs({ apiKey: '', mailFrom: data.resend.mailFrom });
      toast({ message: 'Email settings saved', variant: 'success' });
    } catch (e) {
      toast({ message: errMsg(e, 'Could not save email settings'), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const savePublitio = async () => {
    setBusy('publitio');
    try {
      const { data } = await api.put('/integrations/publitio', fs);
      setStatus(data);
      setFs({ apiKey: '', apiSecret: '' });
      toast({ message: 'Publitio connected — new files and photos will be stored there', variant: 'success' });
    } catch (e) {
      toast({ message: errMsg(e, 'Could not save Publitio keys'), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const revert = async (provider: Provider) => {
    const ok = await confirm({ title: 'Use the server default?', message: `The ${WHAT[provider]} saved here will be removed and the values configured on the server will be used.`, confirmLabel: 'Revert', variant: 'danger' });
    if (!ok) return;
    try {
      const { data } = await api.delete(`/integrations/${provider}`);
      setStatus(data);
      toast({ message: 'Reverted to the server default', variant: 'success' });
    } catch (e) {
      toast({ message: errMsg(e, 'Could not revert'), variant: 'error' });
    }
  };

  const sendTest = async () => {
    setBusy('test');
    try {
      const { data } = await api.post('/integrations/resend/test', { to: testTo || undefined });
      toast({ message: `Test email sent to ${data.to}`, variant: 'success' });
    } catch (e) {
      toast({ message: errMsg(e, 'Test email failed'), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  if (error) return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!status) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  const p = status.paystack;
  const r = status.resend;
  const f = status.publitio;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
        <p>Only super admins can see this page. Keys are stored encrypted and are never shown again after saving — keep a copy in your Paystack, Resend and Publitio dashboards.</p>
      </div>

      {/* Paystack */}
      <section className="rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-qore-light"><CreditCard size={18} className="text-qore-medium" /></span>
            <div>
              <h3 className="font-bold text-qore-text">Paystack</h3>
              <Source source={p.source} updatedAt={p.updatedAt} updatedBy={p.updatedBy} />
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${p.mode === 'live' ? 'bg-green-100 text-green-700' : p.mode === 'test' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
            {p.configured ? `${p.mode} mode` : 'Not configured'}
          </span>
        </div>
        {p.configured && (
          <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-gray-400">Secret key</dt><dd className="font-mono text-qore-text">{p.secretKey}</dd></div>
            <div><dt className="text-xs text-gray-400">Public key</dt><dd className="truncate font-mono text-qore-text">{p.publicKey}</dd></div>
          </dl>
        )}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-500">New secret key</span><SecretInput value={ps.secretKey} onChange={(v) => setPs({ ...ps, secretKey: v })} placeholder="sk_live_…" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-500">New public key</span><SecretInput value={ps.publicKey} onChange={(v) => setPs({ ...ps, publicKey: v })} placeholder="pk_live_…" /></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-400">Find them in Paystack → Settings → API Keys &amp; Webhooks. The key is checked with Paystack before it's saved.</p>
          <div className="flex gap-2">
            {p.source === 'dashboard' && (
              <button onClick={() => revert('paystack')} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"><RotateCcw size={14} /> Use server default</button>
            )}
            <button onClick={savePaystack} disabled={busy === 'paystack' || !ps.secretKey || !ps.publicKey} className="flex items-center gap-1.5 rounded-xl bg-qore-dark px-5 py-2 text-sm font-bold text-white hover:bg-qore-medium disabled:opacity-50">
              <KeyRound size={14} /> {busy === 'paystack' ? 'Checking…' : 'Save keys'}
            </button>
          </div>
        </div>
      </section>

      {/* Resend */}
      <section className="rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50"><Mail size={18} className="text-[#FF6A00]" /></span>
            <div>
              <h3 className="font-bold text-qore-text">Email (Resend)</h3>
              <Source source={r.source} updatedAt={r.updatedAt} updatedBy={r.updatedBy} />
            </div>
          </div>
          <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${r.configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {r.configured ? <><CheckCircle2 size={12} /> Sending</> : 'Not configured'}
          </span>
        </div>
        {r.configured && (
          <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-gray-400">API key</dt><dd className="font-mono text-qore-text">{r.apiKey}</dd></div>
            <div><dt className="text-xs text-gray-400">Sender</dt><dd className="truncate text-qore-text">{r.mailFrom}</dd></div>
          </dl>
        )}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-500">New API key <span className="font-normal text-gray-400">(leave blank to keep the current one)</span></span><SecretInput value={rs.apiKey} onChange={(v) => setRs({ ...rs, apiKey: v })} placeholder="re_…" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-500">Sender</span>
            <input value={rs.mailFrom} onChange={(e) => setRs({ ...rs, mailFrom: e.target.value })} placeholder="NetraNova <noreply@yourdomain.com>" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-400">The sender must be on a domain verified in that Resend account — this is checked before saving.</p>
          <div className="flex gap-2">
            {r.source === 'dashboard' && (
              <button onClick={() => revert('resend')} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"><RotateCcw size={14} /> Use server default</button>
            )}
            <button onClick={saveResend} disabled={busy === 'resend' || (!rs.apiKey && rs.mailFrom === r.mailFrom)} className="flex items-center gap-1.5 rounded-xl bg-qore-dark px-5 py-2 text-sm font-bold text-white hover:bg-qore-medium disabled:opacity-50">
              <KeyRound size={14} /> {busy === 'resend' ? 'Checking…' : 'Save email settings'}
            </button>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-gray-100 pt-5 sm:flex-row">
          <input value={testTo} onChange={(e) => setTestTo(e.target.value)} type="email" placeholder="Send a test email to… (defaults to you)" className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
          <button onClick={sendTest} disabled={busy === 'test' || !r.configured} className="flex items-center justify-center gap-1.5 rounded-xl border border-qore-medium px-5 py-2.5 text-sm font-bold text-qore-medium hover:bg-qore-light disabled:opacity-50">
            <Send size={14} /> {busy === 'test' ? 'Sending…' : 'Send test email'}
          </button>
        </div>
      </section>

      {/* Publitio */}
      <section className="rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50"><ImageUp size={18} className="text-violet-600" /></span>
            <div>
              <h3 className="font-bold text-qore-text">Files &amp; images (Publitio)</h3>
              <Source source={f.source} updatedAt={f.updatedAt} updatedBy={f.updatedBy} />
            </div>
          </div>
          <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${f.configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {f.configured ? <><CheckCircle2 size={12} /> Connected</> : 'Not configured'}
          </span>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Certificate files and profile photos are stored on Publitio. Until it's connected, certificate files are kept in the database and profile photos are turned off.
        </p>
        {f.configured && (
          <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-gray-400">API key</dt><dd className="font-mono text-qore-text">{f.apiKey}</dd></div>
          </dl>
        )}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-500">API key</span><SecretInput value={fs.apiKey} onChange={(v) => setFs({ ...fs, apiKey: v })} placeholder="Publitio API key" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-500">API secret</span><SecretInput value={fs.apiSecret} onChange={(v) => setFs({ ...fs, apiSecret: v })} placeholder="Publitio API secret" /></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-400">Find them in Publitio → Settings → API. The keys are checked with Publitio before they're saved.</p>
          <div className="flex gap-2">
            {f.source === 'dashboard' && (
              <button onClick={() => revert('publitio')} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"><RotateCcw size={14} /> Remove keys</button>
            )}
            <button onClick={savePublitio} disabled={busy === 'publitio' || !fs.apiKey || !fs.apiSecret} className="flex items-center gap-1.5 rounded-xl bg-qore-dark px-5 py-2 text-sm font-bold text-white hover:bg-qore-medium disabled:opacity-50">
              <KeyRound size={14} /> {busy === 'publitio' ? 'Checking…' : 'Save keys'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
