import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
    
    const homePath = getHomePathForRole(userProfile?.role || 'guest');
    redirect(homePath);

  } else {
    redirect('/login');
  }
}
