import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SmartImage } from '@/components/shared/SmartImage';

interface LightboxProps {
  images: string[];
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
  alt?: string;
}

export function Lightbox({ images, index, onClose, onChange, alt = 'Görsel' }: LightboxProps) {
  const isOpen = index !== null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;

  const next = useCallback(() => {
    if (index !== null && count > 1) onChange((index + 1) % count);
  }, [index, count, onChange]);
  const prev = useCallback(() => {
    if (index !== null && count > 1) onChange((index - 1 + count) % count);
  }, [index, count, onChange]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, next, prev, onClose]);

  // Açıkken sayfa kaymasın; kapanınca odak önceki öğeye dönsün
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && index < count && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Görsel görüntüleyici"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-8 select-none"
          onClick={onClose}
        >
          <div className="w-full max-w-6xl flex items-center justify-between z-10 py-2" onClick={e => e.stopPropagation()}>
            <div className="text-white/80 font-mono text-sm font-semibold bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
              Görsel {index + 1} / {count}
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Kapat (ESC)"
              aria-label="Kapat"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative w-full max-w-6xl flex-1 flex items-center justify-between my-4 px-2 sm:px-12" onClick={e => e.stopPropagation()}>
            {count > 1 && (
              <button
                onClick={prev}
                className="absolute left-2 sm:left-4 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 shadow-2xl cursor-pointer"
                title="Önceki Görsel (← Sol Ok)"
                aria-label="Önceki görsel"
              >
                <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8 -ml-0.5" />
              </button>
            )}

            <div className="w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden">
              <SmartImage
                key={index}
                src={images[index]}
                alt={`${alt} ${index + 1}`}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>

            {count > 1 && (
              <button
                onClick={next}
                className="absolute right-2 sm:right-4 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 shadow-2xl cursor-pointer"
                title="Sonraki Görsel (→ Sağ Ok)"
                aria-label="Sonraki görsel"
              >
                <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8 -mr-0.5" />
              </button>
            )}
          </div>

          <div className="text-white/50 text-xs font-mono font-medium pb-2 text-center" onClick={e => e.stopPropagation()}>
            {count > 1 && <>Klavye Yön Tuşları <span className="text-white/90 bg-white/10 px-2 py-0.5 rounded border border-white/10">←</span> <span className="text-white/90 bg-white/10 px-2 py-0.5 rounded border border-white/10">→</span> veya butonlar ile gezinebilirsiniz. </>}
            Kapatmak için <span className="text-white/90 bg-white/10 px-2 py-0.5 rounded border border-white/10">ESC</span> tuşuna basın.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
