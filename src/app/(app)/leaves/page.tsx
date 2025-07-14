import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/supabase/user';
import type { Leave, LeaveBalance, UserProfile } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const LeaveClient = dynamic(() => import('./client').then(mod => mod.LeaveClient), {
    ssr: false,
    loading: () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    )
});

async function getLeaveData(user: UserProfile) {
    const supabase = createClient(cookies());
    let leavesQuery = supabase.from('leaves').select('*, users(full_name, avatar_url, department)');
    let teamMemberIds: string[] = [];
    
    if (user.role === 'manager' || user.role === 'team_lead') {
        // Fetch leaves for users in the same department
        if (user.department) {
             const { data: teamMembers, error: teamError } = await supabase.from('users').select('id').eq('department', user.department);
            if (teamError) {
                console.error('Error fetching team members:', teamError.message);
            }
            teamMemberIds = teamMembers?.map(tm => tm.id) || [user.id]; // Default to own ID if no team members found
            leavesQuery = leavesQuery.in('user_id', teamMemberIds);
        } else {
            // If manager has no department, only show their own leaves
             leavesQuery = leavesQuery.eq('user_id', user.id);
        }
    } else if (user.role === 'employee' || user.role === 'intern') {
        leavesQuery = leavesQuery.eq('user_id', user.id);
    }
    // Admins/HR get all leaves (no filter)

    const { data: leaves, error: leavesError } = await leavesQuery.order('created_at', { ascending: false });
    const { data: balances, error: balanceError } = await supabase.from('leave_balances').select('*').eq('user_id', user.id).single();

    if (leavesError) console.error('Error fetching leaves:', leavesError.message);
    if (balanceError && balanceError.code !== 'PGRST116') { // Ignore "No rows found" for new users
        // console.error('Error fetching leave balances:', balanceError.message);
    }

    // Calculate stats for admin/HR
    let stats = { totalEmployees: 0, presentToday: 0, absentToday: 0, pendingRequests: 0 };
    if (user.role === 'admin' || user.role === 'super_hr' || user.role === 'hr_manager') {
        const { count: userCount, error: usersError } = await supabase.from('users').select('id', { count: 'exact' }).not('role', 'in', '("guest", "intern")');
        if (usersError) console.error('Error fetching user count:', usersError);
        
        const today = new Date().toISOString().split('T')[0];

        const { data: allLeaves, error: allLeavesError } = await supabase.from('leaves').select('user_id, start_date, end_date').eq('status', 'approved');

        if(allLeavesError) console.error('Error fetching all leaves for stats:', allLeavesError);

        const absentUserIds = new Set<string>();
        if (allLeaves) {
            for (const leave of allLeaves) {
                if (today >= leave.start_date && today <= leave.end_date) {
                    absentUserIds.add(leave.user_id);
                }
            }
        }
        
        stats.totalEmployees = userCount || 0;
        stats.absentToday = absentUserIds.size;
        stats.presentToday = stats.totalEmployees - stats.absentToday;
        const { count: pendingCount } = await supabase.from('leaves').select('id', { count: 'exact' }).eq('status', 'pending');
        stats.pendingRequests = pendingCount || 0;
    }
    
    // Check for leave overlap for managers
    let leaveOverlap = false;
    if ((user.role === 'manager' || user.role === 'team_lead') && teamMemberIds.length > 0) {
        const { data: pendingLeaves } = await supabase
            .from('leaves')
            .select('start_date, end_date')
            .in('user_id', teamMemberIds)
            .eq('status', 'pending');

        if (pendingLeaves) {
            const dateCounts: Record<string, number> = {};
            for (const leave of pendingLeaves) {
                let currentDate = new Date(leave.start_date);
                const endDate = new Date(leave.end_date);
                while (currentDate <= endDate) {
                    const dateString = currentDate.toISOString().split('T')[0];
                    dateCounts[dateString] = (dateCounts[dateString] || 0) + 1;
                    if (dateCounts[dateString] > 2) {
                        leaveOverlap = true;
                        break;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                if (leaveOverlap) break;
            }
        }
    }


    return {
        leaves: (leaves as Leave[]) || [],
        balance: (balances as LeaveBalance) || null,
        stats,
        leaveOverlap,
    };
}


export default async function LeaveManagementPage() {
    const user = await getUser(cookies());

    if (!user) {
        return <p>You must be logged in to view this page.</p>;
    }
    
    const { leaves, balance, stats, leaveOverlap } = await getLeaveData(user);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Header title="Leave Management" />
            <LeaveClient
                currentUser={user}
                initialLeaves={leaves}
                initialBalance={balance}
                initialStats={stats}
                leaveOverlap={leaveOverlap}
            />
        </div>
    );
}
    