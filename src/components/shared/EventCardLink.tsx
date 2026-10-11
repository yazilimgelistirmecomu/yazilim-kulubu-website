import { Link } from 'react-router';

/** Etkinlik detay adresi. Slug yoksa id'ye düşer; EventDetail uuid'yi slug'a yönlendirir. */
export function eventPath(event: { slug?: string | null; id: string }) {
  return `/etkinlikler/${event.slug || event.id}`;
}

/**
 * Kartın tamamını tıklanabilir yapan "stretched link". Kartın `relative` olması gerekir.
 * Kart içindeki Kayıt Ol gibi düğmeler `relative z-20` ile bunun üstünde kalır,
 * böylece iç içe <a> olmadan kendi linklerine gider.
 */
export function EventCardLink({ event, className = 'rounded-3xl' }: { event: { slug?: string | null; id: string; title: string }; className?: string }) {
  return (
    <Link
      to={eventPath(event)}
      aria-label={`${event.title} etkinlik detayı`}
      className={`absolute inset-0 z-[15] focus-ring ${className}`}
    />
  );
}
