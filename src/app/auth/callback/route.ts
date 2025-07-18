
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // For Magic Link and OAuth, user needs to set password and complete profile.
      // Redirect to a specific page for that, unless they have already done so.
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('users').select('profile_setup_complete').eq('id', user!.id).single();

      if (profile && !profile.profile_setup_complete) {
        // If the user's password is not set (typical for magic link), direct them to set it.
        if (!user?.user_metadata?.has_password) {
            return NextResponse.redirect(`${origin}/update-password`);
        }
        // Otherwise, direct them to complete the onboarding form.
        return NextResponse.redirect(`${origin}/onboarding`);
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
