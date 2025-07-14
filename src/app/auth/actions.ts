
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/lib/types';

export async function login(formData: any, isMagicLink: boolean = false) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const email = formData.email;

  // Helper function isolated within the action for clarity
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

  try {
    if (isMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${headers().get('origin')}/auth/callback`,
        },
      });

      if (error) {
          return { error: `Magic Link Error: ${error.message}` };
      }
      return { data: 'Magic link sent' };
    } 
    
    // Standard password login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: formData.password
    });
      
    if (error) {
      // This will now catch auth-specific errors like "Invalid login credentials"
      return { error: `Authentication Error: ${error.message}` };
    }

    if (!data.user) {
      // This case should ideally not be reached if error is null, but as a safeguard:
      return { error: 'Login failed: User object not found after successful sign in.' };
    }

    // Directly use the user object from the successful auth response.
    const userRole = data.user.user_metadata?.role as UserRole | undefined;

    if (!userRole) {
      await supabase.auth.signOut(); // Log them out for safety.
      return { error: `Configuration Error: Login was successful, but your user role is not configured. Please contact an administrator.` };
    }
      
    const homePath = getHomePathForRole(userRole);
    // The redirect needs to be outside the try...catch block as it throws an error
    redirect(homePath);

  } catch (e: any) {
    // This will catch any other unexpected errors during the process, including redirection errors.
    return { error: `An unexpected error occurred: ${e.message}` };
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
