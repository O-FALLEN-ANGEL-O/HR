import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { UserProfile } from '../types';
import { supabasePublicUrl, supabasePublicAnonKey } from './config';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // The middleware runs in the Edge runtime, which requires the public variables.
  const supabase = createServerClient(
    supabasePublicUrl,
    supabasePublicAnonKey,
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

  const { data: { user } } = await supabase.auth.getUser();

  const userProfile: UserProfile | null = user ? {
    id: user.id,
    full_name: user.user_metadata.full_name,
    email: user.email,
    avatar_url: user.user_metadata.avatar_url,
    role: user.user_metadata.role || 'guest',
    department: user.user_metadata.department,
    created_at: user.created_at,
  } : null;

  return { response, supabase, user: userProfile }
}
