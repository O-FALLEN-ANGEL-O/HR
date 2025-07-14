import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Onboarding, UserProfile } from '@/lib/types';
import OnboardingClient from './client';

export default async function OnboardingPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: workflows, error: workflowsError } = await supabase
    .from('onboarding_workflows')
    .select('*')
    .order('start_date', { ascending: false });

  if (workflowsError) {
    console.error('Error fetching onboarding workflows:', workflowsError);
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, role');
    
  if (usersError) {
      console.error('Error fetching users:', usersError);
  }

  const onboardingWorkflows: Onboarding[] = workflows || [];
  const userList: UserProfile[] = users || [];

  return <OnboardingClient initialWorkflows={onboardingWorkflows} users={userList} />;
}
