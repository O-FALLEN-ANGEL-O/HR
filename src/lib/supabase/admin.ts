// /src/lib/supabase/admin.ts

// This file is for creating a Supabase client that uses the SERVICE_ROLE_KEY.
// This key has elevated privileges and should ONLY be used in server-side code
// where you need to perform actions that bypass Row Level Security (RLS),
// such as administrative tasks like creating users or modifying auth metadata.

// NEVER expose this client or the SERVICE_ROLE_KEY to the browser or client-side code.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabasePublicUrl } from './config';

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabasePublicUrl || !supabaseServiceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set in environment variables. This is required for admin operations.');
}

// This is the admin client, created once and reused.
// It is exported directly for use in server-side scripts.
export const supabaseAdmin = createSupabaseClient(supabasePublicUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
});
