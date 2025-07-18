
import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/supabase/user';
import type { UserProfile, CompanyPost, Leave } from '@/lib/types';
import CompanyFeedClient from '@/app/(app)/company-feed/client';
import { DashboardCard } from './dashboard-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LeaveBalanceCard } from './leave-balance-card';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Cake, Sparkles, PartyPopper, Calendar as CalendarIcon, Sun, Briefcase, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getGreeting } from '@/lib/utils';

// In a real app, this might come from a database or an API
const upcomingHolidays = [
    { date: '2024-08-15', name: 'Independence Day' },
    { date: '2024-10-02', name: 'Gandhi Jayanti' },
    { date: '2024-10-31', name: 'Diwali' },
    { date: '2024-12-25', name: 'Christmas' },
]

async function getDashboardData(user: UserProfile | null) {
    if (!user) {
        return {
            posts: [],
            teamMembers: [],
            onLeaveToday: [],
            newJoiners: [],
            workAnniversaries: [],
        };
    }
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const today = new Date().toISOString().split('T')[0];

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
        
    const onLeaveTodayQuery = user.department ? supabase
        .from('leaves')
        .select('users(full_name, avatar_url)')
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today)
        .eq('users.department', user.department)
        : Promise.resolve({ data: [], error: null });
        
    const newJoinersQuery = supabase
        .from('users')
        .select('full_name, avatar_url, department, job_title')
        .order('created_at', { ascending: false })
        .limit(2);

    const [postsRes, teamRes, leaveRes, joinersRes] = await Promise.all([postsQuery, teamMembersQuery, onLeaveTodayQuery, newJoinersQuery]);

    return {
        posts: (postsRes.data as CompanyPost[]) || [],
        teamMembers: (teamRes.data as Pick<UserProfile, 'full_name' | 'avatar_url' | 'email'>[]) || [],
        onLeaveToday: (leaveRes.data as { users: UserProfile }[]) || [],
        newJoiners: (joinersRes.data as UserProfile[]) || [],
        workAnniversaries: [ // Dummy data for demo
             { name: 'Emily Manager', years: 3, avatar_url: 'https://placehold.co/40x40.png' },
        ],
    }
}


export default async function EmployeeDashboardPage() {
  const cookieStore = cookies();
  const user = await getUser(cookieStore);
  const { posts, teamMembers, onLeaveToday, newJoiners, workAnniversaries } = await getDashboardData(user);
  const greeting = getGreeting();

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`${greeting}, ${user?.full_name?.split(' ')[0] || 'User'}!`} />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <DashboardCard delay={0.1}>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Team Updates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <TeamUpdateItem icon={Sparkles} title="New Joiners" items={newJoiners.map(u => ({ primary: u.full_name, secondary: u.job_title, avatar_url: u.avatar_url }))} />
                        <TeamUpdateItem icon={PartyPopper} title="Work Anniversaries" items={workAnniversaries.map(u => ({ primary: u.name, secondary: `${u.years} years`, avatar_url: u.avatar_url }))} />
                        <TeamUpdateItem icon={Cake} title="Upcoming Birthdays" items={[{ primary: 'Lisa Employee', secondary: 'July 28th', avatar_url: 'https://placehold.co/40x40.png' }]} />
                    </CardContent>
                </Card>
            </DashboardCard>
          </div>

          {/* Center Column (Main Content) */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardCard delay={0.2} className="h-full">
                 <div className="h-full">
                    <CompanyFeedClient user={user} initialPosts={posts} />
                </div>
            </DashboardCard>
          </div>
          
          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            <DashboardCard delay={0}>
                <LeaveBalanceCard user={user} />
            </DashboardCard>
            <DashboardCard delay={0.3}>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Stats</CardTitle>
                        <CardDescription>A quick look at today's numbers.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-3xl font-bold">{onLeaveToday.length}</p>
                            <p className="text-xs text-muted-foreground">On Leave Today</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-3xl font-bold">2</p>
                            <p className="text-xs text-muted-foreground">Pending Approvals</p>
                        </div>
                    </CardContent>
                </Card>
            </DashboardCard>
            <DashboardCard delay={0.4}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">My Team</CardTitle>
                        {user?.department && <CardDescription>Members in the {user.department} department.</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {teamMembers.length > 0 ? teamMembers.map(member => (
                            <div key={member.email} className="flex items-center gap-3">
                                <Avatar className="h-8 w-8"><AvatarImage data-ai-hint="person" src={member.avatar_url || undefined} /><AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback></Avatar>
                                <span className="text-sm font-medium">{member.full_name}</span>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground">No other team members found.</p>
                        )}
                        <Link href="/employee/directory" className="text-primary text-sm font-medium flex items-center gap-1 pt-2 hover:underline">
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </CardContent>
                </Card>
            </DashboardCard>
            <DashboardCard delay={0.5}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
        </div>
      </main>
    </div>
  );
}


function TeamUpdateItem({ icon: Icon, title, items }: { icon: React.ElementType, title: string, items: { primary: string, secondary: string | null, avatar_url: string | null }[] }) {
    if (items.length === 0) return null;
    return (
        <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {title}
            </h4>
            <div className="space-y-2 pl-6">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarImage data-ai-hint="person" src={item.avatar_url || undefined} /><AvatarFallback>{item.primary.charAt(0)}</AvatarFallback></Avatar>
                        <div>
                            <p className="text-sm font-medium">{item.primary}</p>
                            <p className="text-xs text-muted-foreground">{item.secondary}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
