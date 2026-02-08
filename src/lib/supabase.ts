import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not configured. ' +
    'Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file. ' +
    'See README-SUPABASE.md for setup instructions.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Database types (to be extended as schema is implemented)
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          privacy_setting: 'private' | 'friends' | 'public';
          user_tier: 'free' | 'pro' | 'enterprise';
          feature_flags: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      players: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          is_current_user: boolean;
          last_modified_ms: number;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['players']['Insert']>;
      };
      venues: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          last_modified_ms: number;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['venues']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['venues']['Insert']>;
      };
      matches: {
        Row: {
          id: string;
          user_id: string;
          opponent_id: string;
          venue_id: string | null;
          date: string;
          format: string;
          user_score: number;
          opponent_score: number;
          result: 'win' | 'loss';
          energy_level: number | null;
          note: string | null;
          photo_url: string | null;
          tags: string[];
          last_modified_ms: number;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
      };
      games: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          game_number: number;
          user_score: number;
          opponent_score: number;
          last_modified_ms: number;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['games']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['games']['Insert']>;
      };
      rally_analyses: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          rally_data: Record<string, unknown>;
          last_modified_ms: number;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rally_analyses']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['rally_analyses']['Insert']>;
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          accepted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['friendships']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['friendships']['Insert']>;
      };
    };
  };
};
