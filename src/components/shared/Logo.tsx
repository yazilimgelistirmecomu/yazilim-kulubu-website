// Kulüp logosu tek yerden yönetilir. Yeni logo geldiğinde public/brand/ altındaki
// dosyaları (kare, şeffaf PNG; 96/192/384/768 px) değiştirmek yeterlidir.
const LOGO_SRCS = [
  { width: 96, src: '/brand/logo-96.png' },
  { width: 192, src: '/brand/logo-192.png' },
  { width: 384, src: '/brand/logo-384.png' },
  { width: 768, src: '/brand/logo-768.png' },
];

const LOGO_SRCSET = LOGO_SRCS.map(({ src, width }) => `${src} ${width}w`).join(', ');

export function Logo({ className = '', size = 40 }: { className?: string; size?: number }) {
  return (
    <img
      src="/brand/logo-192.png"
      srcSet={LOGO_SRCSET}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt="YGK Logo"
      decoding="async"
      className={`object-contain ${className}`}
    />
  );
}
