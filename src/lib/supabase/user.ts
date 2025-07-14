import { createClient } from './server';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { UserProfile } from '../types';

export async function getUser(cookieStore: ReadonlyRequestCookies): Promise<UserProfile | null> {
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Instead of a separate query, we construct the profile from the auth user object,
  // which is more reliable and available immediately after login.
  const userProfile: UserProfile = {
    id: user.id,
    full_name: user.user_metadata.full_name || user.email,
    email: user.email,
    avatar_url: user.user_metadata.avatar_url,
    role: user.user_metadata.role || 'guest',
    department: user.user_metadata.department,
    created_at: user.created_at,
  };

  return userProfile;
}
