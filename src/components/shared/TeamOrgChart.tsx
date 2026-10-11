import type { PublicTeamMember } from '@/api/services/team';
import type { TreeLevel } from '@/utils/teamHierarchy';
import { TeamMemberCard } from '@/components/shared/TeamMemberCard';

// Bir satıra sığacak en fazla kart; fazlası yeni bir satıra (kendi bağlantı çubuğuyla) geçer.
const MAX_PER_ROW = 4;

const LINE = 'bg-[var(--border-strong)]';

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

/**
 * Organizasyon şeması. Masaüstünde seviyeler ortalanmış satırlar ve aralarında
 * bağlantı çizgileri; dar ekranlarda alt alta dizilir ve sol kenarda dikey bir
 * ray çizgisine bağlanır (yatay taşma yok).
 */
export function TeamOrgChart({ levels, onSelect }: { levels: TreeLevel[]; onSelect: (m: PublicTeamMember) => void }) {
  if (levels.length === 0) return null;

  let cardIndex = 0;

  return (
    <div className="relative pl-8 md:pl-0">
      {/* Mobil ray çizgisi */}
      <div aria-hidden className={`md:hidden absolute left-3 top-2 bottom-2 w-0.5 ${LINE}`} />

      <div className="flex flex-col gap-10 md:gap-0 md:items-center">
        {levels.map((level, levelIdx) => (
          <section key={level.level} aria-label={level.label} className="flex flex-col md:items-center">
            <h2 className="md:hidden relative mb-4 text-xs font-black uppercase tracking-widest text-muted">
              <span aria-hidden className="absolute -left-[27px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--brand-primary)] border-4 border-[var(--bg-page)]" />
              {level.label}
            </h2>

            <div className="flex flex-col gap-4 md:gap-0 md:items-center">
              {chunk(level.members, MAX_PER_ROW).map((row, rowIdx) => {
                const connected = levelIdx > 0 || rowIdx > 0;
                return (
                  <div key={rowIdx} className="flex flex-col md:items-center">
                    {connected && <div aria-hidden className={`hidden md:block w-px h-8 ${LINE}`} />}

                    <div className="flex flex-col gap-4 md:flex-row md:justify-center md:gap-0">
                      {row.map((member, i) => (
                        <div key={member.public_id} className="relative flex flex-col md:items-center md:px-3">
                          <span aria-hidden className="md:hidden absolute -left-[25px] top-8 w-3 h-3 rounded-full bg-[var(--bg-page)] border-2 border-[var(--brand-primary)]" />
                          {connected && (
                            <div aria-hidden className="hidden md:block relative w-full h-6">
                              <span className={`absolute left-1/2 top-0 bottom-0 w-px ${LINE}`} />
                              {row.length > 1 && (
                                <span
                                  className={`absolute top-0 h-px ${LINE}`}
                                  style={{ left: i === 0 ? '50%' : 0, right: i === row.length - 1 ? '50%' : 0 }}
                                />
                              )}
                            </div>
                          )}
                          <TeamMemberCard member={member} onSelect={onSelect} delay={(cardIndex++ % MAX_PER_ROW) * 0.08} variant="tree" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
