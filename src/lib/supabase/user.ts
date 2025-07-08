import { createClient } from './server';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export async function getUser(cookieStore: ReadonlyRequestCookies) {
  const supabase = createClient(cookieStore);
  const { data: { session }} = await supabase.auth.getSession();
  
  if (!session) return null;

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !userProfile) {
    // This case might happen if the trigger failed or if there's a delay.
    // For now, we return null, but a robust app might try to create the profile here.
    console.error('User profile not found for authenticated user.', error);
    return null;
  }
  
  return userProfile;
}
