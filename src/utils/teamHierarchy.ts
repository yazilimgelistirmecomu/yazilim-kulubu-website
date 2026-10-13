import type { HierarchyLevel, PublicTeamMember } from '@/api/services/team';
import type { PersonModalData } from '@/components/shared/PersonModal';

export const LEVEL_LABELS: Record<HierarchyLevel, { one: string; many: string }> = {
  president: { one: 'Başkan', many: 'Başkanlar' },
  vice_president: { one: 'Başkan Yardımcısı', many: 'Başkan Yardımcıları' },
  branch_lead: { one: 'Kol Başkanı', many: 'Kol Başkanları' },
  member: { one: 'Üye', many: 'Üyeler' },
};

const LEVEL_RANK: Record<HierarchyLevel, number> = {
  president: 0,
  vice_president: 1,
  branch_lead: 2,
  member: 3,
};

// Bilinmeyen bir değer gelirse (olmamalı) üye gibi davranılır
const levelOf = (m: PublicTeamMember): HierarchyLevel => (m.hierarchy_level in LEVEL_RANK ? m.hierarchy_level : 'member');

const byDisplayOrder = (a: PublicTeamMember, b: PublicTeamMember) => Number(a.display_order) - Number(b.display_order);

export type TreeLevel = { level: HierarchyLevel; label: string; members: PublicTeamMember[] };
export type BranchSection = { key: string; name: string; members: PublicTeamMember[] };

export interface TeamStructure {
  /** Ağaçtaki seviyeler (başkan → yardımcılar → kol başkanları); boş seviyeler yok. */
  tree: TreeLevel[];
  /** Ağacın altındaki kol/ekip bölümleri (yalnızca `member` seviyesi); boş bölümler yok. */
  sections: BranchSection[];
}

export function buildTeamStructure(members: PublicTeamMember[]): TeamStructure {
  const sorted = members.slice().sort(byDisplayOrder);

  const tree: TreeLevel[] = (['president', 'vice_president', 'branch_lead'] as const)
    .map((level) => {
      const list = sorted.filter((m) => levelOf(m) === level);
      return { level, label: list.length === 1 ? LEVEL_LABELS[level].one : LEVEL_LABELS[level].many, members: list };
    })
    .filter((l) => l.members.length > 0);

  const groups = new Map<string, BranchSection & { order: number }>();
  for (const m of sorted.filter((m) => levelOf(m) === 'member')) {
    const key = m.branch_slug ?? '__none__';
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        name: m.branch_name ?? 'Diğer Üyeler',
        members: [],
        order: m.branch_slug ? Number(m.branch_order ?? 0) : Number.MAX_SAFE_INTEGER,
      };
      groups.set(key, group);
    }
    group.members.push(m);
  }
  const sections = [...groups.values()]
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'tr'))
    .map(({ order: _order, ...section }) => section);

  return { tree, sections };
}

/** Ana sayfa önizlemesi: önce seviyeye, sonra display_order'a göre ilk `count` kişi. */
export function previewMembers(members: PublicTeamMember[], count: number): PublicTeamMember[] {
  return members
    .slice()
    .sort((a, b) => LEVEL_RANK[levelOf(a)] - LEVEL_RANK[levelOf(b)] || byDisplayOrder(a, b))
    .slice(0, count);
}

export const memberFullName = (m: PublicTeamMember) => `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim();

/** Modal yalnızca get_public_team_members()'in döndürdüğü alanlarla beslenir. */
export function memberToPerson(m: PublicTeamMember): PersonModalData {
  return {
    name: memberFullName(m),
    avatar_url: m.avatar_url,
    title: m.position,
    tag: m.branch_name,
    linkedin_url: m.linkedin_url,
    github_url: m.github_url,
    instagram_url: m.instagram_url,
    email: m.email,
  };
}
