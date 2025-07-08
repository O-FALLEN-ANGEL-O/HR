
'use client';

import * as React from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddTimeOffDialog } from '@/components/add-time-off-dialog';
import TimeOffClient from './client';

export default function TimeOffPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Header title="Time & Attendance">
                {/* Realtime updates in the client component will handle refreshing the list */}
                <AddTimeOffDialog onTimeOffAdded={() => {}}>
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
