import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, BarChart3, Clock, Check, X, Award } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { TimeOffRequest } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';

async function getPendingRequests(): Promise<TimeOffRequest[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
        .from('time_off_requests')
        .select('*, users(full_name, avatar_url)')
        .eq('status', 'Pending')
        .order('start_date', { ascending: true })
        .limit(5);

    if (error) {
        console.error("Error fetching pending requests:", error);
        return [];
    }
    return data;
}

export default async function ManagerDashboardPage() {
  const pendingRequests = await getPendingRequests();

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
        <Link href="/performance">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Performance Reviews</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                        <div className="text-2xl font-bold">5 Upcoming</div>
                    <p className="text-xs text-muted-foreground">Track and manage team performance cycles.</p>
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
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Pending Time Off Requests</CardTitle>
            <CardDescription>Review and act on new leave requests from your team.</CardDescription>
        </CardHeader>
        <CardContent>
            {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                    {pendingRequests.map(request => (
                        <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                           <div className="flex items-center gap-3">
                             <Avatar>
                                <AvatarImage src={(request as any).users?.avatar_url || undefined} />
                                <AvatarFallback>{(request as any).users?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{(request as any).users?.full_name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d')}
                                    <span className="mx-2">&middot;</span>
                                    <span className="font-semibold">{request.type}</span>
                                </p>
                            </div>
                           </div>
                           <div className="flex gap-2">
                                <Button size="sm" variant="outline"><Check className="mr-2" />Approve</Button>
                                <Button size="sm" variant="ghost"><X className="mr-2" />Reject</Button>
                           </div>
                        </div>
                    ))}
                    {pendingRequests.length >= 5 && (
                         <Button variant="link" asChild className="w-full">
                            <Link href="/time-off">View All Pending Requests</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <Clock className="mx-auto h-8 w-8 mb-2" />
                    <p>No pending requests. Great job!</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
