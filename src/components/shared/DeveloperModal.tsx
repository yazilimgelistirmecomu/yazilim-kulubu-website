import { Github, Globe, Instagram, Linkedin, Mail } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { safeHttpUrl } from '@/utils/slug';
import type { TeamPerson } from '@/api/services/developers';

export function DeveloperAvatar({ developer, className = 'w-12 h-12 text-base' }: { developer: { full_name: string; avatar_url: string | null }; className?: string }) {
  const src = safeHttpUrl(developer.avatar_url);
  return src ? (
    <img src={src} alt={developer.full_name} className={`${className} rounded-full object-cover border border-default shrink-0`} />
  ) : (
    <div className={`${className} rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-black flex items-center justify-center border border-default shrink-0`}>
      {developer.full_name.trim().charAt(0).toLocaleUpperCase('tr-TR')}
    </div>
  );
}

export function DeveloperModal({ developer, onClose }: { developer: TeamPerson | null; onClose: () => void }) {
  if (!developer) return null;

  const email = developer.email?.trim();
  const links = [
    { label: 'E-posta', value: email, href: email ? `mailto:${email}` : null, text: email, Icon: Mail },
    { label: 'LinkedIn', value: developer.linkedin_url, href: safeHttpUrl(developer.linkedin_url), text: 'LinkedIn profili', Icon: Linkedin },
    { label: 'GitHub', value: developer.github_url, href: safeHttpUrl(developer.github_url), text: 'GitHub profili', Icon: Github },
    { label: 'Instagram', value: developer.instagram_url, href: safeHttpUrl(developer.instagram_url), text: 'Instagram profili', Icon: Instagram },
    { label: 'Web sitesi', value: developer.website_url, href: safeHttpUrl(developer.website_url), text: 'Kişisel web sitesi', Icon: Globe },
  ].filter((l) => l.value && l.href);

  return (
    <Modal isOpen onClose={onClose} title={developer.full_name}>
      <div className="flex items-center gap-4 mb-6">
        <DeveloperAvatar developer={developer} className="w-16 h-16 text-2xl" />
        <div>
          <p className="font-bold text-primary text-lg">{developer.full_name}</p>
          {developer.role && <p className="text-sm text-muted font-medium">{developer.role}</p>}
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
