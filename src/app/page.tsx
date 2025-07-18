
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/lib/types';

// This page now acts as the main entry point and immediately redirects to the dashboard
// corresponding to the demo role.
export default async function Home() {
    const cookieStore = cookies();
    // Default to 'admin' if no cookie is present, otherwise use the cookie's value.
    const role = (cookieStore.get('demo_role')?.value as UserRole) || 'admin';

    const roleDashboardPaths: Record<UserRole, string> = {
        admin: '/admin/dashboard',
        super_hr: '/super_hr/dashboard',
        hr_manager: '/hr/dashboard',
        recruiter: '/recruiter/dashboard',
        manager: '/manager/dashboard',
        team_lead: '/team_lead/dashboard',
        employee: '/employee/dashboard',
        intern: '/intern/dashboard',
        interviewer: '/interviewer/tasks',
        finance: '/employee/dashboard',
        it_admin: '/employee/dashboard',
        support: '/helpdesk',
        auditor: '/employee/dashboard',
        guest: '/login', // Fallback for guest role
    };

    const targetPath = roleDashboardPaths[role] || '/employee/dashboard';
    redirect(targetPath);
}
