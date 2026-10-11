import { supabase } from '../config';
import { Database } from '@/types/database.types';

export type Developer = Database['public']['Tables']['developers']['Row'];
type DeveloperInsert = Database['public']['Tables']['developers']['Insert'];
type DeveloperUpdate = Database['public']['Tables']['developers']['Update'];

/** Public görünümde iki kaynaktan (developers / profiles) gelen kişinin ortak şekli. */
export interface TeamPerson {
  member_key: string;
  source: 'developer' | 'profile';
  full_name: string;
  avatar_url: string | null;
  role: string | null;
  email: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  sort_order: number;
}

export type AssignmentKind = 'developer' | 'profile';

/** Admin formundaki bir atama: kişi (kaynağıyla birlikte) + projedeki rol. */
export interface Assignment {
  kind: AssignmentKind;
  id: string;
  role: string;
}

const clean = <T extends Record<string, any>>(values: T): T => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(values)) {
    out[k] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v;
  }
  return out as T;
};

export const developerService = {
  async getAllDevelopers() {
    const { data, error } = await supabase
      .from('developers')
      .select('*, project_developers(project_id, projects(title))')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createDeveloper(values: DeveloperInsert) {
    const { data, error } = await supabase
      .from('developers')
      .insert(clean(values))
      .select()
      .single();
    if (error) throw error;
    return data as Developer;
  },

  async updateDeveloper(id: string, values: DeveloperUpdate) {
    const { data, error } = await supabase
      .from('developers')
      .update(clean(values))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Developer;
  },

  async deleteDeveloper(id: string) {
    const { error } = await supabase.from('developers').delete().eq('id', id);
    if (error) throw error;
  },

  // Public: bir onaylı projenin ekibi (tek okuma yolu get_project_team RPC'si)
  async getProjectTeam(projectId: string): Promise<TeamPerson[]> {
    const { data, error } = await supabase.rpc('get_project_team', { p_project_id: projectId });
    if (error) throw error;
    return (data || []) as TeamPerson[];
  },

  // Admin: bir projenin mevcut atamaları (gizli profiller dahil), sıralı
  async getProjectAssignments(projectId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('project_developers')
      .select('developer_id, profile_id, role, sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      kind: r.profile_id ? 'profile' : 'developer',
      id: r.profile_id || r.developer_id,
      role: r.role || '',
    }));
  },

  // Admin: ekip üyeleri (profiles) listesi, kulüp projelerinde seçilir
  async getTeamProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, position, avatar_url, is_public')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Proje + ekip + öne çıkan bayrağı tek transaction'da kaydeder (save_project RPC)
  async saveProject(args: {
    id: string | null;
    project: Record<string, unknown>;
    assignments: Assignment[] | null;
    featured: boolean | null;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('save_project', {
      p_id: args.id,
      p_project: args.project,
      p_assignments: args.assignments
        ? args.assignments.map(a => ({ kind: a.kind, id: a.id, role: a.role }))
        : null,
      p_featured: args.featured,
    });
    if (error) throw error;
    return data as string;
  },
};
