import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ClipboardCheck, BookOpen, Clock, Award, User, Wallet, BarChart } from 'lucide-react';
import Link from 'next/link';

export default function InternDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Intern Welcome Hub" />
       <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Welcome to the Team!</CardTitle>
                <CardDescription>This is your portal for your internship journey.</CardDescription>
            </CardHeader>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/hr/onboarding">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Onboarding Tasks</CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Complete your onboarding checklist.</p>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/leaves">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Request Leave</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Apply for time off and track your requests.</p>
                    </CardContent>
                </Card>
            </Link>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Mentor</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">View your assigned mentor's profile. (Coming Soon)</p>
                </CardContent>
            </Card>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Stipend Tracker</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">View stipend release date. (Coming Soon)</p>
                </CardContent>
            </Card>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progress Card</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Auto-generated report from mentor. (Coming Soon)</p>
                </CardContent>
            </Card>
            <Link href="/employee/documents">
              <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Learning Materials</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <p className="text-xs text-muted-foreground">Access training documents and project briefs.</p>
                  </CardContent>
              </Card>
            </Link>
            <Link href="/employee/kudos">
              <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Kudos</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <p className="text-xs text-muted-foreground">Give and receive recognition.</p>
                  </CardContent>
              </Card>
            </Link>
        </div>
      </div>
    </div>
  );
}
