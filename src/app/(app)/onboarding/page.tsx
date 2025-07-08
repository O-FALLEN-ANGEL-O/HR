import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Onboarding } from '@/lib/types';
import OnboardingClient from './client';

export default async function OnboardingPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('onboarding_workflows')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching onboarding workflows:', error);
  }

  const onboardingWorkflows: Onboarding[] = data || [];

  return <OnboardingClient initialWorkflows={onboardingWorkflows} />;
}
