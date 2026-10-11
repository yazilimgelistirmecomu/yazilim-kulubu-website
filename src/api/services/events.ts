import { supabase } from '../config';
import { Database } from '@/types/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];

export const eventService = {
  // Tüm etkinlikleri çek
  async getAllEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Slug ile tek etkinlik (public detay sayfası)
  async getEventBySlug(slug: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Eski /etkinlikler/:uuid linkleri için: id ile slug bul
  async getEventSlugById(id: string) {
    const { data, error } = await supabase
      .from('events')
      .select('slug')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data?.slug ?? null;
  },

  // Ana sayfada öne çıkan etkinliği değiştir (null = işareti kaldır)
  async setFeaturedEvent(id: string | null) {
    const { error } = await supabase.rpc('set_featured_event', { p_id: id });
    if (error) throw error;
  },

  // Ana sayfa için öne çıkan etkinlik (tarihi geçmişse null)
  async getHomepageFeaturedEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('id,slug,title,date,location,description,image_url')
      .eq('is_homepage_featured', true)
      .gt('date', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Ana sayfa listesi için adaylar: en yakın yaklaşanlar + en yeni geçmişler.
  // Öne çıkan karttaki etkinliği çıkarmak için her gruptan 1 fazla çekilir.
  async getHomepageEventCandidates(limit = 3) {
    const columns = 'id,slug,title,date,location,description,image_url';
    const now = new Date().toISOString();
    const [upcoming, past] = await Promise.all([
      supabase.from('events').select(columns).gt('date', now).order('date', { ascending: true }).limit(limit + 1),
      supabase.from('events').select(columns).lte('date', now).order('date', { ascending: false }).limit(limit + 1),
    ]);

    if (upcoming.error) throw upcoming.error;
    if (past.error) throw past.error;
    return { upcoming: upcoming.data ?? [], past: past.data ?? [] };
  },

  // Yeni etkinlik ekle
  async createEvent(event: EventInsert) {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Etkinlik güncelle
  async updateEvent(id: string, updates: EventUpdate) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Etkinlik sil
  async deleteEvent(id: string) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
