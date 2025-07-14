
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // For OAuth (Google) and Magic Link (if used), redirect to the root page.
      // The middleware will then handle redirecting to the correct dashboard.
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // If there's an error or no code, redirect to an error page
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
