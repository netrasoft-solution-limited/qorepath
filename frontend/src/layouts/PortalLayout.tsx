import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
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

export function PortalLayout({ children, navItems, portalName }: PortalLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayName = user ? `${(user as any).firstName ?? ''} ${(user as any).lastName ?? ''}`.trim() || user.email : '';
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';
  const initials = displayName ? displayName.charAt(0).toUpperCase() : '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-qore-light/30 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-qore-dark text-white h-full shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <img src="/netranova-icon.webp" alt="NetraNova" className="h-9 w-9" />
          <span className="font-semibold text-lg tracking-wide">{portalName}</span>
        </div>

        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-qore-medium flex items-center justify-center text-white font-bold">
              {initials}
            </div>
            <div>
              <p className="font-medium text-sm">{displayName}</p>
              <p className="text-xs text-qore-highlight">{displayRole}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-qore-medium text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-qore-dark text-white z-30 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-2">
          <img src="/netranova-icon.webp" alt="NetraNova" className="h-7 w-7" />
          <span className="font-semibold text-sm">{portalName}</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-qore-dark text-white z-20 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${location.pathname === item.path ? 'bg-qore-medium text-white' : 'text-white/70'}`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 mt-8"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pt-16 md:pt-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{displayName}</span>
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
