'use client';
import * as React from 'react';
import { format, subMonths, startOfDay, endOfDay, getMonth } from 'date-fns';

import { createClient } from '@/lib/supabase/client';
import type { TimeOffRequest, TimeOffMetric, UserProfile } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddTimeOffDialog } from '@/components/add-time-off-dialog';
import TimeOffClient from './client';

// This component is now a simple wrapper that fetches the current user
// and then renders the data-heavy client component.
export default function TimeOffPage() {
    const [user, setUser] = React.useState<UserProfile | null>(null);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                 const { data: userProfile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();
                setUser(userProfile);
            }
            setLoading(false);
        }
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                 <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Header title="Time & Attendance">
                <AddTimeOffDialog onTimeOffAdded={() => { /* Realtime updates handle refresh */ }} user={user}>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Time Off
                </Button>
                </AddTimeOffDialog>
            </Header>
            <TimeOffClient />
        </div>
    );
}
