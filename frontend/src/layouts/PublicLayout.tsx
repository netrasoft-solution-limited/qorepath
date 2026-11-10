import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, Phone, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TRACKS } from '../pages/public/trackContent';
import { useSiteInfo } from '../lib/siteInfo';
import { SocialLinks } from '../components/SocialLinks';

const NAV = [
  { name: 'Home', path: '/public/home' },
  { name: 'About', path: '/public/about' },
  { name: 'Tracks', path: '/public/courses' },
  { name: 'Pricing', path: '/public/tracks', exact: true },
  { name: 'Verify', path: '/public/verify' },
  { name: 'Contact', path: '/public/contact' },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const site = useSiteInfo();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setIsMenuOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const dashboardPath = !user ? '/login'
    : user.role === 'admin' ? '/admin/dashboard'
    : user.role === 'learner' ? '/learner/dashboard'
    : '/instructor/dashboard';

  const footerColumns = [
    { title: 'Tracks', links: Object.values(TRACKS).map((t) => ({ label: t.track, path: `/public/tracks/${t.slug}` })) },
    { title: 'Explore', links: [{ label: 'About NetraNova', path: '/public/about' }, { label: 'All tracks', path: '/public/courses' }, { label: 'Pricing & refunds', path: '/public/tracks' }, { label: 'Contact us', path: '/public/contact' }] },
    { title: 'Learners', links: [{ label: 'Verify a certificate', path: '/public/verify' }, { label: 'Log in', path: '/login' }, { label: 'Create an account', path: '/register' }, { label: 'Forgot password', path: '/forgot-password' }] },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Navbar ── */}
      <header className={`sticky top-0 z-50 transition-all ${scrolled ? 'border-b border-gray-100 bg-white/85 shadow-sm backdrop-blur-lg' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/public/home" className="flex items-center gap-2" aria-label="NetraNova home">
              <img src="/netranova-logo.webp" alt="NetraNova" className="h-10" />
            </Link>

            <nav className="hidden items-center gap-1 rounded-full bg-gray-50 p-1 md:flex">
              {NAV.map((link) => {
                const active = isActive(link.path, link.exact);
                return (
                  <Link key={link.name} to={link.path} className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? 'text-white' : 'text-gray-600 hover:text-qore-dark'}`}>
                    {active && <motion.span layoutId="nn-nav-pill" className="absolute inset-0 rounded-full bg-qore-dark" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                    <span className="relative">{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <button onClick={() => navigate(dashboardPath)} className="flex items-center gap-2 rounded-full bg-qore-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-qore-medium">
                  My dashboard <ArrowRight size={15} />
                </button>
              ) : (
                <>
                  <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-qore-dark">
                    Log in
                  </Link>
                  <Link to="/register" className="rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-transform hover:scale-[1.03]">
                    Get started
                  </Link>
                </>
              )}
            </div>

            <button className="p-2 text-gray-600 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={isMenuOpen}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100 bg-white md:hidden">
              <div className="space-y-1 px-4 pb-6 pt-3">
                {NAV.map((link) => (
                  <Link key={link.name} to={link.path} className={`block rounded-xl px-4 py-3 text-base font-medium ${isActive(link.path, link.exact) ? 'bg-qore-light text-qore-dark' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {link.name}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
                  {user ? (
                    <Link to={dashboardPath} className="rounded-2xl bg-qore-dark py-3 text-center text-base font-semibold text-white">My dashboard</Link>
                  ) : (
                    <>
                      <Link to="/login" className="rounded-2xl border border-gray-200 py-3 text-center text-base font-medium text-gray-700">Log in</Link>
                      <Link to="/register" className="rounded-2xl bg-gradient-to-r from-[#FFB020] to-[#FF6A00] py-3 text-center text-base font-bold text-white">Get started</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="relative overflow-hidden bg-qore-dark text-white">
        <div className="nn-stars pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-[320px] w-[320px] rounded-full border border-dashed border-white/10" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_2fr]">
            <div>
              <Link to="/public/home" className="inline-flex items-center gap-2.5">
                <img src="/netranova-icon.webp" alt="" className="h-10 w-10" />
                <span className="font-display text-2xl font-extrabold tracking-tight">NetraNova</span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
                Live, cohort-based tech learning — expert-led classes, weekly projects and certificates anyone can verify.
              </p>
              <Link to="/register" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20">
                Get notified about new cohorts <ArrowRight size={15} />
              </Link>
              {site?.phone && (
                <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="mt-6 flex items-center gap-3 text-sm text-white/70 hover:text-white">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10"><Phone size={15} className="text-qore-highlight" /></span>
                  <span>
                    {site.contactName && <span className="block text-xs text-white/45">{site.contactName}, NetraNova representative</span>}
                    <span className="font-semibold">{site.phone}</span>
                  </span>
                </a>
              )}
              <SocialLinks socials={site?.socials} className="mt-6" />
            </div>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              {footerColumns.map((col) => (
                <div key={col.title}>
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-qore-highlight">{col.title}</h4>
                  <ul className="space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.path} className="text-sm text-white/60 transition-colors hover:text-white">{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row">
            <p>© {new Date().getFullYear()} NetraNova · A product of <a href="https://netrasoft.co" className="text-white/60 hover:text-white">NetraSoft Solutions</a></p>
            <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {site?.termsText && <Link to="/public/terms" className="hover:text-white">Terms</Link>}
              {site?.privacyText && <Link to="/public/privacy" className="hover:text-white">Privacy</Link>}
              <span>Payments secured by Paystack</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
