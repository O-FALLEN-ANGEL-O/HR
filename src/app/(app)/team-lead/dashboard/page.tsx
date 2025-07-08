import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Award, CalendarDays, Briefcase, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Mock data for demonstration purposes
// In a real app, this would come from the database
const teamMembers = [
    { name: 'Liam Johnson', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', onLeave: true, leaveStart: '2024-07-28', leaveEnd: '2024-08-02' },
    { name: 'Olivia Smith', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e', onLeave: false },
    { name: 'Noah Williams', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f', onLeave: false },
    { name: 'Emma Brown', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704a', onLeave: false },
    { name: 'Oliver Jones', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704b', onLeave: true, leaveStart: '2024-07-29', leaveEnd: '2024-07-29' },
];

const openTeamPositions = [
    { title: 'Senior Frontend Developer', applicants: 12 },
    { title: 'UX/UI Designer', applicants: 5 },
]

export default function TeamLeadDashboardPage() {
  const teamOnLeave = teamMembers.filter(m => m.onLeave);

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
                    <div key={member.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{member.name}</span>
                        </div>
                        <Badge variant={member.onLeave ? "destructive" : "secondary"} className={member.onLeave ? '' : 'bg-green-100 text-green-800'}>
                            {member.onLeave ? "On Leave" : "Active"}
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
                <CardTitle className="flex items-center gap-2"><CalendarDays /> Who's On Leave?</CardTitle>
                <CardDescription>Upcoming and current leave for your team.</CardDescription>
            </CardHeader>
            <CardContent>
                {teamOnLeave.length > 0 ? (
                    <div className="space-y-3">
                        {teamOnLeave.map(member => (
                             <div key={member.name} className="flex items-center gap-3 p-2 rounded-md border">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.leaveStart} to {member.leaveEnd}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                        <UserCheck className="mx-auto h-8 w-8 mb-2" />
                        <p>Everyone is available this week!</p>
                    </div>
                )}
                 <Link href="/time-off">
                    <p className="text-sm text-primary hover:underline mt-4">View All Time Off →</p>
                </Link>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
