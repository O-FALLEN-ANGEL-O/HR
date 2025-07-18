
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from './lib/types';

const roleToDashboardPath: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    super_hr: '/super_hr/dashboard',
    hr_manager: '/hr/dashboard',
    recruiter: '/recruiter/dashboard',
    manager: '/manager/dashboard',
    team_lead: '/team-lead/dashboard',
    intern: '/intern/dashboard',
    // All other roles default to the main employee dashboard (homepage)
    employee: '/employee/dashboard',
    finance: '/employee/dashboard',
    it_admin: '/employee/dashboard',
    support: '/employee/dashboard',
    auditor: '/employee/dashboard',
    interviewer: '/employee/dashboard',
    guest: '/employee/dashboard', 
};


export default async function Home() {
    const cookieStore = cookies();
    // Default to 'employee' to ensure a safe, non-privileged landing page.
    const role = cookieStore.get('demo_role')?.value as UserRole ?? 'employee'; 
    const destination = roleToDashboardPath[role] || '/employee/dashboard';
    redirect(destination);
}
