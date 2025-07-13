import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { UserProfile } from '../types';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
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

  const { data: { user } } = await supabase.auth.getUser()

  // The user's role is stored in user_metadata in the JWT.
  // This is a much more efficient way to get the role than a separate DB query.
  const userRole = user?.user_metadata?.role || 'guest';

  const userProfile: UserProfile | null = user ? {
    id: user.id,
    full_name: user.user_metadata.full_name || null,
    email: user.email || null,
    avatar_url: user.user_metadata.avatar_url || null,
    role: userRole,
    department: user.user_metadata.department || null,
    created_at: user.created_at,
  } : null;

  return { response, supabase, user: userProfile }
}
