import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { SmartImage } from '@/components/shared/SmartImage';
import { Lightbox } from '@/components/shared/Lightbox';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Otomatik kaydırma yok. Kaydırma CSS scroll-snap ile yapılır (dokunmatik kaydırma tarayıcıdan gelir).
export function ImageCarousel({ images, alt, className = '' }: ImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const count = images.length;

  useEffect(() => {
    setActive(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [images.join('|')]);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.max(0, Math.min(count - 1, i));
    track.scrollTo({ left: target * track.clientWidth, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    setActive(target);
  }, [count]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== active) setActive(i);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (count < 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); }
  };

  if (count === 0) return null;

  const arrowClass = 'hidden lg:flex absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface hover:bg-[var(--brand-primary)] hover:text-[var(--brand-text)] border border-default text-primary shadow-sm items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none focus-ring';

  return (
    <div className={className}>
      <div className="relative">
      <div
        className="relative group rounded-dynamic overflow-hidden border border-default shadow-dynamic bg-surface"
        role="region"
        aria-roledescription="carousel"
        aria-label={alt}
        tabIndex={count > 1 ? 0 : -1}
        onKeyDown={handleKeyDown}
      >
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={`${alt} görseli ${i + 1} / ${count}, büyütmek için tıklayın`}
              aria-hidden={i !== active ? true : undefined}
              tabIndex={i === active ? 0 : -1}
              className="relative shrink-0 w-full aspect-[4/3] snap-center cursor-zoom-in bg-surface"
            >
              <SmartImage
                src={src}
                alt={`${alt} ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        <div className="pointer-events-none absolute top-3 right-3 w-9 h-9 rounded-full bg-black/55 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4" />
        </div>

        {count > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm sm:hidden">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Oklar çerçevenin dışında (yalnızca geniş ekranda; küçük ekranda kaydırma ve göstergeler var) */}
      {count > 1 && (
        <>
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} className={`${arrowClass} -left-[3.25rem]`} aria-label="Önceki görsel">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active === count - 1} className={`${arrowClass} -right-[3.25rem]`} aria-label="Sonraki görsel">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      </div>

      {count > 1 && (
        <div className="hidden sm:flex gap-2 mt-3 overflow-x-auto pb-1" role="tablist" aria-label="Görsel önizlemeleri">
          {images.map((src, i) => (
            <button
              key={`${src}-thumb-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Görsel ${i + 1}`}
              onClick={() => goTo(i)}
              className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 bg-surface cursor-pointer transition-all focus-ring ${i === active ? 'border-[var(--brand-primary)]' : 'border-default opacity-70 hover:opacity-100'}`}
            >
              <SmartImage src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Lightbox images={images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onChange={setLightboxIndex} alt={alt} />
    </div>
  );
}
