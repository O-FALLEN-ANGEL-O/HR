import { createClient } from './server';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { UserProfile } from '../types';

export async function getUser(cookieStore: ReadonlyRequestCookies): Promise<UserProfile | null> {
  // --- TEMPORARY FIX FOR DEMO ---
  // Return a hardcoded admin user to bypass login and test the app's functionality.
  const hardcodedAdminUser: UserProfile = {
    id: '00000000-0000-0000-0000-000000000000',
    full_name: 'Admin Demo User',
    email: 'admin.demo@company.com',
    avatar_url: 'https://placehold.co/100x100.png',
    role: 'admin',
    department: 'Executive',
    created_at: new Date().toISOString(),
    profile_setup_complete: true,
  };
  return Promise.resolve(hardcodedAdminUser);
  // --- END TEMPORARY FIX ---

  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Now, we also query the public users table to get the full profile,
  // including our custom fields like 'profile_setup_complete'.
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error || !profile) {
    // This case can happen if the user exists in auth but not in public.users yet.
    // We can return a partial profile based on auth data.
    return {
      id: user.id,
      full_name: user.user_metadata.full_name || user.email,
      email: user.email,
      avatar_url: user.user_metadata.avatar_url,
      role: user.user_metadata.role || 'guest',
      department: user.user_metadata.department,
      created_at: user.created_at,
      profile_setup_complete: false,
    };
  }


  // Combine auth data and profile data for the complete UserProfile
  const userProfile: UserProfile = {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role,
    department: profile.department,
    phone: profile.phone,
    profile_setup_complete: profile.profile_setup_complete,
    job_title: profile.job_title,
    dob: profile.dob,
    gender: profile.gender,
    blood_group: profile.blood_group,
    manager_id: profile.manager_id,
  };

  return userProfile;
}
