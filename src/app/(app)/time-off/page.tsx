import * as React from 'react';
import { cookies } from 'next/headers';
import { format, subMonths, startOfDay, endOfDay, getMonth } from 'date-fns';

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/user';
import type { TimeOffRequest, TimeOffMetric } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddTimeOffDialog } from '@/components/add-time-off-dialog';
import TimeOffClient from './client';

export default async function TimeOffPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const user = await getUser(cookieStore);

    const { data: requestsData, error } = await supabase
        .from('time_off_requests')
        .select('*, users (full_name, avatar_url)')
        .order('start_date', { ascending: false });

    if (error) {
        console.error('Error fetching time off requests:', error);
    }
    
    const allRequests: TimeOffRequest[] = requestsData || [];

    // Calculate metrics on the server
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const pendingRequests = allRequests.filter(r => r.status === 'Pending').length;
    const onLeaveToday = allRequests.filter(r => 
        r.status === 'Approved' && 
        new Date(r.start_date) <= todayEnd && 
        new Date(r.end_date) >= todayStart
    ).length;

    const metrics: TimeOffMetric[] = [
        { title: 'Pending Requests', value: pendingRequests.toString(), change: 'Awaiting your review' },
        { title: 'On Leave Today', value: onLeaveToday.toString(), change: 'Across all departments' },
    ];
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Header title="Time & Attendance">
                <AddTimeOffDialog onTimeOffAdded={() => { /* Realtime updates handle refresh */ }} user={user}>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Request Time Off
                </Button>
                </AddTimeOffDialog>
            </Header>
            <TimeOffClient 
                user={user}
                initialRequests={allRequests}
                initialMetrics={metrics}
            />
        </div>
    );
}
