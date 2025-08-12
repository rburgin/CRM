import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          domain: string | null;
          settings: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain?: string | null;
          settings?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string | null;
          settings?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      relationships: {
        Row: {
          id: string;
          org_id: string;
          type: 'individual' | 'company';
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          title: string | null;
          avatar_url: string | null;
          tags: string[];
          metadata: Record<string, any>;
          propensity_score: number;
          last_interaction_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          type: 'individual' | 'company';
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          title?: string | null;
          avatar_url?: string | null;
          tags?: string[];
          metadata?: Record<string, any>;
          propensity_score?: number;
          last_interaction_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          type?: 'individual' | 'company';
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          title?: string | null;
          avatar_url?: string | null;
          tags?: string[];
          metadata?: Record<string, any>;
          propensity_score?: number;
          last_interaction_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      interactions: {
        Row: {
          id: string;
          org_id: string;
          relationship_id: string;
          type: 'email' | 'call' | 'meeting' | 'note' | 'task';
          subject: string;
          content: string | null;
          direction: 'inbound' | 'outbound' | null;
          timestamp: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          relationship_id: string;
          type: 'email' | 'call' | 'meeting' | 'note' | 'task';
          subject: string;
          content?: string | null;
          direction?: 'inbound' | 'outbound' | null;
          timestamp?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          relationship_id?: string;
          type?: 'email' | 'call' | 'meeting' | 'note' | 'task';
          subject?: string;
          content?: string | null;
          direction?: 'inbound' | 'outbound' | null;
          timestamp?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      signals: {
        Row: {
          id: string;
          org_id: string;
          relationship_id: string | null;
          type: string;
          strength: 'weak' | 'medium' | 'strong';
          description: string;
          timestamp: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          relationship_id?: string | null;
          type: string;
          strength: 'weak' | 'medium' | 'strong';
          description: string;
          timestamp?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          relationship_id?: string | null;
          type?: string;
          strength?: 'weak' | 'medium' | 'strong';
          description?: string;
          timestamp?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      event_log: {
        Row: {
          id: string;
          org_id: string;
          entity_type: string;
          entity_id: string;
          event_type: string;
          actor_id: string | null;
          data: Record<string, any>;
          timestamp: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          entity_type: string;
          entity_id: string;
          event_type: string;
          actor_id?: string | null;
          data?: Record<string, any>;
          timestamp?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          entity_type?: string;
          entity_id?: string;
          event_type?: string;
          actor_id?: string | null;
          data?: Record<string, any>;
          timestamp?: string;
        };
      };
    };
  };
}

// Environment validation
const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

// Validate environment variables
const env = EnvSchema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

// Create Supabase client with proper typing
export const supabase = createClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'vara-crm@1.0.0',
      },
    },
  }
);

// Context for org scoping
export interface RequestContext {
  orgId: string;
  userId?: string;
  requestId: string;
  userAgent?: string;
  ip?: string;
}

// Set org context for RLS
export const setOrgContext = async (orgId: string) => {
  const { error } = await supabase.rpc('set_config', {
    setting_name: 'app.current_org_id',
    setting_value: orgId,
    is_local: true,
  });
  
  if (error) {
    throw new Error(`Failed to set org context: ${error.message}`);
  }
};

// Clear org context
export const clearOrgContext = async () => {
  const { error } = await supabase.rpc('set_config', {
    setting_name: 'app.current_org_id',
    setting_value: '',
    is_local: true,
  });
  
  if (error) {
    console.warn('Failed to clear org context:', error.message);
  }
};