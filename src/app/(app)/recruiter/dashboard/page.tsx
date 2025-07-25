import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Briefcase, UserPlus, TrendingUp, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function RecruiterDashboardPage() {
  return (
    <>
      <Header title="Recruiter Dashboard" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="space-y-4">
          <Card>
              <CardHeader>
                  <CardTitle>Welcome, Recruiter!</CardTitle>
                  <CardDescription>Your hub for tracking open positions and new candidates.</CardDescription>
              </CardHeader>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/recruiter/jobs">
                  <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">12</div>
                          <p className="text-xs text-muted-foreground">View and manage all active job postings.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href="/hr/applicants">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Applicants</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45</div>
                        <p className="text-xs text-muted-foreground">+5 in the last 24 hours</p>
                    </CardContent>
                </Card>
              </Link>
              <Link href="/hr/campus">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Campus Drives</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3 Active</div>
                        <p className="text-xs text-muted-foreground">Manage and invite colleges for recruitment.</p>
                    </CardContent>
                </Card>
              </Link>
          </div>
        </div>
      </main>
    </>
  );
}
