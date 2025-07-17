
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserProfile, UserRole } from '@/lib/types';
import { getUser } from '@/lib/supabase/user';
import { revalidatePath } from 'next/cache';

function getHomePathForRole(role: UserRole): string {
    const dashboardMap: Partial<Record<UserRole, string>> = {
        admin: '/admin/dashboard',
        super_hr: '/super_hr/dashboard',
        hr_manager: '/hr/dashboard',
        recruiter: '/recruiter/dashboard',
        manager: '/manager/dashboard',
        team_lead: '/team-lead/dashboard',
        intern: '/intern/dashboard',
    };
    return dashboardMap[role] || '/employee/dashboard';
}

export async function login(formData: any) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
  });

  if (error || !data.user) {
    console.error('Supabase auth error:', error);
    return { error: `Authentication Error: ${error?.message || 'Invalid credentials'}` };
  }
  
  // After successful sign-in, get the user's profile to determine their role
  const userProfile = await getUser(cookieStore);

  if (!userProfile) {
    // This case might happen if the public.users profile is not yet created.
    // In this case, we can sign them out and ask to try again.
    await supabase.auth.signOut();
    return { error: 'Could not retrieve user profile. Please try again.' };
  }

  // Redirect to the appropriate dashboard based on role.
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
