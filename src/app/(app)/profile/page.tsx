import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/supabase/user';
import { redirect } from 'next/navigation';
import ProfileClient from './client';
import type { LeaveBalance, UserProfile } from '@/lib/types';


async function getProfileData(user: UserProfile) {
    const supabase = createClient(cookies());

    const managerQuery = user.manager_id 
        ? supabase.from('users').select('id, full_name, avatar_url, role, department').eq('id', user.manager_id).single() 
        : Promise.resolve({ data: null, error: null });
        
    const teamQuery = user.department
        ? supabase.from('users').select('id, full_name, avatar_url, role, department').eq('department', user.department).neq('id', user.id)
        : Promise.resolve({ data: [], error: null });

    const balanceQuery = supabase.from('leave_balances').select('*').eq('user_id', user.id).single();

    const [managerRes, teamRes, balanceRes] = await Promise.all([managerQuery, teamQuery, balanceQuery]);
    
    return {
        manager: managerRes.data as UserProfile | null,
        teamMembers: teamRes.data as UserProfile[] || [],
        leaveBalance: balanceRes.data as LeaveBalance | null
    }
}


export default async function ProfilePage() {
    const cookieStore = cookies();
    const user = await getUser(cookieStore);

    if (!user) {
        redirect('/login');
    }

    const profileData = await getProfileData(user);

    return (
        <div className="flex flex-1 flex-col">
            <Header title="My Profile" />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <ProfileClient user={user} {...profileData} />
            </main>
        </div>
    );
}
