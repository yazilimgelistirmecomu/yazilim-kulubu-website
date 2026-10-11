import { Link } from 'react-router';

/**
 * Kartın tamamını tıklanabilir yapan "stretched link". Kartın `relative` olması gerekir.
 * Kart içindeki Canlı Demo / GitHub düğmeleri `relative z-20` ile bunun üstünde kalır,
 * böylece iç içe <a> olmadan düğmeler kendi linkine gider.
 */
export function ProjectCardLink({ slug, title }: { slug?: string | null; title: string }) {
  if (!slug) return null;
  return (
    <Link
      to={`/projeler/${slug}`}
      aria-label={`${title} proje detayı`}
      className="absolute inset-0 z-[15] rounded-3xl focus-ring"
    />
  );
}
