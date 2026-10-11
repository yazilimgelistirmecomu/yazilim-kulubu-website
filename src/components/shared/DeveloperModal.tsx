import { PersonAvatar, PersonModal } from '@/components/shared/PersonModal';
import type { TeamPerson } from '@/api/services/developers';

export function DeveloperAvatar({ developer, className }: { developer: { full_name: string; avatar_url: string | null }; className?: string }) {
  return <PersonAvatar name={developer.full_name} avatar_url={developer.avatar_url} className={className} />;
}

// Proje geliştiricisi için ince sarmalayıcı; asıl pencere ortak PersonModal'dır.
export function DeveloperModal({ developer, onClose }: { developer: TeamPerson | null; onClose: () => void }) {
  return (
    <PersonModal
      onClose={onClose}
      person={developer && {
        name: developer.full_name,
        avatar_url: developer.avatar_url,
        title: developer.role,
        email: developer.email,
        linkedin_url: developer.linkedin_url,
        github_url: developer.github_url,
        instagram_url: developer.instagram_url,
        website_url: developer.website_url,
      }}
    />
  );
}
