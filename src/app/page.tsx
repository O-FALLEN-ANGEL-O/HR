import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/lib/types';
import { getUser } from '@/lib/supabase/user';

// This map defines which role gets which specific dashboard.
// If a role is not in this map, it will default to the general employee dashboard.
const roleToDashboardPath: Partial<Record<UserRole, string>> = {
    admin: '/admin/dashboard',
    super_hr: '/super_hr/dashboard',
    hr_manager: '/hr/dashboard',
    recruiter: '/recruiter/dashboard',
    manager: '/manager/dashboard',
    team_lead: '/team_lead/dashboard',
    intern: '/intern/dashboard',
};


export default async function Home() {
    const cookieStore = cookies();
    const user = await getUser(cookieStore);

    if (!user) {
        return redirect('/login');
    }
    
    // Look up the specific dashboard path for the role.
    // If it doesn't exist in our map, fall back to the general employee dashboard.
    const destination = roleToDashboardPath[user.role] || '/employee/dashboard';
    
    redirect(destination);
}
