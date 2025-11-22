
import { supabase } from '../client';
import type { Database } from '../types';

export type SimEvent = Database['public']['Tables']['sim_events']['Row'];
export type SimEventParticipantSolo = Database['public']['Tables']['sim_event_participants_solo']['Row'];
export type SimEventParticipantTeam = Database['public']['Tables']['sim_event_participants_team']['Row'];
export type SimTeamDriver = Database['public']['Tables']['sim_team_drivers']['Row'];

export type SimEventWithRelations = SimEvent & {
  creator?: { id: string; username: string; profile_picture?: string };
  league?: SimLeague;
  participants?: {
    solo: (SimEventParticipantSolo & { user: SimUser })[];
    teams: (SimEventParticipantTeam & { team: SimTeam; drivers: SimTeamDriver[] })[];
  };
};

export type SimLeague = Database['public']['Tables']['sim_leagues']['Row'];
export type SimUser = Database['public']['Tables']['sim_users']['Row'];
export type SimTeam = Database['public']['Tables']['sim_teams']['Row'];

export const simEventsApi = {
  // Events API
  getAll: async () => {
    const { data, error } = await supabase
      .from('sim_events')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching sim events:', error);
      return [];
    }
    
    return data || [];
  },
  
  getById: async (id: string): Promise<SimEventWithRelations | null> => {
    const { data, error } = await supabase
      .from('sim_events')
      .select(`
        *,
        creator:created_by(id, username, profile_picture),
        league:league_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching sim event:', error);
      return null;
    }
    
    return data;
  },
  
  getUpcoming: async (limit: number = 5) => {
    const today = new Date().toISOString();
    const { data, error } = await supabase
      .from('sim_events')
      .select('*')
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching upcoming sim events:', error);
      return [];
    }
    
    return data || [];
  },
  
  getByCategory: async (category: string) => {
    const { data, error } = await supabase
      .from('sim_events')
      .select('*')
      .eq('car_class', category)
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching sim events by category:', error);
      return [];
    }
    
    return data || [];
  },

  getByPlatform: async (platform: string) => {
    const { data, error } = await supabase
      .from('sim_events')
      .select('*')
      .eq('platform', platform)
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching sim events by platform:', error);
      return [];
    }
    
    return data || [];
  },

  getByEventType: async (eventType: string) => {
    const { data, error } = await supabase
      .from('sim_events')
      .select('*')
      .eq('event_type', eventType)
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching sim events by type:', error);
      return [];
    }
    
    return data || [];
  },
  
  getParticipants: async (eventId: string) => {
    try {
      const [soloRes, teamRes] = await Promise.all([
        // Get solo participants
        supabase.from('sim_event_participants_solo')
          .select(`
            *,
            user:user_id(id, username, profile_picture)
          `)
          .eq('event_id', eventId),
        
        // Get team participants
        supabase.from('sim_event_participants_team')
          .select(`
            *,
            team:team_id(*),
            drivers:sim_team_drivers(
              id,
              driver:driver_id(id, username, profile_picture)
            )
          `)
          .eq('event_id', eventId)
      ]);
      
      return {
        solo: soloRes.data || [],
        teams: teamRes.data || [],
        error: soloRes.error || teamRes.error
      };
    } catch (error) {
      console.error('Error fetching event participants:', error);
      return {
        solo: [],
        teams: [],
        error
      };
    }
  },
  
  create: async (eventData: Partial<SimEvent>) => {
    // Ensure required fields are provided
    if (!eventData.title || !eventData.event_type || !eventData.registration_type) {
      throw new Error('Missing required fields for sim event');
    }
    
    const { data, error } = await supabase
      .from('sim_events')
      .insert(eventData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating sim event:', error);
      throw error;
    }
    
    return data;
  },
  
  update: async (id: string, eventData: Partial<SimEvent>) => {
    const { data, error } = await supabase
      .from('sim_events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating sim event:', error);
      throw error;
    }
    
    return data;
  },
  
  delete: async (id: string) => {
    const { error } = await supabase
      .from('sim_events')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting sim event:', error);
      throw error;
    }
    
    return true;
  },
  
  getCategories: async () => {
    const { data, error } = await supabase
      .from('sim_events')
      .select('car_class')
      .not('car_class', 'is', null);
    
    if (error) {
      console.error('Error fetching sim event categories:', error);
      return [];
    }
    
    // Extract unique categories
    const categories = [...new Set(data.map(event => event.car_class))];
    return categories.filter(Boolean) as string[];
  },
  
  bulkCreate: async (events: Partial<SimEvent>[]) => {
    // Validate that all events have required fields
    for (const event of events) {
      if (!event.title || !event.event_type || !event.registration_type) {
        throw new Error('Missing required fields for sim event');
      }
    }
    
    const { data, error } = await supabase
      .from('sim_events')
      .insert(events as any)
      .select();
    
    if (error) {
      console.error('Error bulk creating sim events:', error);
      throw error;
    }
    
    return data;
  },
};

export default simEventsApi;
