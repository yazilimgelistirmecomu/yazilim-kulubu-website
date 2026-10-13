import { Link, useLocation } from 'react-router';
import { Button } from '@/components/shared/Button';
import { Logo } from '@/components/shared/Logo';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Navbar() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { name: 'Anasayfa', path: '/' },
    { name: 'Hakkımızda', path: '/hakkimizda' },
    { name: 'Ekibimiz', path: '/ekibimiz' },
    { name: 'Etkinlikler', path: '/etkinlikler' },
    { name: 'Projeler', path: '/projeler' },
    { name: 'İletişim', path: '/iletisim' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'h-20 bg-page/90 backdrop-blur-lg border-b border-default shadow-sm'
        : 'h-28 bg-transparent border-transparent'
        }`}>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size={48} className="w-10 h-10 md:w-12 md:h-12 transition-transform group-hover:scale-105 flex-shrink-0" />
            <span className="text-base md:text-xl font-bold text-primary tracking-tight">Yazılım Geliştirme Kulübü</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-base font-medium nav-link-animated ${location.pathname === link.path
                  ? 'text-[var(--brand-primary)] active'
                  : 'text-muted hover:text-primary'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-surface text-muted icon-interactive focus-ring"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            {/* Hamburger — only on mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-surface text-muted hover:text-primary transition-colors"
              aria-label="Menüyü Aç"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[80vw] max-w-[340px] flex flex-col bg-page border-l border-default shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-6 border-b border-default">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <Logo size={36} className="w-9 h-9" />
            <span className="font-bold text-primary text-sm leading-tight">Yazılım Geliştirme<br />Kulübü</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-full hover:bg-surface text-muted hover:text-primary transition-colors cursor-pointer"
            aria-label="Menüyü Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navLinks.map((link, idx) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              style={{ transitionDelay: mobileOpen ? `${idx * 40}ms` : '0ms' }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${location.pathname === link.path
                ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                : 'text-primary hover:bg-surface hover:text-[var(--brand-primary)]'
                } ${mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
            >
              {location.pathname === link.path && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] flex-shrink-0" />
              )}
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Drawer Footer */}
        <div className="px-6 py-6 border-t border-default">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-surface text-muted hover:text-primary transition-colors font-semibold text-sm"
            >
              {theme === 'dark'
                ? <><Sun className="w-5 h-5" /> Açık Tema</>
                : <><Moon className="w-5 h-5" /> Koyu Tema</>
              }
            </button>
          )}
        </div>
      </div>
    </>
  );
}
