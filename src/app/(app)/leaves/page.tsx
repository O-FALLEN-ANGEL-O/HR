import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/supabase/user';
import { LeaveClient } from './client';
import type { Leave, LeaveBalance, UserProfile } from '@/lib/types';
import { startOfToday, endOfToday, parseISO } from 'date-fns';

async function getLeaveData(user: UserProfile) {
    const supabase = createClient(cookies());
    let leavesQuery = supabase.from('leaves').select('*, users(full_name, avatar_url, department)');
    
    if (user.role === 'manager' || user.role === 'team_lead') {
        // Fetch leaves for users in the same department
        if (user.department) {
            const { data: teamMembers } = await supabase.from('users').select('id').eq('department', user.department);
            const teamMemberIds = teamMembers?.map(tm => tm.id) || [];
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
        console.error('Error fetching leave balances:', balanceError.message);
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
        stats.pendingRequests = (await supabase.from('leaves').select('id', { count: 'exact' }).eq('status', 'pending')).count || 0;
    }


    return {
        leaves: (leaves as Leave[]) || [],
        balance: (balances as LeaveBalance) || null,
        stats,
    };
}


export default async function LeaveManagementPage() {
    const user = await getUser(cookies());

    if (!user) {
        return <p>You must be logged in to view this page.</p>;
    }
    
    const { leaves, balance, stats } = await getLeaveData(user);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Header title="Leave Management" />
            <LeaveClient
                currentUser={user}
                initialLeaves={leaves}
                initialBalance={balance}
                initialStats={stats}
            />
        </div>
    );
}
