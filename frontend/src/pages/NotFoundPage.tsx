import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();

  const home = !user
    ? '/public/home'
    : user.role === 'admin'
    ? '/admin/dashboard'
    : user.role === 'instructor' || user.role === 'assistant'
    ? '/instructor/dashboard'
    : '/learner/dashboard';

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-qore-dark px-4 text-center text-white">
      <div className="nn-stars pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mb-10 h-56 w-56">
        <div className="nn-spin absolute inset-0 rounded-full border border-dashed border-white/20" style={{ '--nn-dur': '40s' } as CSSProperties}>
          <span className="absolute -top-2 left-1/2 h-4 w-4 rounded-full bg-[#FFB020] shadow-[0_0_24px_#FFB020]" />
        </div>
        <div className="nn-spin-rev absolute inset-8 rounded-full border border-white/10" style={{ '--nn-dur': '25s' } as CSSProperties}>
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 rounded-full bg-qore-highlight shadow-[0_0_16px_#8CCBFF]" />
        </div>
        <div className="absolute inset-[28%] flex items-center justify-center rounded-full bg-white shadow-[0_0_60px_rgba(140,203,255,.4)]">
          <img src="/netranova-icon.webp" alt="" className="h-14 w-14" />
        </div>
      </div>
      <p className="relative font-display text-7xl font-extrabold tracking-tight">
        4<span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">0</span>4
      </p>
      <h1 className="relative mt-3 font-display text-2xl font-bold">Page not found</h1>
      <p className="relative mt-2 max-w-sm text-white/60">This page drifted out of orbit — the link may be old, or the address mistyped.</p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Link to={home} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30">
          {user ? 'Back to my dashboard' : 'Back to home'} <ArrowRight size={15} />
        </Link>
        <Link to="/public/courses" className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5">
          Browse tracks
        </Link>
      </div>
    </div>
  );
}
