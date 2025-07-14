// /src/lib/supabase/config.ts

// This file is the single source of truth for Supabase environment variables.
// By centralizing them here, we ensure consistency across the different
// client initialization files (server, client, middleware).

// Note: process.env.SUPABASE_URL is not prefixed with NEXT_PUBLIC_
// and will only be available in server-side environments. This is secure.
export const supabaseUrl =
  process.env.SUPABASE_URL!;

// Note: process.env.SUPABASE_ANON_KEY is not prefixed with NEXT_PUBLIC_
// and will only be available in server-side environments. This is secure.
export const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY!;

// The following variables are prefixed with NEXT_PUBLIC_ because they need
// to be accessible in the browser (client-side) and in Edge middleware.
export const supabasePublicUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabasePublicAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
