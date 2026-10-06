import { createClient } from '@supabase/supabase-js';

let rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
if (rawSupabaseUrl.includes('supabase.com/dashboard/project/')) {
  const match = rawSupabaseUrl.match(/project\/([a-z0-9_-]+)/i);
  if (match?.[1]) {
    rawSupabaseUrl = `https://${match[1]}.supabase.co`;
  }
}
const supabaseUrl = rawSupabaseUrl;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
