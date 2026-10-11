import { Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { teamService, type PublicTeamMember } from '@/api/services/team';
import { TeamMemberCompactCard } from '@/components/shared/TeamMemberCard';
import { TeamOrgChart } from '@/components/shared/TeamOrgChart';
import { PersonModal } from '@/components/shared/PersonModal';
import { withTimeout } from '@/utils/promise';
import { buildTeamStructure, memberToPerson } from '@/utils/teamHierarchy';
import { DatabaseError } from '@/components/shared/DatabaseError';

export function Team() {
  const [members, setMembers] = useState<PublicTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicTeamMember | null>(null);

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

  const { tree, sections } = useMemo(() => buildTeamStructure(members), [members]);

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
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-8 lg:px-20 bg-page">
        <div className="max-w-[1280px] mx-auto">
          {members.length === 0 ? (
            <div className="text-center text-muted font-medium py-12">
              Henüz ekip üyesi bulunmamaktadır.
            </div>
          ) : (
            <>
              <TeamOrgChart levels={tree} onSelect={setSelected} />

              {sections.map((section) => (
                <div key={section.key} className={tree.length > 0 || section !== sections[0] ? 'mt-16' : ''}>
                  <h2 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-3">
                    <span className="text-[var(--brand-primary)] font-mono">&gt;_</span>
                    {section.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {section.members.map((member, idx) => (
                      <TeamMemberCompactCard key={member.public_id} member={member} onSelect={setSelected} delay={(idx % 4) * 0.05} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      <PersonModal person={selected && memberToPerson(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}
