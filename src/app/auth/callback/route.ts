import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { UserRole } from '@/lib/types';

function getHomePathForRole(role: UserRole): string {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'super_hr':
        return '/super_hr/dashboard';
      case 'hr_manager':
        return '/hr/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'team_lead':
        return '/team-lead/dashboard';
      case 'recruiter':
        return '/recruiter/dashboard';
      case 'interviewer':
        return '/interviews';
      case 'employee':
        return '/employee/dashboard';
      case 'intern':
        return '/intern/dashboard';
      default:
        return '/login';
    }
}


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
      // After successfully exchanging the code for a session,
      // get the user's role and redirect to the correct dashboard.
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
    
      const homePath = getHomePathForRole(userProfile?.role || 'guest');
      return NextResponse.redirect(`${origin}${homePath}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
