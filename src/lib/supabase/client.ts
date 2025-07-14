import { createBrowserClient } from '@supabase/ssr'
import { supabasePublicUrl, supabasePublicAnonKey } from './config'

export function createClient() {
  // Use the public-facing variables for the client-side browser client
  return createBrowserClient(
    supabasePublicUrl,
    supabasePublicAnonKey
  )
}
