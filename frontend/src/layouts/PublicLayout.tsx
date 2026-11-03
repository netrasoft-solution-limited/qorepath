import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/public/home' },
    { name: 'About Us', path: '/public/about' },
    { name: 'Courses', path: '/public/courses' },
    { name: 'Pricing', path: '/public/tracks' },
    { name: 'Verify', path: '/public/verify' },
  ];

  const handleDashboard = () => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'admin') navigate('/admin/dashboard');
    else if (user.role === 'instructor') navigate('/instructor/dashboard');
    else navigate('/learner/dashboard');
  };

  const footerColumns = [
    {
      title: 'Tracks',
      links: [
        { label: 'Frontend Engineering', path: '/public/courses' },
        { label: 'Backend Engineering', path: '/public/courses' },
        { label: 'Product Design', path: '/public/courses' },
        { label: 'Data Analysis', path: '/public/courses' },
        { label: 'Cloud Engineering', path: '/public/courses' },
        { label: 'Cybersecurity', path: '/public/courses' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/public/about' },
        { label: 'Blog', path: '/public/about' },
        { label: 'Careers', path: '/public/about' },
        { label: 'Contact Us', path: '/public/about' },
        { label: 'Partner With Us', path: '/public/about' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', path: '/public/about' },
        { label: 'Verify Certificate', path: '/public/verify' },
        { label: 'Refund Policy', path: '/public/about' },
        { label: 'Terms of Service', path: '/public/about' },
        { label: 'Privacy Policy', path: '/public/about' },
      ],
    },
    {
      title: 'Quick Links',
      links: [
        { label: 'Log In', path: '/login' },
        { label: 'Register', path: '/register' },
        { label: 'My Dashboard', path: '/learner/dashboard' },
        { label: 'Course Catalogue', path: '/public/courses' },
        { label: 'Pricing', path: '/public/tracks' },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Navbar ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/public/home" className="flex items-center gap-2">
              <img src="/qorepath.webp" alt="QorePath" className="h-7" />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    (link.path === '/public/tracks' && location.pathname === '/public/tracks') ||
                    (link.path === '/public/home' && location.pathname === '/public/home' && link.name === 'Home')
                      ? 'text-qore-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <button
                  onClick={handleDashboard}
                  className="text-sm font-medium text-gray-600 hover:text-qore-dark px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Go to Dashboard
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Log In
                </Link>
              )}
              <Link
                to="/register"
                className="bg-qore-medium hover:bg-qore-dark text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
              >
                Register
              </Link>
            </div>

            <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {link.name}
                </Link>
              ))}
              <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3 px-3">
                {user ? (
                  <button
                    onClick={() => { setIsMenuOpen(false); handleDashboard(); }}
                    className="text-center py-3 text-base font-medium text-gray-700 border border-gray-200 rounded-xl"
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-center py-3 text-base font-medium text-gray-700 border border-gray-200 rounded-xl"
                  >
                    Log In
                  </Link>
                )}
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-center py-3 text-base font-medium text-white bg-qore-medium rounded-full"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top row: logo + social */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <Link to="/public/home">
              <img src="/qorepath.webp" alt="QorePath" className="h-7" />
            </Link>
            <div className="flex items-center gap-3">
              {[
                { Icon: Facebook, label: 'Facebook' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' },
                { Icon: Youtube, label: 'YouTube' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-qore-medium hover:border-qore-medium transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-bold text-gray-900 mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.path}
                        className="text-sm text-gray-500 hover:text-qore-medium transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-400">
            <p>© All rights reserved <span className="font-semibold text-gray-600">QorePath</span> 2026.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-gray-600 transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
