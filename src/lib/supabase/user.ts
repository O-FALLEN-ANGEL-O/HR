
import { createClient } from './server';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { UserProfile } from '../types';

export async function getUser(cookieStore: ReadonlyRequestCookies): Promise<UserProfile | null> {
    const supabase = createClient(cookieStore);
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (profileError) {
             console.error("Error fetching user profile:", profileError);
             // Return auth data even if profile is missing for some reason
             return {
                 id: user.id,
                 email: user.email || null,
                 full_name: user.user_metadata.full_name || 'New User',
                 avatar_url: user.user_metadata.avatar_url || null,
                 role: user.user_metadata.role || 'guest',
                 department: user.user_metadata.department || null,
                 created_at: user.created_at,
                 profile_setup_complete: false,
             };
        }

        return profile;

    } catch (e) {
        console.error(e);
        return null;
    }
}
