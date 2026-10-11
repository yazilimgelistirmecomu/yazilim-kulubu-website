import { Instagram, Linkedin, Youtube } from 'lucide-react';
import type { ContactSettings } from '@/hooks/useSiteSettings';

const withProtocol = (url: string) => (url.startsWith('http') ? url : `https://${url}`);
const toHandle = (url: string) => url.replace('https://', '').replace('www.', '');

/** İletişim sayfası ve ana sayfa bölümünün paylaştığı sosyal platform listesi. */
export function getSocialPlatforms(settings: ContactSettings) {
  return [
    { name: 'Instagram', handle: toHandle(settings.instagram), url: withProtocol(settings.instagram), icon: Instagram, color: '#E1306C', desc: 'Güncel haberler ve duyurular' },
    { name: 'YouTube', handle: toHandle(settings.youtube), url: withProtocol(settings.youtube), icon: Youtube, color: '#FF0000', desc: 'Eğitim videoları ve etkinlik kayıtları' },
    { name: 'LinkedIn', handle: toHandle(settings.linkedin), url: withProtocol(settings.linkedin), icon: Linkedin, color: '#0A66C2', desc: 'Profesyonel ağımız' },
  ];
}
