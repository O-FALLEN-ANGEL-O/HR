
'use client';
import * as React from 'react';
import { cookies } from 'next/headers';
import { format, subMonths, startOfDay, endOfDay, getMonth } from 'date-fns';

import { createClient } from '@/lib/supabase/server';
import type { TimeOffRequest, TimeOffMetric } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddTimeOffDialog } from '@/components/add-time-off-dialog';
import TimeOffClient from './client';

export default function TimeOffPage() {
    const [requests, setRequests] = React.useState<TimeOffRequest[]>([]);
    const [metrics, setMetrics] = React.useState<TimeOffMetric[]>([]);
    const [chartData, setChartData] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data: requestsData, error } = await supabase
                .from('time_off_requests')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) {
                console.error('Error fetching time off requests:', error);
                setLoading(false);
                return;
            }

            const now = new Date();
            const todayStart = startOfDay(now);
            const todayEnd = endOfDay(now);

            const pendingRequests = requestsData.filter(r => r.status === 'Pending').length;
            const onLeaveToday = requestsData.filter(r => 
                r.status === 'Approved' && 
                new Date(r.start_date) <= todayEnd && 
                new Date(r.end_date) >= todayStart
            ).length;

            const newMetrics: TimeOffMetric[] = [
                { title: 'Pending Requests', value: pendingRequests.toString(), change: 'Awaiting your review' },
                { title: 'On Leave Today', value: onLeaveToday.toString(), change: 'Across all departments' },
            ];
            
            setRequests(requestsData || []);
            setMetrics(newMetrics);

            // Chart Data
            const threeMonthsAgo = subMonths(now, 2);
            const months = [format(threeMonthsAgo, 'MMMM'), format(subMonths(now, 1), 'MMMM'), format(now, 'MMMM')];
            
            const newChartData = months.map((monthName, index) => {
                const monthIndex = getMonth(subMonths(now, 2 - index));
                const monthRequests = requestsData.filter(r => getMonth(new Date(r.start_date)) === monthIndex);
                
                return {
                    month: monthName,
                    vacation: monthRequests.filter(r => r.type === 'Vacation').length,
                    sick: monthRequests.filter(r => r.type === 'Sick Leave').length,
                    personal: monthRequests.filter(r => r.type === 'Personal').length,
                }
            });
            
            setChartData(newChartData);
            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Header title="Time & Attendance">
                <AddTimeOffDialog onTimeOffAdded={() => { /* Realtime updates handle refresh */ }}>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Time Off
                </Button>
                </AddTimeOffDialog>
            </Header>
            {loading ? (
                 <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <TimeOffClient 
                    initialRequests={requests} 
                    initialMetrics={metrics} 
                    initialChartData={chartData} 
                />
            )}
        </div>
    );
}

// NOTE: We had to convert this page to a client component because AddTimeOffDialog
// is a client component that needs to be stateful (open/closed).
// The data fetching is now done inside a useEffect hook.
// Supabase client creation is adapted for client-side usage.
function createClient() {
  return import('@/lib/supabase/client').then(m => m.createClient());
}
