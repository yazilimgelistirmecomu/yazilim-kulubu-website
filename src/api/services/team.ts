import { supabase } from '../config';

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
};

export const teamService = {
  // Herkese açık (is_public) ekip üyeleri, display_order sırasıyla
  async getPublicMembers() {
    const { data, error } = await supabase.rpc('get_public_team_members');
    if (error) throw error;
    return ((data ?? []) as PublicTeamMember[]).slice().sort((a, b) => Number(a.display_order) - Number(b.display_order));
  },
};
