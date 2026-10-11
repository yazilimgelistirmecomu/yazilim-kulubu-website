import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Users, ArrowLeft, ArrowRight, Clock, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { useState, useEffect, useCallback } from 'react';
import { eventService } from '@/api/services/events';
import { SmartImage } from '@/components/shared/SmartImage';
import { DatabaseError } from '@/components/shared/DatabaseError';
import { EventCountdown } from '@/components/shared/EventCountdown';
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchEventDetails();
  }, [slug]);

  const handleNextPhoto = useCallback(() => {
    if (!event?.gallery_urls) return;
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % event.gallery_urls.length));
  }, [event]);

  const handlePrevPhoto = useCallback(() => {
    if (!event?.gallery_urls) return;
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + event.gallery_urls.length) % event.gallery_urls.length));
  }, [event]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        handleNextPhoto();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handleNextPhoto, handlePrevPhoto]);

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

  return (
    <div className="min-h-screen bg-page pt-24 sm:pt-22">
      {/* Clean Header with Background Photo */}
      <section className="relative pt-32 sm:pt-48 pb-16 sm:pb-20 border-b border-default overflow-hidden bg-surface">
        {/* Photo Background (Recognizable with subtle blur & dark overlay) */}
        {event.image_url && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <SmartImage
              src={event.image_url}
              alt=""
              className="w-full h-full object-cover filter blur-[3px] scale-105 opacity-45 dark:opacity-35 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-page via-page/70 to-black/60" />
          </div>
        )}

        {/* Accent Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--brand-primary)]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--brand-primary)]/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-20">
          <Link
            to="/etkinlikler"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Etkinliklere Dön
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${event.type === 'featured' ? 'bg-[var(--brand-primary)] text-[var(--brand-text)] shadow-lg shadow-[var(--brand-primary)]/30' :
              event.type === 'upcoming' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30' :
                'bg-surface/80 border border-default text-muted'
              }`}>
              {event.type === 'featured' ? 'Öne Çıkan' : event.type === 'upcoming' ? 'Yaklaşan Etkinlik' : 'Geçmiş Etkinlik'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 text-primary max-w-4xl leading-tight">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-sm font-semibold text-muted">
            <div className="flex items-center gap-2.5 bg-page/70 border border-default/60 px-3.5 py-2 rounded-xl backdrop-blur-md">
              <Calendar className="w-5 h-5 text-[var(--brand-primary)]" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-page/70 border border-default/60 px-3.5 py-2 rounded-xl backdrop-blur-md">
              <Clock className="w-5 h-5 text-[var(--brand-primary)]" />
              <span>{formattedTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2.5 bg-page/70 border border-default/60 px-3.5 py-2 rounded-xl backdrop-blur-md">
                <MapPin className="w-5 h-5 text-[var(--brand-primary)]" />
                <span>{event.location}</span>
              </div>
            )}
            {event.capacity && (
              <div className="flex items-center gap-2.5 bg-page/70 border border-default/60 px-3.5 py-2 rounded-xl backdrop-blur-md">
                <Users className="w-5 h-5 text-[var(--brand-primary)]" />
                <span>{event.capacity} Kişilik Kontenjan</span>
              </div>
            )}
          </div>

          {isUpcoming && <EventCountdown date={event.date} className="mt-10" />}

          {event.registration_url && event.type !== 'past' && (
            <div className="mt-10">
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--brand-primary)] text-[var(--brand-text)] font-bold rounded-xl shadow-dynamic hover:bg-[var(--brand-primary-hover)] transition-all transform hover:-translate-y-0.5 duration-200"
              >
                Kayıt Ol <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 sm:py-24 px-6 sm:px-8 lg:px-20 bg-page">
        <div className="max-w-[800px] mx-auto">
          <p className="text-lg sm:text-2xl text-primary leading-relaxed font-medium whitespace-pre-line">
            {event.description || 'Detaylı açıklama bulunmuyor.'}
          </p>
        </div>
      </section>

      {/* Photo Gallery */}
      {event.gallery_urls && event.gallery_urls.length > 0 && (
        <section className="py-16 sm:py-24 px-6 sm:px-8 lg:px-20 bg-surface border-t border-default">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Etkinlik Galerisi</h2>
                <p className="text-muted font-medium">O günden geriye kalan güzel anılarımız</p>
              </div>
              <div className="w-12 h-12 bg-page border border-default rounded-full flex items-center justify-center text-[var(--brand-primary)]">
                <ImageIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {event.gallery_urls.map((photo: string, idx: number) => (
                <motion.div
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="group relative rounded-dynamic overflow-hidden border border-default bg-page aspect-[4/3] shadow-sm hover:shadow-dynamic transition-all cursor-pointer"
                >
                  <SmartImage
                    src={photo}
                    alt={`${event.title} Anısı ${idx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-bold text-sm drop-shadow-md pointer-events-none flex items-center gap-2">
                    Görseli Büyüt
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && event.gallery_urls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-8 select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Lightbox Header Bar */}
            <div
              className="w-full max-w-6xl flex items-center justify-between z-10 py-2"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-white/80 font-mono text-sm font-semibold bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                Görsel {lightboxIndex + 1} / {event.gallery_urls.length}
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Kapat (ESC)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lightbox Image View & Prev/Next Arrows */}
            <div
              className="relative w-full max-w-6xl flex-1 flex items-center justify-between my-4 px-2 sm:px-12"
              onClick={e => e.stopPropagation()}
            >
              {/* Prev Button */}
              {event.gallery_urls.length > 1 && (
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-2 sm:left-4 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 shadow-2xl cursor-pointer"
                  title="Önceki Görsel (← Sol Ok)"
                >
                  <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8 -ml-0.5" />
                </button>
              )}

              {/* Main Image */}
              <div className="w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden">
                <SmartImage
                  key={lightboxIndex}
                  src={event.gallery_urls[lightboxIndex]}
                  alt={`Görsel ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              </div>

              {/* Next Button */}
              {event.gallery_urls.length > 1 && (
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-2 sm:right-4 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 shadow-2xl cursor-pointer"
                  title="Sonraki Görsel (→ Sağ Ok)"
                >
                  <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8 -mr-0.5" />
                </button>
              )}
            </div>

            {/* Lightbox Footer Instruction */}
            <div
              className="text-white/50 text-xs font-mono font-medium pb-2 text-center"
              onClick={e => e.stopPropagation()}
            >
              Klavye Yön Tuşları <span className="text-white/90 bg-white/10 px-2 py-0.5 rounded border border-white/10">←</span> <span className="text-white/90 bg-white/10 px-2 py-0.5 rounded border border-white/10">→</span> veya butonlar ile gezinebilirsiniz. Kapatmak için <span className="text-white/90 bg-white/10 px-2 py-0.5 rounded border border-white/10">ESC</span> tuşuna basın.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
