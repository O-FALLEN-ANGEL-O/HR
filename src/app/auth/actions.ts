
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/lib/types';

export async function loginWithRole(role: UserRole) {
  const cookieStore = cookies();
  cookieStore.set('demo_role', role, { path: '/', maxAge: 60 * 60 * 24 }); // Expires in 1 day
  // The client-side will now handle the redirect.
  // This action's only job is to set the cookie.
}


export async function login(formData: any) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
  });

  if (error) {
    console.error('Supabase auth error:', error);
    return { error: `Authentication Error: ${error.message}` };
  }
  
  return redirect('/');
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
  cookieStore.delete('demo_role');
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  redirect('/login');
}
