// /src/lib/supabase/config.ts

// This file is the single source of truth for Supabase environment variables.
// By centralizing them here, we ensure consistency across the different
// client initialization files (server, client, middleware).

// These variables are safe to be exposed to the browser and are used by
// all Supabase clients (server, client, middleware).
export const supabasePublicUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabasePublicAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
