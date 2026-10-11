import { motion } from 'motion/react';
import { MapPin, Mail, Clock, Send, ChevronDown, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/api/config';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getSocialPlatforms } from '@/utils/socialPlatforms';

export function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: 'uyelik',
    message: ''
  });

  const settings = useSiteSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const subjectMap: Record<string, string> = {
        'uyelik': 'Üyelik Hakkında',
        'etkinlik': 'Etkinlikler',
        'sponsorluk': 'Sponsorluk Görüşmesi',
        'proje': 'Proje İş Birliği',
        'medya': 'Medya / Basın',
        'diger': 'Diğer'
      };

      const finalMessage = `[Konu: ${subjectMap[formData.subject]}]\n\n${formData.message.trim()}`;

      const { error } = await supabase.from('applications').insert([
        {
          full_name: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          message: finalMessage,
          type: 'contact',
          status: 'pending'
        }
      ]);

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Mesaj gönderilemedi:", error);
      alert(
        ['submission_rate_limit', 'duplicate_submission', 'submission_capacity_limit'].includes(error?.message)
          ? "Bu e-posta adresinden kısa süre içinde zaten başvuru gönderilmiş. Lütfen daha sonra tekrar deneyin."
          : "Mesajınız gönderilemedi. Alanları kontrol edip tekrar deneyin."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const platforms = getSocialPlatforms(settings);

  return (
    <div className="min-h-screen bg-page transition-colors duration-300">
      <section className="pt-28 pb-16 px-4 sm:px-8 lg:px-20 bg-page">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[3.2fr_4.8fr_4fr] gap-12 lg:gap-16 items-start">

          {/* Left Column - Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="col-span-1 space-y-8"
          >
            <div>
              <h3 className="text-2xl font-bold mb-6 tracking-tight">İletişim Bilgileri</h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-default flex items-center justify-center flex-shrink-0 text-[var(--brand-primary)]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Adres</div>
                    <div className="text-sm font-medium text-primary">Terzioğlu Kampüsü<br />17100 Merkez/Çanakkale</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-default flex items-center justify-center flex-shrink-0 text-[var(--brand-primary)]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">E-posta</div>
                    <div className="text-sm font-medium text-primary break-all">{settings.email}</div>
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-8 border-t border-default">
              <div className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Hızlı Bağlantılar</div>
              <div className="space-y-3">
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSfuwWAWqtpjasdHr9SyZfBZt1LrPGmc2y80bfLXY1H-f7Hsrg/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-muted hover:text-[var(--brand-primary)] transition-colors group">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  Üyelik Başvurusu
                </a>
                <a href="/projeler" className="flex items-center gap-2 text-sm font-medium text-muted hover:text-[var(--brand-primary)] transition-colors group">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  Proje Gönder
                </a>
                <a href="/etkinlikler" className="flex items-center gap-2 text-sm font-medium text-muted hover:text-[var(--brand-primary)] transition-colors group">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  Etkinlik Kaydı
                </a>
              </div>
            </div>
          </motion.div>

          {/* Middle Column - Message Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-1 space-y-6"
          >
            <h3 className="text-2xl font-bold mb-6 tracking-tight">Mesaj Gönderin</h3>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center bg-surface border border-default rounded-xl p-8 shadow-dynamic"
              >
                <div className="w-20 h-20 bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold font-mono text-primary mb-3">status: 200 OK</h3>
                <p className="text-muted font-mono text-sm mb-8 max-w-[320px]">
                  // Mesajınız ulaştı. En kısa sürede döneceğiz.
                </p>
                <Button onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ fullName: '', email: '', subject: 'uyelik', message: '' });
                }} variant="secondary" className="font-bold border-default px-8 font-mono">
                  reset()
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="group">
                  <label className="block text-xs font-mono mb-2 text-muted transition-colors group-focus-within:text-[var(--brand-primary)]">
                    <span className="text-[var(--brand-primary)]">let</span> <span className="text-[var(--accent-fg)]">fullName</span>: string;
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-surface border border-default rounded-lg focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] focus:outline-none transition-all font-mono text-sm text-primary shadow-sm"
                    placeholder="'Adınız Soyadınız'"
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-mono mb-2 text-muted transition-colors group-focus-within:text-[var(--brand-primary)]">
                    <span className="text-[var(--brand-primary)]">const</span> <span className="text-[var(--accent-fg)]">email</span>: string;
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={254}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-surface border border-default rounded-lg focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] focus:outline-none transition-all font-mono text-sm text-primary shadow-sm"
                    placeholder="'ornek@email.com'"
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-mono mb-2 text-muted transition-colors group-focus-within:text-[var(--brand-primary)]">
                    <span className="text-[var(--brand-primary)]">let</span> <span className="text-[var(--accent-fg)]">subject</span>: string;
                  </label>
                  <Select value={formData.subject} onValueChange={(val) => setFormData({ ...formData, subject: val })}>
                    <SelectTrigger className="w-full px-4 py-3 bg-surface border border-default rounded-lg focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] focus:outline-none transition-all font-mono text-sm text-primary shadow-sm h-auto">
                      <SelectValue placeholder="Konu Seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-default font-mono text-sm shadow-xl rounded-lg overflow-hidden">
                      <SelectItem value="uyelik" className="focus:bg-[var(--brand-primary)]/10 focus:text-[var(--brand-primary)] cursor-pointer py-2.5">Üyelik Hakkında</SelectItem>
                      <SelectItem value="etkinlik" className="focus:bg-[var(--brand-primary)]/10 focus:text-[var(--brand-primary)] cursor-pointer py-2.5">Etkinlikler</SelectItem>
                      <SelectItem value="sponsorluk" className="focus:bg-[var(--brand-primary)]/10 focus:text-[var(--brand-primary)] cursor-pointer py-2.5">Sponsorluk Görüşmesi</SelectItem>
                      <SelectItem value="proje" className="focus:bg-[var(--brand-primary)]/10 focus:text-[var(--brand-primary)] cursor-pointer py-2.5">Proje İş Birliği</SelectItem>
                      <SelectItem value="medya" className="focus:bg-[var(--brand-primary)]/10 focus:text-[var(--brand-primary)] cursor-pointer py-2.5">Medya / Basın</SelectItem>
                      <SelectItem value="diger" className="focus:bg-[var(--brand-primary)]/10 focus:text-[var(--brand-primary)] cursor-pointer py-2.5">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="group">
                  <label className="block text-xs font-mono mb-2 text-muted transition-colors group-focus-within:text-[var(--brand-primary)]">
                    <span className="text-[var(--brand-primary)]">const</span> <span className="text-[var(--accent-fg)]">message</span>: string;
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-surface border border-default rounded-lg focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] focus:outline-none transition-all font-mono text-sm text-primary shadow-sm resize-none"
                    rows={4}
                    required
                    minLength={10}
                    maxLength={9500}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="// Mesajınızı buraya yazın..."
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} variant="primary" className="w-full rounded-lg py-4 font-bold shadow-md font-mono" size="lg">
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> await send()...</>
                  ) : (
                    <div className="flex items-center justify-center">
                      execute() <Send className="w-4 h-4 ml-2" />
                    </div>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Right Column - Map & FAQ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="col-span-1 space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold mb-6 tracking-tight">Konumumuz</h3>
              <div className="h-[380px] w-full rounded-dynamic overflow-hidden border border-default shadow-dynamic">
                <iframe
                  title="ÇOMÜ Bilgisayar Mühendisliği Bölümü Konumu"
                  src="https://maps.google.com/maps?q=%C3%87anakkale%20Onsekiz%20Mart%20%C3%9Cniversitesi%20M%C3%BChendislik%20Fak%C3%BCltesi%20Bilgisayar%20M%C3%BChendisli%C4%9Fi&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platform Cards */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 lg:px-20 bg-surface border-y border-default">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 sm:mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">Platformlarımız</h2>
            <p className="text-base sm:text-xl text-muted font-medium">Bizi sosyal medyadan takip edin ve büyük topluluğumuzun bir parçası olun</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((platform, idx) => (
              <motion.a
                key={idx}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-elevated border border-default rounded-dynamic p-8 hover:-translate-y-2 transition-all duration-300 hover:shadow-dynamic flex flex-col items-center text-center"
                style={{ '--platform-color': platform.color } as any}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = platform.color;
                  if (document.documentElement.classList.contains('dark')) {
                    e.currentTarget.style.boxShadow = `0 10px 40px -10px ${platform.color}40`;
                  } else {
                    e.currentTarget.style.boxShadow = `0 10px 40px -10px ${platform.color}30`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl bg-surface border border-default flex items-center justify-center mb-6 transition-colors duration-300"
                  style={{ color: platform.color }}
                >
                  <platform.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-primary">{platform.name}</h3>
                <p className="text-sm font-medium text-muted mb-4">{platform.desc}</p>
                <div className="w-full max-w-full mt-auto px-4 py-2 bg-surface rounded-full text-xs font-bold font-mono tracking-wide border border-default transition-colors group-hover:border-[var(--platform-color)] group-hover:text-[var(--platform-color)] truncate">
                  {platform.handle}
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
