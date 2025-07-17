

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from './lib/types';

const roleHomePaths: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  super_hr: '/super_hr/dashboard',
  hr_manager: '/hr/dashboard',
  recruiter: '/recruiter/dashboard',
  manager: '/manager/dashboard',
  team_lead: '/team_lead/dashboard',
  employee: '/employee/dashboard',
  intern: '/intern/dashboard',
  interviewer: '/interviewer/tasks',
  guest: '/login',
  finance: '/employee/dashboard',
  it_admin: '/employee/dashboard',
  support: '/helpdesk',
  auditor: '/employee/dashboard',
};

// This page exists to catch the root URL and redirect.
// The primary redirect logic is now in the middleware.
export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If a session exists, the middleware will handle the redirect.
  // If not, redirect to login. This handles the case where a user
  // lands on the root URL without a session.
  if (!session) {
    redirect('/login');
  } else {
    // If a session exists, find the user's role and redirect to their dashboard
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    const role = profile?.role || 'employee';
    redirect(roleHomePaths[role] || '/employee/dashboard');
  }
}
