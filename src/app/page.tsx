
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from './lib/types';

const roleToDashboardPath: Record<string, string> = {
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
    // Default to 'employee' to ensure a safe, non-privileged landing page if cookie is not set.
    const role = cookieStore.get('demo_role')?.value as UserRole ?? 'employee'; 
    
    // Look up the specific dashboard path for the role.
    // If it doesn't exist in our map, fall back to the general employee dashboard.
    const destination = roleToDashboardPath[role] || '/employee/dashboard';
    
    redirect(destination);
}
