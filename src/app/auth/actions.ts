
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/lib/types';

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

function getHomePathForRole(role: UserRole): string {
  return roleHomePaths[role] || '/employee/dashboard';
}

export async function login(formData: any) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
  });

  if (error) {
    console.error('Supabase auth error:', error);
    return { error: `Authentication Error: ${error.message}` };
  }

  // After successful login, fetch the user's profile to get their role
  if (authData.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();
    
    const role = profile?.role || 'employee';
    const destination = getHomePathForRole(role);
    redirect(destination);
  } else {
    // Fallback in case user data isn't returned, though unlikely after successful login
    redirect('/');
  }
}

export async function loginWithGoogle() {
  const origin = headers().get('origin');
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: `Could not authenticate with Google: ${error.message}` };
  }
  
  if (data.url) {
    redirect(data.url);
  }
}

export async function signup(formData: any) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const origin = headers().get('origin');

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error);
    return { error: `Could not sign up user: ${error.message}` };
  }

  return { message: 'Check your email to continue the sign-up process.' };
}

export async function logout() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  redirect('/login');
}
