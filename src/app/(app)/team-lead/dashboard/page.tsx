import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Award, CalendarDays, Briefcase, UserCheck, Clock } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/supabase/user';
import type { UserProfile } from '@/lib/types';

async function getDashboardData(user: UserProfile | null) {
  if (!user) return { teamMembers: [], openTeamPositions: [] };
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // In a real app, you'd have a manager_id or team_id column on the users table.
  // For this demo, we'll just grab a few other employees to simulate a team.
  const { data: teamMembers } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .neq('id', user.id)
    .limit(5);

  const { data: openTeamPositions } = await supabase
    .from('jobs')
    .select('title, applicants')
    .eq('status', 'Open')
    .limit(3);
    
  return {
    teamMembers: teamMembers || [],
    openTeamPositions: openTeamPositions || []
  };
}

export default async function TeamLeadDashboardPage() {
  const cookieStore = cookies();
  const user = await getUser(cookieStore);
  const { teamMembers, openTeamPositions } = await getDashboardData(user);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Team Lead Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> My Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {teamMembers.map(member => (
                    <div key={member.full_name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar_url || undefined} />
                                <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{member.full_name}</span>
                        </div>
                        <Badge variant="secondary" className='bg-green-100 text-green-800'>
                            Active
                        </Badge>
                    </div>
                ))}
                 <Link href="/employee/directory">
                    <p className="text-sm text-primary hover:underline mt-4">View Full Directory →</p>
                </Link>
            </CardContent>
          </Card>
          <div className="flex flex-col gap-6">
            <Link href="/employee/kudos">
              <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Team Kudos</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">12 Recent</div>
                      <p className="text-xs text-muted-foreground">See your team's recognition feed.</p>
                  </CardContent>
              </Card>
            </Link>
            <Link href="/jobs">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Team Positions</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openTeamPositions.length} Open</div>
                        <p className="text-xs text-muted-foreground">Contribute to hiring for your team.</p>
                    </CardContent>
                </Card>
            </Link>
          </div>
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock /> Team Leave</CardTitle>
                <CardDescription>Upcoming and current leave for your team.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-4">
                    <UserCheck className="mx-auto h-8 w-8 mb-2" />
                    <p>Everyone is available this week!</p>
                </div>
                 <Link href="/leaves">
                    <p className="text-sm text-primary hover:underline mt-4">View All Leave Requests →</p>
                </Link>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
