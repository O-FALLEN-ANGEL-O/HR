import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, BarChart3, Clock, Award } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/supabase/user';
import type { UserProfile } from '@/lib/types';


async function getDashboardData(user: UserProfile | null) {
  if (!user?.department) return { teamMemberCount: 0, pendingLeaveCount: 0 };
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { count: teamMemberCount, error: teamError } = await supabase
    .from('users')
    .select('id', { count: 'exact' })
    .eq('department', user.department)
    .neq('id', user.id);

  if (teamError) console.error("Error fetching team member count", teamError);
  
  const { data: teamMembers } = await supabase.from('users').select('id').eq('department', user.department);
  const teamMemberIds = teamMembers?.map(tm => tm.id) || [];
  
  const { count: pendingLeaveCount, error: leaveError } = await supabase
    .from('leaves')
    .select('id', { count: 'exact' })
    .in('user_id', teamMemberIds)
    .eq('status', 'pending');
  
  if (leaveError) console.error("Error fetching pending leave count", leaveError);

  return { teamMemberCount: teamMemberCount || 0, pendingLeaveCount: pendingLeaveCount || 0 };
}


export default async function ManagerDashboardPage() {
  const cookieStore = cookies();
  const user = await getUser(cookieStore);
  const { teamMemberCount, pendingLeaveCount } = await getDashboardData(user);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Manager's Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/employee/directory">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Team</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{teamMemberCount}</div>
                    <p className="text-xs text-muted-foreground">View and manage your team members.</p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/leaves">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                        <div className="text-2xl font-bold">{pendingLeaveCount} Pending</div>
                    <p className="text-xs text-muted-foreground">Approve or reject team leave requests.</p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/employee/kudos">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Recognition</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">&nbsp;</div>
                    <p className="text-xs text-muted-foreground">Recognize your peers for their great work.</p>
                </CardContent>
            </Card>
        </Link>
         <Card className="opacity-50 cursor-not-allowed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Reviews</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 <div className="text-2xl font-bold">&nbsp;</div>
                <p className="text-xs text-muted-foreground">Track performance cycles. (Coming Soon)</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
