'use server';

import { createClient } from '@/lib/supabase/server';
import { headers, cookies } from 'next/headers';
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

export async function login(formData: any, isMagicLink: boolean = false) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (isMagicLink) {
    const { error } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        emailRedirectTo: `${headers().get('origin')}/auth/callback`,
      },
    });

    if (error) {
        return { error: `Could not authenticate user: ${error.message}` };
    }
    return { data: 'Magic link sent' };
  } 
  
  const { data: authData, error } = await supabase.auth.signInWithPassword(formData);
    
  if (error || !authData.user) {
      return { error: `Invalid credentials. Please try again.` };
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();
    
  if (profileError) {
    await supabase.auth.signOut();
    return { error: `Login successful, but there was an issue retrieving your user profile. Please contact support. Error: ${profileError.message}` };
  }

  if (!userProfile?.role || !Object.values(['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead', 'recruiter', 'interviewer', 'employee', 'intern', 'guest'] as UserRole[]).includes(userProfile.role)) {
    await supabase.auth.signOut();
    return { error: `Login successful, but your user role ('${userProfile?.role || 'none'}') is not configured for platform access. Please contact support.` };
  }
    
  const homePath = getHomePathForRole(userProfile.role);
  redirect(homePath);
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
