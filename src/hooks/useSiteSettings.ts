import { useEffect, useState } from 'react';
import { supabase } from '@/api/config';

export interface ContactSettings {
  email: string;
  instagram: string;
  youtube: string;
  linkedin: string;
}

/** site_settings boşken kullanılan tek varsayılan set (Footer, İletişim ve Ana sayfa ortak). */
export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  email: 'yazilimgelistirmecomu@gmail.com',
  instagram: 'https://www.instagram.com/comuyazilimgelistirme/?hl=tr',
  youtube: 'https://www.youtube.com/@comuyazilimgelistirme',
  linkedin: 'https://www.linkedin.com/company/%C3%A7om%C3%BC-yaz%C4%B1l%C4%B1m-geli%C5%9Ftirme-kul%C3%BCb%C3%BC/',
};

// Aynı sayfada birden fazla bileşen kullanınca tek istek atılsın.
let inflight: Promise<ContactSettings> | null = null;

function loadSettings(): Promise<ContactSettings> {
  if (!inflight) {
    inflight = (async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      const map: Record<string, string | null> = {};
      (data ?? []).forEach((item: any) => { map[item.key] = item.value; });
      return {
        email: map['contact_email'] || DEFAULT_CONTACT_SETTINGS.email,
        instagram: map['social_instagram'] || DEFAULT_CONTACT_SETTINGS.instagram,
        youtube: map['social_youtube'] || DEFAULT_CONTACT_SETTINGS.youtube,
        linkedin: map['social_linkedin'] || DEFAULT_CONTACT_SETTINGS.linkedin,
      };
    })();
    // Hata olursa sonraki mount tekrar denesin.
    inflight.catch(() => { inflight = null; });
  }
  return inflight;
}

export function useSiteSettings(): ContactSettings {
  const [settings, setSettings] = useState(DEFAULT_CONTACT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    loadSettings()
      .then((s) => { if (!cancelled) setSettings(s); })
      .catch((err) => console.error('Site ayarları çekilemedi:', err));
    return () => { cancelled = true; };
  }, []);

  return settings;
}
