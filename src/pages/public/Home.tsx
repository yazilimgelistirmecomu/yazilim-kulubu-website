import { motion } from 'motion/react';
import { ArrowRight, Rocket, Brain, Zap, Globe, Users, Trophy, Youtube, Linkedin, Instagram, Image as ImageIcon, Calendar, Clock, MapPin, Mail } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/shared/Button';
import { useState, useEffect, useRef } from 'react';
import { NetworkBackground } from '@/components/layout/NetworkBackground';
import { MatrixBackground } from '@/components/layout/MatrixBackground';
import { GlowingOrbsBackground } from '@/components/layout/GlowingOrbsBackground';
import { projectService } from '@/api/services/projects';
import { eventService } from '@/api/services/events';
import { ProjectCardLink } from '@/components/shared/ProjectCardLink';
import { teamService, type PublicTeamMember } from '@/api/services/team';
import { TeamMemberCard } from '@/components/shared/TeamMemberCard';
import { PersonModal } from '@/components/shared/PersonModal';
import { previewMembers, memberToPerson } from '@/utils/teamHierarchy';
import { Reveal } from '@/components/shared/Reveal';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getSocialPlatforms } from '@/utils/socialPlatforms';
import { EventCardLink, eventPath } from '@/components/shared/EventCardLink';

function CountUp({ target, suffix, label, delay = 0 }: { target: number; suffix: string; label: string; delay?: number }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1200;
          const start = performance.now();
          setTimeout(() => {
            const animate = (now: number) => {
              const elapsed = now - start - delay;
              if (elapsed < 0) { requestAnimationFrame(animate); return; }
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 4);
              setCount(Math.round(eased * target));
              if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }, delay);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, delay, hasAnimated]);

  return (
    <div ref={ref} className="text-center px-2">
      <div className="text-3xl md:text-5xl font-black text-primary tracking-tighter">
        {count}{suffix}
      </div>
      <div className="text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

export function Home() {
  const [animatedText, setAnimatedText] = useState('');
  const words = ['işbirliği yap,', 'öğren,', 'inşa et,'];
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([]);

  const [featuredEvent, setFeaturedEvent] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    eventService.getHomepageFeaturedEvent()
      .then(data => { if (!cancelled) setFeaturedEvent(data ?? null); })
      .catch(err => console.error('Öne çıkan etkinlik çekilemedi:', err));
    return () => { cancelled = true; };
  }, []);

  const TEAM_PREVIEW_COUNT = 4;
  const [teamPreview, setTeamPreview] = useState<PublicTeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<PublicTeamMember | null>(null);
  const siteSettings = useSiteSettings();
  const platforms = getSocialPlatforms(siteSettings);

  useEffect(() => {
    let cancelled = false;
    teamService.getPublicMembers()
      .then(data => { if (!cancelled) setTeamPreview(previewMembers(data, TEAM_PREVIEW_COUNT)); })
      .catch(err => console.error('Ana sayfa ekibi çekilemedi:', err));
    return () => { cancelled = true; };
  }, []);

  const [eventCandidates, setEventCandidates] = useState<{ upcoming: any[]; past: any[] }>({ upcoming: [], past: [] });

  useEffect(() => {
    let cancelled = false;
    eventService.getHomepageEventCandidates(3)
      .then(data => { if (!cancelled) setEventCandidates(data); })
      .catch(err => console.error('Ana sayfa etkinlikleri çekilemedi:', err));
    return () => { cancelled = true; };
  }, []);

  // Önce yaklaşanlar, 3'ü doldurmazsa en yeni geçmişler; öne çıkan kartta görünen etkinlik tekrarlanmaz
  const homeEvents = [
    ...eventCandidates.upcoming.map(e => ({ ...e, isPast: false })),
    ...eventCandidates.past.map(e => ({ ...e, isPast: true })),
  ].filter(e => e.id !== featuredEvent?.id).slice(0, 3);

  useEffect(() => {
    let cancelled = false;
    projectService.getHomepageProjects()
      .then(data => { if (!cancelled) setFeaturedProjects(data ?? []); })
      .catch(err => console.error('Ana sayfa projeleri çekilemedi:', err));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const currentWord = words[wordIndex];

    if (!isDeleting && animatedText === currentWord) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && animatedText === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setAnimatedText(prev => {
        if (isDeleting) {
          return prev.slice(0, -1);
        } else {
          return currentWord.slice(0, prev.length + 1);
        }
      });
    }, isDeleting ? 60 : 100);

    return () => clearTimeout(timeout);
  }, [animatedText, isDeleting, wordIndex]);

  return (
    <div className="min-h-screen">
      <style>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .typewriter-cursor {
          animation: cursor-blink 0.8s infinite;
        }
      `}</style>
      {/* Centered Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-page transition-colors duration-300 text-center px-4 sm:px-8 pt-20">
        <NetworkBackground />

        <div className="relative z-10 max-w-[900px] mx-auto flex flex-col items-center">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[3.1rem] xs:text-5xl sm:text-6xl md:text-8xl font-black leading-[1.12] tracking-tighter mb-8"
          >
            <span className="whitespace-nowrap">Kod yaz,</span><br />
            <span className="text-[var(--brand-primary)] relative inline-flex items-center whitespace-nowrap">
              {animatedText}
              <span className="inline-block w-[3px] md:w-[5px] h-[0.9em] bg-[var(--brand-primary)] ml-1 typewriter-cursor align-middle" />
            </span><br />
            <span className="whitespace-nowrap">değişim yarat.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base sm:text-lg md:text-[22px] text-muted mb-8 sm:mb-12 max-w-[650px] leading-relaxed font-medium px-2 sm:px-0"
          >
            Projeler inşa et, arkadaşlıklar kur ve geleceği bizimle kodla. ÇOMÜ'nün en büyük geliştirici topluluğuna bugün katıl!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 mb-8 sm:mb-14 w-full sm:w-auto max-w-[340px] sm:max-w-none"
          >
            <Button href="https://docs.google.com/forms/d/e/1FAIpQLSfuwWAWqtpjasdHr9SyZfBZt1LrPGmc2y80bfLXY1H-f7Hsrg/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" variant="primary" size="lg" className="rounded-dynamic shadow-dynamic px-8 sm:px-10 h-12 sm:h-14 text-base sm:text-lg w-full sm:w-auto font-bold">
              Bize Katıl
            </Button>
            <Button asLink href="/iletisim" variant="secondary" size="lg" className="rounded-dynamic px-8 sm:px-10 h-12 sm:h-14 text-base sm:text-lg border-default w-full sm:w-auto font-bold bg-surface hover:bg-elevated transition-colors">
              İletişime Geç
            </Button>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex flex-wrap justify-center items-center gap-6 text-muted font-medium mb-6 sm:mb-8"
          >
            <a href="#" className="icon-interactive flex items-center gap-3"><Instagram className="w-5 h-5 sm:w-6 sm:h-6" /></a>
            <a href="#" className="icon-interactive flex items-center gap-3"><Youtube className="w-5 h-5 sm:w-6 sm:h-6" /></a>
            <a href="#" className="icon-interactive flex items-center gap-3"><Linkedin className="w-5 h-5 sm:w-6 sm:h-6" /></a>
          </motion.div>
        </div>
      </section>

      {/* Featured Event (hidden when none is selected or its date has passed) */}
      {featuredEvent && (
      <section className="py-16 sm:py-20 px-4 sm:px-8 lg:px-20 bg-page transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to={eventPath(featuredEvent)}
              className="group grid grid-cols-1 lg:grid-cols-12 bg-elevated border border-default hover:border-[var(--brand-primary)] rounded-dynamic overflow-hidden shadow-dynamic card-interactive transition-colors"
            >
              {featuredEvent.image_url && (
                <div className="relative lg:col-span-5 aspect-[16/9] lg:aspect-auto lg:min-h-[280px] bg-surface overflow-hidden">
                  <img
                    src={featuredEvent.image_url}
                    alt={featuredEvent.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className={`${featuredEvent.image_url ? 'lg:col-span-7' : 'lg:col-span-12'} p-6 sm:p-10 flex flex-col justify-center`}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-primary)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--brand-primary)]"></span>
                  </span>
                  <span className="text-sm font-bold text-[var(--brand-primary)] tracking-widest uppercase">Öne Çıkan Etkinlik</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4 group-hover:text-[var(--brand-primary)] transition-colors">{featuredEvent.title}</h2>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-muted mb-4">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
                    {new Date(featuredEvent.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
                    {new Date(featuredEvent.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {featuredEvent.location && (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--brand-primary)]" /> {featuredEvent.location}
                    </span>
                  )}
                </div>
                {featuredEvent.description && (
                  <p className="text-base text-muted leading-relaxed font-medium line-clamp-3 mb-6 whitespace-pre-line">{featuredEvent.description}</p>
                )}
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-primary)] mt-auto">
                  Detayları İncele <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>
      )}

      {/* Stats */}
      <section className="border-y border-default bg-surface py-14 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-8 lg:px-20">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-0">
            <div className="md:pr-12 md:border-r border-default flex-shrink-0 text-center md:text-left">
              <p className="text-xl md:text-2xl font-black tracking-tight leading-snug">
                Birlikte büyüyen<br className="hidden md:block" /> bir topluluk.
              </p>
            </div>
            <div className="flex-1 flex items-center justify-around w-full">
              {[
                { target: 800, suffix: '+', label: 'Aktif Üye' },
                { target: 10, suffix: '+', label: 'Tamamlanan Proje' },
                { target: 4, suffix: '', label: 'Ana Kol' },
                { target: 5, suffix: '+', label: 'Büyük Etkinlik' },
              ].map((stat, idx) => (
                <CountUp key={idx} target={stat.target} suffix={stat.suffix} label={stat.label} delay={idx * 100} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section (hidden when no project is selected) */}
      {featuredProjects.length > 0 && (
      <section className="py-24 px-8 lg:px-20 bg-page transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-bold mb-2">Öne Çıkan Projeler</h2>
              <p className="text-lg text-muted">Kulübümüzün son dönemde geliştirdiği uygulamalar</p>
            </div>
            <Button variant="secondary" asLink href="/projeler" className="rounded-dynamic border-default">
              Tümünü Gör <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-elevated border border-default rounded-dynamic overflow-hidden shadow-dynamic flex flex-col card-interactive"
              >
                <ProjectCardLink slug={project.slug} title={project.title} />
                {/* Real Image Placeholder instead of fake code block */}
                <div className="relative aspect-[4/3] bg-surface overflow-hidden">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted font-bold opacity-50">Görsel Yok</div>
                  )}
                  <div className="absolute top-4 left-4">
                    {/* Badge removed completely per user request */}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-3">{project.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                    {(project.tech_stack ?? []).map((t: string) => (
                      <span key={t} className="px-3 py-1 bg-surface border border-default text-muted font-mono text-xs rounded-dynamic">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-default">
                    <span className="text-sm font-medium text-muted">{project.is_club_project ? 'Kulüp Projesi' : 'Üye Projesi'}</span>
                    <a
                      href={project.demo_url || project.github_url || '/projeler'}
                      {...(project.demo_url || project.github_url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="relative z-20 text-sm font-bold text-[var(--brand-primary)] hover:text-primary flex items-center gap-1 transition-colors">
                      İncele <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Events Section (hidden when there are no events) */}
      {homeEvents.length > 0 && (
      <section className="py-24 px-8 lg:px-20 bg-surface border-t border-default transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-bold mb-2">Etkinlikler</h2>
              <p className="text-lg text-muted">Yaklaşan ve son dönemde düzenlediğimiz etkinlikler</p>
            </div>
            <Button variant="secondary" asLink href="/etkinlikler" className="rounded-dynamic border-default">
              Tüm Etkinlikler <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {homeEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-elevated border border-default rounded-dynamic overflow-hidden shadow-dynamic flex flex-col card-interactive"
              >
                <EventCardLink event={event} className="rounded-dynamic" />
                <div className="relative aspect-[4/3] bg-surface overflow-hidden">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted font-bold opacity-50">Görsel Yok</div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-3 line-clamp-2">{event.title}</h3>
                  <div className="flex flex-col gap-2 text-sm font-medium text-muted mb-6 mt-auto">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
                      {new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[var(--brand-primary)]" /> {event.location}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-default">
                    <span className="text-sm font-medium text-muted">{event.isPast ? 'Geçmiş Etkinlik' : 'Yaklaşan Etkinlik'}</span>
                    <Link
                      to={eventPath(event)}
                      className="relative z-20 text-sm font-bold text-[var(--brand-primary)] hover:text-primary flex items-center gap-1 transition-colors">
                      İncele <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Team Section (hidden when there are no public members) */}
      {teamPreview.length > 0 && (
      <section className="py-24 px-4 sm:px-8 lg:px-20 bg-page border-t border-default transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto">
          <Reveal className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">Ekibimiz</h2>
              <p className="text-base sm:text-lg text-muted">Kulübü birlikte ileri taşıyan ekibimizle tanışın</p>
            </div>
            <Button variant="secondary" asLink href="/ekibimiz" className="rounded-dynamic border-default">
              Tüm Ekip <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 justify-items-center">
            {teamPreview.map((member, idx) => (
              <TeamMemberCard key={member.public_id} member={member} onSelect={setSelectedMember} delay={idx * 0.1} />
            ))}
          </div>
        </div>
        <PersonModal person={selectedMember && memberToPerson(selectedMember)} onClose={() => setSelectedMember(null)} />
      </section>
      )}

      {/* Contact Section */}
      <section className="py-24 px-4 sm:px-8 lg:px-20 bg-surface border-t border-default transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Bir fikrin mi var? Bize yaz.</h2>
            <p className="text-base sm:text-lg text-muted">Sorularını, önerilerini ya da projelerini bizimle paylaş; en kısa sürede dönüş yapalım.</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto mb-10">
            {[
              { name: 'E-posta', handle: siteSettings.email, url: `mailto:${siteSettings.email}`, icon: Mail, color: 'var(--brand-primary)', external: false },
              ...platforms.map(p => ({ ...p, external: true })),
            ].map((item, idx) => (
              <Reveal key={item.name} delay={idx * 0.1}>
                <a
                  href={item.url}
                  {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group h-full bg-elevated border border-default rounded-dynamic p-5 flex flex-col items-center text-center card-interactive"
                >
                  <div className="w-12 h-12 rounded-xl bg-surface border border-default flex items-center justify-center mb-3" style={{ color: item.color }}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-primary mb-1">{item.name}</h3>
                  <p className="text-xs font-mono text-muted break-all line-clamp-2">{item.handle}</p>
                </a>
              </Reveal>
            ))}
          </div>

          <Reveal className="text-center">
            <Button asLink href="/iletisim" size="lg" className="rounded-dynamic px-8 font-bold">
              İletişime Geç <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
