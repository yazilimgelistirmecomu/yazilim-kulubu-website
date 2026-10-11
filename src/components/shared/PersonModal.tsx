import { Github, Globe, Instagram, Linkedin, Mail } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { safeHttpUrl } from '@/utils/slug';

/** Proje geliştiricisi ve ekip üyesi için ortak, sade kişi şekli. */
export interface PersonModalData {
  name: string;
  avatar_url: string | null;
  /** Rol / pozisyon */
  title?: string | null;
  /** Kol / ekip adı */
  tag?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  instagram_url?: string | null;
  website_url?: string | null;
}

export function PersonAvatar({ name, avatar_url, className = 'w-12 h-12 text-base' }: { name: string; avatar_url: string | null; className?: string }) {
  const src = safeHttpUrl(avatar_url);
  return src ? (
    <img src={src} alt={name} className={`${className} rounded-full object-cover border border-default shrink-0`} />
  ) : (
    <div className={`${className} rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-black flex items-center justify-center border border-default shrink-0`}>
      {name.trim().charAt(0).toLocaleUpperCase('tr-TR')}
    </div>
  );
}

export function PersonModal({ person, onClose }: { person: PersonModalData | null; onClose: () => void }) {
  if (!person) return null;

  const email = person.email?.trim();
  const links = [
    { label: 'E-posta', value: email, href: email ? `mailto:${email}` : null, text: email, Icon: Mail },
    { label: 'LinkedIn', value: person.linkedin_url, href: safeHttpUrl(person.linkedin_url), text: 'LinkedIn profili', Icon: Linkedin },
    { label: 'GitHub', value: person.github_url, href: safeHttpUrl(person.github_url), text: 'GitHub profili', Icon: Github },
    { label: 'Instagram', value: person.instagram_url, href: safeHttpUrl(person.instagram_url), text: 'Instagram profili', Icon: Instagram },
    { label: 'Web sitesi', value: person.website_url, href: safeHttpUrl(person.website_url), text: 'Kişisel web sitesi', Icon: Globe },
  ].filter((l) => l.value && l.href);

  return (
    <Modal isOpen onClose={onClose} title={person.name}>
      <div className="flex items-center gap-4 mb-6">
        <PersonAvatar name={person.name} avatar_url={person.avatar_url} className="w-16 h-16 text-2xl" />
        <div className="min-w-0">
          <p className="font-bold text-primary text-lg">{person.name}</p>
          {person.title && <p className="text-sm text-muted font-medium">{person.title}</p>}
          {person.tag && (
            <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
              {person.tag}
            </span>
          )}
        </div>
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-muted font-medium">İletişim bilgisi paylaşılmamış.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {links.map(({ label, href, text, Icon }) => (
            <li key={label}>
              <a
                href={href!}
                target={label === 'E-posta' ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-default hover:border-[var(--brand-primary)] transition-colors"
              >
                <Icon className="w-5 h-5 text-[var(--brand-primary)] shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-muted">{label}</span>
                  <span className="block text-sm font-bold text-primary truncate">{text}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
