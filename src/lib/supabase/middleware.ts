import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { UserProfile } from '../types';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // The middleware runs in the Edge runtime, which requires the public variables.
  // We read them directly from process.env here to ensure they are available.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user: authUser } } = await supabase.auth.getUser();

  let userProfile: UserProfile | null = null;
  if (authUser) {
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
    
    userProfile = profile ? {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
      role: profile.role,
      department: profile.department,
      created_at: profile.created_at,
      profile_setup_complete: profile.profile_setup_complete
    } : null;
  }

  return { response, supabase, user: userProfile }
}
