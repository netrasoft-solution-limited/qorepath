import { useState, type ReactNode, type InputHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, type LucideIcon } from 'lucide-react';

// Shared look for sign-in, sign-up and password pages: one centred column on a dark
// navy canvas (in the spirit of Resend's sign-in), with faint stars and orbit rings
// behind it for the NetraNova feel.

function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="nn-stars absolute inset-0 opacity-40" />
      {/* soft glow behind the form */}
      <div className="absolute left-1/2 top-[38%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-qore-medium/25 blur-[120px]" />
      <div className="absolute left-1/2 top-[38%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF6A00]/10 blur-[90px]" />
      {/* faint orbit rings */}
      {[560, 820, 1080].map((s, i) => (
        <div
          key={s}
          className={`absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full border ${i === 1 ? 'border-dashed border-white/[0.06]' : 'border-white/[0.05]'}`}
          style={{ width: s, height: s }}
        />
      ))}
      {/* one slow moving "planet" on the middle ring */}
      <div className="absolute left-1/2 top-[38%]" style={{ width: 820, height: 820, marginLeft: -410, marginTop: -410 }}>
        <div className="nn-spin h-full w-full" style={{ ['--nn-dur' as any]: '90s' }}>
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFB020] shadow-[0_0_18px_4px_rgba(255,176,32,0.45)]" />
        </div>
      </div>
      {/* fade the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#06133A] to-transparent" />
    </div>
  );
}

export function AuthShell({ badge, children, below }: { badge?: ReactNode; children: ReactNode; below?: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#071743] text-white">
      <Backdrop />
      <div className="relative flex min-h-screen flex-col items-center px-5 py-10">
        <Link to="/public/home" aria-label="NetraNova home" className="mt-2 flex items-center gap-2.5 sm:mt-6">
          <img src="/netranova-icon.webp" alt="" className="h-10 w-10" />
          <span className="font-display text-xl font-extrabold tracking-tight">NetraNova</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex w-full max-w-[380px] flex-1 flex-col justify-center py-10"
        >
          {badge && <div className="mb-6 flex justify-center">{badge}</div>}
          {children}
          {below && <div className="mt-8 text-center text-sm text-white/50">{below}</div>}
        </motion.div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/35">
          <Link to="/public/home" className="hover:text-white/70">Home</Link>
          <Link to="/public/courses" className="hover:text-white/70">Tracks</Link>
          <Link to="/public/verify" className="hover:text-white/70">Verify a certificate</Link>
          <Link to="/public/contact" className="hover:text-white/70">Contact</Link>
          <span>© {new Date().getFullYear()} NetraNova</span>
        </nav>
      </div>
    </div>
  );
}

export function FormHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-white/55">{subtitle}</p>}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-200">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">!</span>
      <span>{children}</span>
    </motion.div>
  );
}

/** Labelled input on the dark canvas; password fields get a show/hide toggle. */
export function Field({
  label, icon: Icon, hint, aside, type = 'text', ...input
}: { label: ReactNode; icon?: LucideIcon; hint?: ReactNode; aside?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-white/75">
        <span>{label}</span>
        {aside}
      </span>
      <span className="group relative block">
        {Icon && <Icon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-qore-highlight" />}
        <input
          {...input}
          type={isPassword && show ? 'text' : type}
          className={`w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-qore-highlight/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-qore-highlight/10 ${Icon ? 'pl-10' : 'pl-3.5'} ${isPassword ? 'pr-11' : 'pr-3.5'}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </span>
      {hint}
    </label>
  );
}

export function SubmitButton({ loading, loadingText, children }: { loading: boolean; loadingText: string; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-qore-dark shadow-[0_8px_30px_-8px_rgba(140,203,255,0.45)] transition hover:bg-white/90 disabled:opacity-70"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
          {loadingText}
        </>
      ) : (
        <>{children} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>
      )}
    </button>
  );
}

/** Small pill shown above the heading (e.g. the next open cohort). */
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs text-white/75 backdrop-blur [&>span:last-child]:truncate">
      {children}
    </span>
  );
}
