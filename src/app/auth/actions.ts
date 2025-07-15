
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
    return { error: `Authentication Error: ${error.message}` };
  }
  
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

export async function completeProfile(formData: { phone: string; password; string; }) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error('Error getting user or no user found', userError);
        return redirect('/login');
    }

    // 2. Update user's password
    const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password,
    });
    
    if (passwordError) {
      return { error: `Password Update Failed: ${passwordError.message}` };
    }

    // 3. Update public user profile
    const { error: metadataError } = await supabase.from('users')
      .update({
        phone: formData.phone,
        profile_setup_complete: true,
      })
      .eq('id', user.id);

    if (metadataError) {
      return { error: `Profile Update Failed: Could not save your phone number: ${metadataError.message}` };
    }
    
    // 4. Re-authenticate to ensure session is fully updated with new metadata claims if any
    // This isn't strictly necessary if middleware is just checking the public table,
    // but good practice.
    await supabase.auth.refreshSession();
    
    // 5. Redirect to the homepage, middleware will handle routing to the correct dashboard
    redirect('/');
}
