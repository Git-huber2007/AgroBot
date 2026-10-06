/**
 * ============================================================================
 * Supabase Admin Client (Service Role)
 * ============================================================================
 * CRITICAL ARCHITECTURAL CONSTRAINTS (§11, §18.3):
 * The service role key bypasses PostgreSQL Row Level Security (RLS).
 * Therefore, this client MUST ONLY be utilized for the following 4 permitted cases:
 *  1. Writing operational metrics to `ai_usage_logs`
 *  2. Reading and writing global weather forecast cache in `weather_cache`
 *  3. Generating short-lived signed URLs for storage images where server delegation is required
 *  4. Admin cascade execution during user account deletion (`auth.admin.deleteUser`)
 *
 * All user-scoped entity queries (farms, advisories, chat, feedback, etc.)
 * MUST use `createUserClient(jwt)` from `./userClient.ts`.
 * ============================================================================
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
