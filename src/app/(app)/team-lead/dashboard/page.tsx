import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Award, CalendarDays } from 'lucide-react';
import Link from 'next/link';

export default function TeamLeadDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Team Lead Hub" />
      <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Welcome, Team Lead!</CardTitle>
                <CardDescription>Here's a quick overview of your team's status.</CardDescription>
            </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/employee/directory">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Team</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">View your direct team members.</p>
                    </CardContent>
                </Card>
            </Link>
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
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Leave</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     <div className="text-2xl font-bold">2 Members</div>
                    <p className="text-xs text-muted-foreground">Team members on leave this week.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
