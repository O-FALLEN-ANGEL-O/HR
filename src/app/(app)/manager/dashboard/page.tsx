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
import { DashboardCard } from '../../employee/dashboard/dashboard-card';

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
    .select('id, full_name, avatar_url, role', { count: 'exact' })
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
  
  const stats = [
    { title: "Total Team Members", value: teamCount, description: `in your department`, icon: Users },
    { title: "Open Team Positions", value: openTeamPositions, link: "/recruiter/jobs", linkText: "View Jobs", icon: Briefcase },
    { title: "Pending Leave Requests", value: pendingLeave, link: "/leaves", linkText: "Review Requests", icon: Clock },
    { title: "Upcoming Interviews", value: upcomingInterviews.length, link: "/interviewer/tasks", linkText: "View Schedule", icon: CalendarCheck }
  ];


  return (
    <>
      <Header title="Manager's Dashboard" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, i) => (
                <DashboardCard key={i} delay={i * 0.1}>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                          <stat.icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">{stat.value}</div>
                           {stat.link ? (
                              <Link href={stat.link} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                {stat.linkText} →
                              </Link>
                            ) : (
                              <p className="text-xs text-muted-foreground">{stat.description}</p>
                            )}
                      </CardContent>
                  </Card>
                </DashboardCard>
              ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DashboardCard delay={0.4} className="lg:col-span-2">
                  <Card className="h-full">
                      <CardHeader>
                          <CardTitle>Team Members</CardTitle>
                          <CardDescription>An overview of all members in the {user?.department} department.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {teamMembers.map(member => (
                                  <div key={member.id} className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                                      <Avatar className="h-10 w-10">
                                          <AvatarImage src={member.avatar_url || undefined} />
                                          <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                          <p className="font-semibold">{member.full_name}</p>
                                          <p className="text-sm text-muted-foreground capitalize">{member.role.replace('_', ' ')}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <Link href="/employee/directory">
                              <p className="text-sm text-primary hover:underline mt-4 inline-block">View Full Directory →</p>
                          </Link>
                      </CardContent>
                  </Card>
              </DashboardCard>

              <DashboardCard delay={0.5}>
                  <Card className="h-full">
                      <CardHeader>
                          <CardTitle>Upcoming Interviews</CardTitle>
                          <CardDescription>Your team's upcoming interview schedule.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          {upcomingInterviews.length > 0 ? (
                              <div className="space-y-4">
                                  {upcomingInterviews.map(interview => (
                                      <div key={interview.id} className="flex flex-col rounded-lg border p-3 hover:bg-muted/50 transition-colors">
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
                              <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full">
                                  <UserCheck className="mx-auto h-8 w-8 mb-2" />
                                  <p>No upcoming interviews for your team.</p>
                              </div>
                          )}
                      </CardContent>
                  </Card>
              </DashboardCard>
          </div>
        </div>
      </main>
    </>
  );
}
