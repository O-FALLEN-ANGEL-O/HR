
import { createClient } from './server';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { UserProfile, UserRole } from '../types';

const DEMO_USER_DATA: Record<UserRole, Omit<UserProfile, 'id' | 'created_at' | 'role'>> = {
    admin: { full_name: 'John Admin', email: 'john.admin@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'Executive', profile_setup_complete: true },
    super_hr: { full_name: 'Olivia SuperHR', email: 'olivia.superhr@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'HR', profile_setup_complete: true },
    hr_manager: { full_name: 'Sarah HR', email: 'sarah.hr@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'HR', profile_setup_complete: true },
    recruiter: { full_name: 'Mike Recruiter', email: 'mike.recruiter@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'HR', profile_setup_complete: true },
    manager: { full_name: 'Emily Manager', email: 'emily.manager@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'Engineering', profile_setup_complete: true },
    team_lead: { full_name: 'David TeamLead', email: 'david.teamlead@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'Engineering', profile_setup_complete: true },
    employee: { full_name: 'Lisa Employee', email: 'lisa.employee@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'Engineering', profile_setup_complete: true },
    intern: { full_name: 'Tom Intern', email: 'tom.intern@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'Engineering', profile_setup_complete: true },
    interviewer: { full_name: 'Noah Interviewer', email: 'noah.interviewer@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'Engineering', profile_setup_complete: true },
    finance: { full_name: 'Rachel Finance', email: 'rachel.finance@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'Finance', profile_setup_complete: true },
    it_admin: { full_name: 'James IT', email: 'james.it@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'IT', profile_setup_complete: true },
    support: { full_name: 'Alex Support', email: 'alex.support@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'IT', profile_setup_complete: true },
    auditor: { full_name: 'Emma Auditor', email: 'emma.auditor@company.com', avatar_url: 'https://placehold.co/100x100.png', department: 'Finance', profile_setup_complete: true },
    guest: { full_name: 'Guest User', email: 'guest@company.com', avatar_url: 'https://placehold.co/100x100.png', department: null, profile_setup_complete: false },
};

export async function getUser(cookieStore: ReadonlyRequestCookies): Promise<UserProfile | null> {
    const roleFromCookie = cookieStore.get('demo_role')?.value as UserRole | undefined;

    if (!roleFromCookie) {
        return null;
    }

    const userData = DEMO_USER_DATA[roleFromCookie];
    
    if (!userData) {
      return null;
    }
    
    return {
        id: `demo-${roleFromCookie}-user`,
        role: roleFromCookie,
        created_at: new Date().toISOString(),
        ...userData
    };
}
