import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Metric, Job } from '@/lib/types';
import HrDashboardClient from './client';


export default async function HRDashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Example data fetching - replace with your actual queries
  const { count: employeeCount } = await supabase.from('users').select('*', { count: 'exact' });
  const { count: openPositionsCount } = await supabase.from('jobs').select('*', { count: 'exact' }).eq('status', 'Open');
  const { count: leaveRequestsCount } = await supabase.from('leaves').select('*', { count: 'exact' }).eq('status', 'pending');

  const metrics: Metric[] = [
    { id: 1, title: 'Total Employees', value: String(employeeCount || 0) },
    { id: 2, title: 'Open Positions', value: String(openPositionsCount || 0) },
    { id: 3, title: 'Leave Requests', value: String(leaveRequestsCount || 0) },
    { id: 4, title: 'Attrition Rate', value: '2.1%', change: '-0.2%', change_type: 'decrease' },
  ];
  
  const { data: recentHires } = await supabase
    .from('users')
    .select('full_name, department, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: departmentData } = await supabase
    .from('users')
    .select('department')

  const departmentCounts = (departmentData || []).reduce((acc, user) => {
    if (user.department) {
      acc[user.department] = (acc[user.department] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const employeeDistributionData = Object.entries(departmentCounts).map(([role, count], index) => ({
    role,
    count,
    fill: `var(--color-chart-${(index % 5) + 1})`
  }));

  const { data: jobFunnelData } = await supabase.rpc('get_job_funnel_stats');
  
  return (
    <HrDashboardClient
        initialMetrics={metrics} 
        initialRecentHires={recentHires || []}
        employeeDistributionData={employeeDistributionData}
        jobFunnelData={jobFunnelData || []}
    />
  );
}
