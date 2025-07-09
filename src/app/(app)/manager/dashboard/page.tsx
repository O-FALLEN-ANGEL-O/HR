import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, BarChart3, Clock, Award } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function ManagerDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Manager's Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/employee/directory">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Team</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">View and manage your team members.</p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/leaves">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                        <div className="text-2xl font-bold">3 Pending</div>
                    <p className="text-xs text-muted-foreground">Approve or reject team leave requests.</p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/employee/kudos">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Recognition</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                        <div className="text-2xl font-bold">18 Kudos</div>
                    <p className="text-xs text-muted-foreground">View your team's latest kudos.</p>
                </CardContent>
            </Card>
        </Link>
         <Card className="opacity-50 cursor-not-allowed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Reviews</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                    <div className="text-2xl font-bold">5 Upcoming</div>
                <p className="text-xs text-muted-foreground">Track performance cycles. (Coming Soon)</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
