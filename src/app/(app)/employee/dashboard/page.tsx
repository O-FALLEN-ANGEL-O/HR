
import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Clock, Users, FileText, Award, LifeBuoy, Handshake, Newspaper, Calendar as CalendarIcon, Sun } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/supabase/user';
import type { UserProfile, CompanyPost } from '@/lib/types';
import CompanyFeedClient from '@/app/(app)/company-feed/client';
import { DashboardCard } from './dashboard-card';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { LeaveBalanceCard } from './leave-balance-card';

async function getDashboardData(user: UserProfile | null) {
    if (!user) {
        return {
            posts: [],
            teamMembers: [],
        };
    }
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const postsQuery = supabase
        .from('company_posts')
        .select('*, users (full_name, avatar_url, role, department), post_comments(*, users(full_name, avatar_url))')
        .order('created_at', { ascending: false })
        .limit(5);

    const teamMembersQuery = user.department ? supabase
        .from('users')
        .select('full_name, avatar_url, email')
        .eq('department', user.department)
        .neq('id', user.id)
        .limit(4) : Promise.resolve({ data: [], error: null });

    const [postsRes, teamRes] = await Promise.all([postsQuery, teamMembersQuery]);

    return {
        posts: (postsRes.data as CompanyPost[]) || [],
        teamMembers: (teamRes.data as Pick<UserProfile, 'full_name' | 'avatar_url' | 'email'>[]) || [],
    }
}

// In a real app, this might come from a database or an API
const upcomingHolidays = [
    { date: '2024-08-15', name: 'Independence Day' },
    { date: '2024-10-02', name: 'Gandhi Jayanti' },
    { date: '2024-10-31', name: 'Diwali' },
    { date: '2024-12-25', name: 'Christmas' },
]

export default async function EmployeeDashboardPage() {
  const cookieStore = cookies();
  const user = await getUser(cookieStore);
  const { posts, teamMembers } = await getDashboardData(user);

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Employee'}!`} />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
             <DashboardCard delay={0.1}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 text-center">
                        <Link href="/leaves" className="p-2 rounded-lg hover:bg-muted">
                            <Clock className="mx-auto h-6 w-6 mb-1"/>
                            <span className="text-xs font-medium">Leave</span>
                        </Link>
                         <Link href="/employee/payslips" className="p-2 rounded-lg hover:bg-muted">
                            <FileText className="mx-auto h-6 w-6 mb-1"/>
                            <span className="text-xs font-medium">Payslips</span>
                        </Link>
                         <Link href="/employee/kudos" className="p-2 rounded-lg hover:bg-muted">
                            <Award className="mx-auto h-6 w-6 mb-1"/>
                            <span className="text-xs font-medium">Kudos</span>
                        </Link>
                         <Link href="/employee/documents" className="p-2 rounded-lg hover:bg-muted">
                            <Handshake className="mx-auto h-6 w-6 mb-1"/>
                            <span className="text-xs font-medium">Policies</span>
                        </Link>
                         <Link href="/employee/directory" className="p-2 rounded-lg hover:bg-muted">
                            <Users className="mx-auto h-6 w-6 mb-1"/>
                            <span className="text-xs font-medium">Directory</span>
                        </Link>
                         <Link href="/helpdesk" className="p-2 rounded-lg hover:bg-muted">
                            <LifeBuoy className="mx-auto h-6 w-6 mb-1"/>
                            <span className="text-xs font-medium">Helpdesk</span>
                        </Link>
                    </CardContent>
                </Card>
            </DashboardCard>
             <DashboardCard delay={0.2}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">My Team</CardTitle>
                        {user?.department && <CardDescription>Members in the {user.department} department.</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {teamMembers.length > 0 ? teamMembers.map(member => (
                            <div key={member.email} className="flex items-center gap-2">
                                <img src={member.avatar_url || `https://i.pravatar.cc/40?u=${member.email}`} alt={member.full_name || ''} className="h-8 w-8 rounded-full" />
                                <span className="text-sm font-medium">{member.full_name}</span>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground">No other team members found in your department.</p>
                        )}
                    </CardContent>
                </Card>
            </DashboardCard>
            <DashboardCard delay={0.5}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Upcoming Holidays</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       {upcomingHolidays.map(holiday => (
                            <div key={holiday.name} className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Sun className="h-5 w-5 text-primary"/>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{holiday.name}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(holiday.date), "EEEE, MMMM do")}</p>
                                </div>
                            </div>
                       ))}
                    </CardContent>
                </Card>
            </DashboardCard>
          </div>

          {/* Center Column (Main Content) */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardCard delay={0}>
                <div className="h-full">
                    <CompanyFeedClient user={user} initialPosts={posts} />
                </div>
            </DashboardCard>
          </div>
          
          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            <DashboardCard delay={0.3}>
                <LeaveBalanceCard user={user} />
            </DashboardCard>
             <DashboardCard delay={0.4}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Company Calendar</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      <Calendar
                        mode="single"
                        selected={new Date()}
                        className="rounded-md border p-0"
                      />
                    </CardContent>
                </Card>
            </DashboardCard>
          </div>
        </div>
      </main>
    </div>
  );
}
