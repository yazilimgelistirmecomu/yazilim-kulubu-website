import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { teamService, type PublicTeamMember } from '@/api/services/team';
import { TeamMemberCard } from '@/components/shared/TeamMemberCard';
import { withTimeout } from '@/utils/promise';
import { DatabaseError } from '@/components/shared/DatabaseError';

export function Team() {
  const [members, setMembers] = useState<PublicTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await withTimeout<PublicTeamMember[]>(teamService.getPublicMembers(), 5000);
      setMembers(data);
    } catch (err: any) {
      console.error("Üyeler çekilemedi:", err);
      setError("Bağlantı Hatası: Ekip üyeleri veritabanından yüklenemedi. Lütfen internet bağlantınızı veya API ayarlarını kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[var(--brand-primary)] bg-page">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-mono text-muted">Ekibimiz Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page pt-24 flex items-center justify-center">
        <DatabaseError message={error} onRetry={fetchMembers} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page transition-colors duration-300">
      {/* Leadership Section */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-8 lg:px-20 bg-page">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {members.map((member, idx) => (
              <TeamMemberCard key={member.public_id} member={member} delay={idx * 0.1} />
            ))}
          </div>

          {members.length === 0 && !isLoading && (
            <div className="text-center text-muted font-medium py-12">
              Henüz ekip üyesi bulunmamaktadır.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
