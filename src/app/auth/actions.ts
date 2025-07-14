
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: any) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
  });

  if (error) {
    console.error('Supabase auth error:', error);
    // This will now catch auth-specific errors like "Invalid login credentials"
    return { error: `Authentication Error: ${error.message}` };
  }

  // On successful login, we must revalidate the root path to ensure
  // the middleware can correctly assess the new session and redirect.
  // Re-directing to the root which will then be handled by the middleware.
  redirect('/');
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
