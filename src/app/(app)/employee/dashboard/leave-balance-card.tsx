
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeaveDialog } from '@/components/leave-dialog';
import type { UserProfile, LeaveBalance } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type LeaveBalanceCardProps = {
  user: UserProfile | null;
};

export function LeaveBalanceCard({ user }: LeaveBalanceCardProps) {
  const [balance, setBalance] = React.useState<LeaveBalance | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchBalance = React.useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      toast({ title: "Error", description: "Could not fetch leave balance."});
    }

    setBalance(data);
    setLoading(false);
  }, [user, toast]);
  
  React.useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (loading) {
    return (
        <Card>
            <CardHeader><CardTitle className="text-lg">My Leave Balance</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
            </CardContent>
            <CardFooter>
                <Button className="w-full" disabled>Apply for Leave</Button>
            </CardFooter>
        </Card>
    )
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">My Leave Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="flex justify-between items-center"><span className="text-sm">Casual Leave</span><span className="font-bold">{balance?.casual_leave ?? 'N/A'}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm">Sick Leave</span><span className="font-bold">{balance?.sick_leave ?? 'N/A'}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm">Earned Leave</span><span className="font-bold">{balance?.earned_leave ?? 'N/A'}</span></div>
        </CardContent>
        <CardFooter>
            <LeaveDialog user={user} balance={balance} onLeaveApplied={fetchBalance}>
                <Button className="w-full">Apply for Leave</Button>
            </LeaveDialog>
        </CardFooter>
    </Card>
  );
}
