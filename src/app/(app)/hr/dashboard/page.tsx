import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Metric, Job } from '@/lib/types';
import HrDashboardClient from './client';


export default async function HRDashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: metricsData, error: metricsError } = await supabase
    .from('metrics')
    .select('*')
    .order('id', { ascending: true });
  const metrics: Metric[] = metricsData || [];

  const { data: recentJobsData, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'Open')
    .order('posted_date', { ascending: false })
    .limit(3);
  const recentJobs: Job[] = recentJobsData || [];

  if (metricsError || jobsError) {
    console.error(metricsError || jobsError);
    // You can render an error state here
  }

  return (
    <HrDashboardClient
        initialMetrics={metrics} 
        initialRecentJobs={recentJobs} 
    />
  );
}
