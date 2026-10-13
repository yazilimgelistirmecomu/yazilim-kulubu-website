import { Link } from 'react-router';
import { Linkedin, Instagram, Youtube } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Logo } from '@/components/shared/Logo';

export function Footer() {
  const settings = useSiteSettings();

  return (
    <footer className="bg-surface border-t border-default transition-colors duration-300">
      <div className="max-w-[1280px] mx-auto px-8 lg:px-20 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 lg:gap-16 mb-8">

          {/* Brand & Info */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <Logo size={40} className="w-10 h-10 group-hover:scale-105 transition-transform" />
              <span className="text-lg font-bold text-primary tracking-tight">Yazılım Geliştirme Kulübü</span>
            </Link>
            <div className="text-sm font-medium text-muted">
              Çanakkale Onsekiz Mart Üniversitesi
            </div>
          </div>

          {/* İletişim */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-primary tracking-wider uppercase">İletişim</h4>
            <div className="flex flex-col gap-2 text-sm text-muted leading-relaxed">
              <span>Adres: Terzioğlu Kampüsü, 17100 Merkez/Çanakkale</span>
              <span className="font-mono text-sm">
                E-Posta: {settings.email}
              </span>
            </div>
          </div>

          {/* Bizi Takip Edin! */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-primary tracking-wider uppercase">Bizi Takip Edin!</h4>
            <p className="text-sm text-muted leading-relaxed">
              Bizi sosyal medya hesaplarımızdan takip edebilirsiniz.
            </p>
            <div className="flex items-center gap-7 text-muted mt-1">
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand-primary)] hover:scale-110 transition-all duration-200" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand-primary)] hover:scale-110 transition-all duration-200" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
              <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand-primary)] hover:scale-110 transition-all duration-200" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-default flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] font-semibold text-muted">
            © {new Date().getFullYear()} YGK. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-10 text-[13px] font-semibold text-muted">
            <Link to="/hakkimizda" className="hover:text-[var(--brand-primary)] transition-colors">Hakkımızda</Link>
            <Link to="/etkinlikler" className="hover:text-[var(--brand-primary)] transition-colors">Etkinlikler</Link>
            <Link to="/iletisim" className="hover:text-[var(--brand-primary)] transition-colors">İletişim</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
