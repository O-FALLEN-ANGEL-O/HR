import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { UserRole } from '@/lib/types';
import { getHomePathForRole } from '@/middleware';


export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && session) {
      // For OAuth logins, redirect to the root page. The middleware will handle
      // redirecting to the correct dashboard.
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
