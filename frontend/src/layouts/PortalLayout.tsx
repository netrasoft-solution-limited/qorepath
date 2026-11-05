import React, { useEffect, useState } from 'react';
import { Avatar, EditableAvatar } from '../components/ProfilePhoto';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, X, Sparkles } from 'lucide-react';
import { NotificationBell } from '../components/NotificationBell';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}
interface PortalLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  portalName: string;
  userName: string;
  userRole: string;
}

// Shared shell for the learner, instructor and admin portals: a night-sky sidebar with a
// sliding glow on the current page, a frosted header with a greeting, and a soft aurora
// wash behind the content. Motion is kept slow and stops for reduced-motion users.

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const isActivePath = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`);

/** Stars, an orbit with a slow planet behind the logo, and a glow rising from the bottom. */
function SidebarSky() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="nn-stars absolute inset-0 opacity-50" />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/[0.06]" />
      <div className="absolute -left-24 -top-24 h-72 w-72">
        <div className="nn-spin h-full w-full" style={{ ['--nn-dur' as any]: '60s' }}>
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFB020] shadow-[0_0_12px_3px_rgba(255,176,32,0.5)]" />
        </div>
      </div>
      <div className="absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full border border-dashed border-white/[0.04]" />
      <div className="nn-aurora absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#1F5BFF]/30 blur-[90px]" />
      <div className="nn-aurora absolute -bottom-24 right-[-6rem] h-56 w-56 rounded-full bg-[#FF6A00]/15 blur-[80px]" style={{ animationDelay: '-8s' }} />
    </div>
  );
}

function NavLinks({ items, pathname, layoutId, onNavigate }: { items: NavItem[]; pathname: string; layoutId: string; onNavigate?: () => void }) {
  return (
    <>
      {items.map((item) => {
        const active = isActivePath(pathname, item.path);
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-[7px] text-sm font-medium transition-colors ${active ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.14] to-white/[0.03] shadow-[0_8px_24px_-12px_rgba(31,91,255,0.8)]"
              >
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#FFB020] to-[#FF6A00] shadow-[0_0_10px_rgba(255,176,32,0.8)]" />
              </motion.span>
            )}
            {!active && <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors group-hover:bg-white/[0.05]" />}
            <span className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${active ? 'bg-white/10 text-[#FFB020]' : 'text-white/55 group-hover:text-white'}`}>
              <item.icon size={16} />
            </span>
            <span className="relative transition-transform group-hover:translate-x-0.5">{item.name}</span>
          </Link>
        );
      })}
    </>
  );
}

function Brand({ portalName }: { portalName: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative">
        <span className="absolute inset-0 rounded-full bg-[#8CCBFF]/30 blur-md" />
        <img src="/netranova-icon.webp" alt="" className="relative h-9 w-9" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] font-extrabold tracking-tight">NetraNova</span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-[#8CCBFF]/80">{portalName.replace(/ Portal$/, '')}</span>
      </span>
    </div>
  );
}

export function PortalLayout({ children, navItems, portalName }: PortalLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayName = user ? `${(user as any).firstName ?? ''} ${(user as any).lastName ?? ''}`.trim() || user.email : '';
  const firstName = (user as any)?.firstName || displayName.split(' ')[0];
  const displayRole = user?.isSuperAdmin ? 'Super admin' : user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';
  const current = navItems.find((i) => isActivePath(location.pathname, i.path));
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => setIsMobileMenuOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userCard = (
    <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur">
      <EditableAvatar user={user} className="h-10 w-10 ring-2 ring-[#8CCBFF]/30" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{displayName}</p>
        <p className="flex items-center gap-1 text-xs text-[#8CCBFF]">
          {user?.isSuperAdmin && <Sparkles size={11} className="text-[#FFB020]" />}
          {displayRole}
        </p>
      </div>
      <button onClick={handleLogout} title="Log out" aria-label="Log out"
        className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white">
        <LogOut size={17} />
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6FB]">
      {/* Sidebar - Desktop */}
      <aside className="relative z-20 hidden h-full w-[17rem] shrink-0 flex-col overflow-hidden bg-[#071743] text-white shadow-[8px_0_40px_-20px_rgba(7,23,67,0.6)] md:flex">
        <SidebarSky />
        <div className="relative px-6 pb-5 pt-6">
          <Brand portalName={portalName} />
        </div>
        <div className="relative mx-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
          <NavLinks items={navItems} pathname={location.pathname} layoutId="nav-active" />
        </nav>

        <div className="relative p-3">{userCard}</div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between bg-[#071743] px-4 text-white shadow-md md:hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden><div className="nn-stars absolute inset-0 opacity-40" /></div>
        <div className="relative"><Brand portalName={portalName} /></div>
        <div className="relative flex items-center gap-1">
          <span className="[&>div>button]:text-white/80 [&>div>button:hover]:bg-white/10"><NotificationBell /></span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2" aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 z-20 flex flex-col overflow-hidden bg-[#071743] text-white md:hidden"
          >
            <SidebarSky />
            <nav className="relative flex-1 space-y-1 overflow-y-auto p-4">
              <NavLinks items={navItems} pathname={location.pathname} layoutId="nav-active-mobile" onNavigate={() => setIsMobileMenuOpen(false)} />
            </nav>
            <div className="relative p-4">{userCard}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="relative flex h-full flex-1 flex-col overflow-hidden pt-16 md:pt-0">
        {/* aurora wash and a faint dot grid behind the content */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-40 left-[10%] h-96 w-[40rem] rounded-full bg-[#1F5BFF]/[0.10] blur-[110px]" />
          <div className="absolute -top-32 right-[5%] h-80 w-[28rem] rounded-full bg-[#7B3FE4]/[0.08] blur-[110px]" />
          <div className="absolute top-24 right-[30%] h-64 w-72 rounded-full bg-[#FF6A00]/[0.06] blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage: 'radial-gradient(rgba(7,23,67,0.07) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              maskImage: 'linear-gradient(to bottom, black, transparent 60%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 60%)',
            }}
          />
        </div>

        <header className="relative z-10 hidden h-[4.5rem] shrink-0 items-center justify-between border-b border-white/60 bg-white/60 px-8 backdrop-blur-xl md:flex">
          <div className="min-w-0">
            <p className="truncate font-display text-[17px] font-bold tracking-tight text-qore-text">{current?.name ?? portalName}</p>
            <p className="truncate text-xs text-gray-500">
              {greeting()}{firstName ? `, ${firstName}` : ''} · {today}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="h-8 w-px bg-gray-200" />
            <Avatar user={user} className="h-9 w-9 text-sm ring-2 ring-white shadow" />
          </div>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-qore-medium/40 to-[#FF6A00]/30" />
        </header>

        <div className="relative flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-7xl"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
