import { supabase } from '../config';
import { slugify } from '@/utils/slug';

export type HierarchyLevel = 'president' | 'vice_president' | 'branch_lead' | 'member';

export const HIERARCHY_LEVELS: HierarchyLevel[] = ['president', 'vice_president', 'branch_lead', 'member'];

export type PublicTeamMember = {
  public_id: string;
  display_order: number;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  github_url: string | null;
  email: string | null;
  hierarchy_level: HierarchyLevel;
  branch_slug: string | null;
  branch_name: string | null;
  branch_order: number | null;
};

export type TeamBranch = {
  id: string;
  slug: string;
  name: string;
  display_order: number;
};

export const teamService = {
  // Herkese açık (is_public) ekip üyeleri, display_order sırasıyla
  async getPublicMembers() {
    const { data, error } = await supabase.rpc('get_public_team_members');
    if (error) throw error;
    return ((data ?? []) as PublicTeamMember[]).slice().sort((a, b) => Number(a.display_order) - Number(b.display_order));
  },
};

// Admin: kol/ekip listesi (team_branches yalnızca admin tarafından okunur/yazılır)
export const branchService = {
  async list(): Promise<TeamBranch[]> {
    const { data, error } = await supabase
      .from('team_branches')
      .select('id, slug, name, display_order')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as TeamBranch[];
  },

  async create(name: string, existing: TeamBranch[]): Promise<void> {
    const trimmed = name.trim();
    const base = slugify(trimmed) || 'ekip';
    const taken = new Set(existing.map(b => b.slug));
    let slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`.slice(0, 60);
    const nextOrder = existing.reduce((max, b) => Math.max(max, b.display_order), 0) + 10;
    const { error } = await supabase
      .from('team_branches')
      .insert({ slug, name: trimmed, display_order: nextOrder });
    if (error) throw error;
  },

  async rename(id: string, name: string): Promise<void> {
    const { error } = await supabase.from('team_branches').update({ name: name.trim() }).eq('id', id);
    if (error) throw error;
  },

  // Komşuyla display_order değiştirir
  async swapOrder(a: TeamBranch, b: TeamBranch): Promise<void> {
    const first = await supabase.from('team_branches').update({ display_order: b.display_order }).eq('id', a.id);
    if (first.error) throw first.error;
    const second = await supabase.from('team_branches').update({ display_order: a.display_order }).eq('id', b.id);
    if (second.error) throw second.error;
  },

  // Silinen kolun üyeleri FK (on delete set null) ile kolsuz kalır
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('team_branches').delete().eq('id', id);
    if (error) throw error;
  },
};
