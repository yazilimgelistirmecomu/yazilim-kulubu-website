import { Calendar, MapPin, Users, ArrowLeft, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import { eventService } from '@/api/services/events';
import { SmartImage } from '@/components/shared/SmartImage';
import { DatabaseError } from '@/components/shared/DatabaseError';
import { EventCountdown } from '@/components/shared/EventCountdown';
import { ImageCarousel } from '@/components/shared/ImageCarousel';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { withTimeout } from '@/utils/promise';
import { NotFound } from './NotFound';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function EventDetail() {
  const { slug = '' } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [redirectSlug, setRedirectSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEventDetails();
  }, [slug]);

  // Kapak + galeri tek görsel alanında; aynı görsel iki kez gösterilmez
  const images = useMemo<string[]>(() => {
    if (!event) return [];
    const all = [event.image_url, ...(event.gallery_urls || [])].filter(
      (u): u is string => typeof u === 'string' && u.trim() !== ''
    );
    return Array.from(new Set(all));
  }, [event]);

  const fetchEventDetails = async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setRedirectSlug(null);
    setEvent(null);
    try {
      let data = await withTimeout<any>(eventService.getEventBySlug(slug), 8000);
      // Eski /etkinlikler/:uuid linkleri → slug adresine yönlendir
      if (!data && UUID_PATTERN.test(slug)) {
        const found = await withTimeout<any>(eventService.getEventSlugById(slug), 8000);
        if (found) {
          setRedirectSlug(found);
          return;
        }
      }
      if (!data) {
        setNotFound(true);
        return;
      }
      setEvent(data);
    } catch (err) {
      console.error("Etkinlik detayı çekilemedi:", err);
      setError('Bağlantı Hatası: Etkinlik yüklenemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  if (redirectSlug) {
    return <Navigate to={`/etkinlikler/${redirectSlug}`} replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[var(--brand-primary)] bg-page">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-mono text-muted">Etkinlik Detayları Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page pt-24 flex items-center justify-center">
        <DatabaseError message={error} onRetry={fetchEventDetails} />
      </div>
    );
  }

  if (notFound || !event) return <NotFound />;

  const formattedDate = new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = new Date(event.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const isUpcoming = event.type !== 'past' && new Date(event.date).getTime() > Date.now();
  const canRegister = !!event.registration_url && event.type !== 'past';
  const hasImages = images.length > 0;
  const chip = 'flex items-center gap-2 bg-page/70 border border-default/60 px-3 py-1.5 rounded-xl backdrop-blur-md';

  return (
    <div className="min-h-screen bg-page pt-24 sm:pt-22">
      <section className="relative pt-20 sm:pt-28 pb-10 sm:pb-12 border-b border-default overflow-hidden bg-surface">
        {event.image_url && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <SmartImage
              src={event.image_url}
              alt=""
              className="w-full h-full object-cover filter blur-[3px] scale-105 opacity-45 dark:opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-page via-page/70 to-black/60" />
          </div>
        )}

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--brand-primary)]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-20">
          <Link
            to="/etkinlikler"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white mb-5 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Etkinliklere Dön
          </Link>

          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${event.type === 'featured' ? 'bg-[var(--brand-primary)] text-[var(--brand-text)] shadow-lg shadow-[var(--brand-primary)]/30' :
              event.type === 'upcoming' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30' :
                'bg-surface/80 border border-default text-muted'
              }`}>
              {event.type === 'featured' ? 'Öne Çıkan' : event.type === 'upcoming' ? 'Yaklaşan Etkinlik' : 'Geçmiş Etkinlik'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-5 text-primary max-w-4xl leading-tight">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-sm font-semibold text-muted">
            <div className={chip}>
              <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>{formattedDate}</span>
            </div>
            <div className={chip}>
              <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>{formattedTime}</span>
            </div>
            {event.location && (
              <div className={chip}>
                <MapPin className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>{event.location}</span>
              </div>
            )}
            {event.capacity && (
              <div className={chip}>
                <Users className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>{event.capacity} Kişilik Kontenjan</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 px-6 sm:px-8 lg:px-20">
        <div className={`max-w-[1280px] mx-auto grid grid-cols-1 gap-8 lg:gap-14 items-start ${hasImages ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]' : ''}`}>
          {/* Mobilde görsel alanı önce (order-first), masaüstünde sağ sütunda ve sticky */}
          {hasImages && (
            <aside className="order-first lg:order-last min-w-0 lg:sticky lg:top-28">
              <ImageCarousel images={images} alt={event.title} />
            </aside>
          )}

          <article className={`min-w-0 ${hasImages ? '' : 'max-w-[760px] mx-auto w-full'}`}>
            {(isUpcoming || canRegister) && (
              <div className="mb-8 p-5 sm:p-6 bg-surface border border-default rounded-dynamic shadow-sm">
                {isUpcoming && <EventCountdown date={event.date} className={canRegister ? 'mb-5' : ''} />}
                {canRegister && (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3.5 bg-[var(--brand-primary)] text-[var(--brand-text)] font-bold rounded-xl shadow-dynamic hover:bg-[var(--brand-primary-hover)] transition-all duration-200 focus-ring"
                  >
                    Kayıt Ol <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                )}
              </div>
            )}

            <div className="max-w-[68ch]">
              {event.description?.trim() ? (
                <MarkdownContent>{event.description}</MarkdownContent>
              ) : (
                <p className="text-muted font-medium">Detaylı açıklama bulunmuyor.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
