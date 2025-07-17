
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
  const demoRole = cookieStore.get('demo_role')?.value as UserRole | undefined;

  if (demoRole && DEMO_USER_DATA[demoRole]) {
    const userData = DEMO_USER_DATA[demoRole];
    return {
        id: `demo-${demoRole}-user`,
        role: demoRole,
        created_at: new Date().toISOString(),
        ...userData
    };
  }

  // --- Real Auth Logic (currently bypassed by demo mode) ---
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (!profile) {
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
