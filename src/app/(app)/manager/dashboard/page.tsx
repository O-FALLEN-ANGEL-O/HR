import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Briefcase, Clock, CalendarCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/supabase/user';
import type { UserProfile, Job, Leave, Interview } from '@/lib/types';
import { format } from 'date-fns';

async function getDashboardData(user: UserProfile | null) {
  if (!user?.department) return { 
      teamMembers: [], 
      openTeamPositions: 0, 
      pendingLeave: 0, 
      upcomingInterviews: [] 
  };
  
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: teamMembers, count: teamCount } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, job_title:department', { count: 'exact' })
    .eq('department', user.department)
    .neq('id', user.id);

  const teamMemberIds = teamMembers?.map(m => m.id) || [];

  const { count: openTeamPositions } = await supabase
    .from('jobs')
    .select('id', { count: 'exact' })
    .eq('status', 'Open')
    .eq('department', user.department);
  
  const { count: pendingLeave } = await supabase
    .from('leaves')
    .select('id', { count: 'exact' })
    .in('user_id', teamMemberIds)
    .eq('status', 'pending');

  const { data: upcomingInterviews } = await supabase
    .from('interviews')
    .select('id, candidate_name, job_title, date, time')
    .in('interviewer_id', [...teamMemberIds, user.id])
    .eq('status', 'Scheduled')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('time', { ascending: true })
    .limit(4);

  return {
    teamMembers: (teamMembers as any[] as UserProfile[]) || [],
    teamCount: teamCount || 0,
    openTeamPositions: openTeamPositions || 0,
    pendingLeave: pendingLeave || 0,
    upcomingInterviews: (upcomingInterviews as Interview[]) || [],
  };
}

export default async function ManagerDashboardPage() {
  const cookieStore = cookies();
  const user = await getUser(cookieStore);
  const { teamMembers, teamCount, openTeamPositions, pendingLeave, upcomingInterviews } = await getDashboardData(user);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Manager's Dashboard" />
      <div className="space-y-6">
        {/* Key Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{teamCount}</div>
                    <p className="text-xs text-muted-foreground">in your department</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Team Positions</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{openTeamPositions}</div>
                    <Link href="/recruiter/jobs" className="text-xs text-muted-foreground hover:text-primary">View Jobs →</Link>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Leave Requests</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingLeave}</div>
                     <Link href="/leaves" className="text-xs text-muted-foreground hover:text-primary">Review Requests →</Link>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{upcomingInterviews.length}</div>
                    <Link href="/interviewer/tasks" className="text-xs text-muted-foreground hover:text-primary">View Schedule →</Link>
                </CardContent>
            </Card>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>An overview of all members in the {user?.department} department.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {teamMembers.map(member => (
                            <div key={member.id} className="flex items-center gap-4 rounded-lg border p-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={member.avatar_url || undefined} />
                                    <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{member.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{member.job_title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                     <Link href="/employee/directory">
                        <p className="text-sm text-primary hover:underline mt-4">View Full Directory →</p>
                    </Link>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Upcoming Interviews</CardTitle>
                    <CardDescription>Your team's upcoming interview schedule.</CardDescription>
                </CardHeader>
                <CardContent>
                    {upcomingInterviews.length > 0 ? (
                         <div className="space-y-4">
                            {upcomingInterviews.map(interview => (
                                <div key={interview.id} className="flex flex-col rounded-lg border p-3">
                                    <p className="font-semibold">{interview.candidate_name}</p>
                                    <p className="text-sm text-muted-foreground">{interview.job_title}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <Badge variant="outline">{format(new Date(interview.date), 'MMM dd, yyyy')}</Badge>
                                        <span className="text-sm font-medium">{interview.time}</span>
                                    </div>
                                </div>
                            ))}
                         </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <UserCheck className="mx-auto h-8 w-8 mb-2" />
                            <p>No upcoming interviews for your team.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
