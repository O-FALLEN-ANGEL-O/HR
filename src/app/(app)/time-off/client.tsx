'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, UserCheck, Users, X, Sun, Umbrella, Calendar } from 'lucide-react';
import { format, subMonths, getMonth } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { TimeOffRequest, TimeOffMetric, UserProfile, LeaveBalance, Holiday } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AddTimeOffDialog } from '@/components/add-time-off-dialog';

const statusColors: { [key: string]: string } = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

const chartConfig = {
  requests: { label: 'Requests' },
  vacation: { label: 'Vacation', color: 'hsl(var(--chart-1))' },
  sick: { label: 'Sick Leave', color: 'hsl(var(--chart-2))' },
  personal: { label: 'Personal', color: 'hsl(var(--chart-3))' },
};

// In a real app, this data would come from your backend based on company policy and employee tenure.
const mockLeaveBalances: LeaveBalance[] = [
  { type: 'Annual', balance: 14, accruedThisYear: 24 },
  { type: 'Sick', balance: 8, accruedThisYear: 12 },
  { type: 'Unpaid', balance: 2, accruedThisYear: 2 },
];

const currentYear = new Date().getFullYear();
const mockHolidays: Holiday[] = [
  { date: `${currentYear}-01-01`, name: "New Year's Day" },
  { date: `${currentYear}-01-26`, name: "Republic Day" },
  { date: `${currentYear}-03-25`, name: "Holi" },
  { date: `${currentYear}-08-15`, name: "Independence Day" },
  { date: `${currentYear}-10-02`, name: "Gandhi Jayanti" },
  { date: `${currentYear}-10-31`, name: "Diwali" },
  { date: `${currentYear}-12-25`, name: "Christmas" },
];


type TimeOffClientProps = {
    user: UserProfile | null;
    initialRequests: TimeOffRequest[];
    initialMetrics: TimeOffMetric[];
};

export default function TimeOffClient({ user, initialRequests, initialMetrics }: TimeOffClientProps) {
  const [requests, setRequests] = React.useState<TimeOffRequest[]>(initialRequests);
  const [metrics, setMetrics] = React.useState<TimeOffMetric[]>(initialMetrics);
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  
  const isManager = user?.role === 'admin' || user?.role === 'super_hr' || user?.role === 'hr_manager';

  const fetchData = React.useCallback(async () => {
    const supabase = createClient();
    const { data: requestsData, error } = await supabase
        .from('time_off_requests')
        .select('*, users (full_name, avatar_url)')
        .order('start_date', { ascending: false });

    if (error) {
        console.error('Error fetching time off requests:', error);
        return;
    }
    setRequests(requestsData || []);
  }, []);

  React.useEffect(() => {
    setIsClient(true);
    setRequests(initialRequests);
    setMetrics(initialMetrics);

    // Chart Data
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 2);
    const months = [format(threeMonthsAgo, 'MMMM'), format(subMonths(now, 1), 'MMMM'), format(now, 'MMMM')];
    
    const newChartData = months.map((monthName, index) => {
        const monthIndex = getMonth(subMonths(now, 2 - index));
        const monthRequests = initialRequests.filter(r => getMonth(new Date(r.start_date)) === monthIndex);
        
        return {
            month: monthName,
            vacation: monthRequests.filter(r => r.type === 'Vacation').length,
            sick: monthRequests.filter(r => r.type === 'Sick Leave').length,
            personal: monthRequests.filter(r => r.type === 'Personal').length,
        }
    });
    setChartData(newChartData);

    const supabase = createClient();
    const channel = supabase
      .channel('realtime-time-off')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_off_requests' },
        () => {
          toast({
            title: 'Time Off Requests Updated',
            description: 'The list of time off requests has been updated.',
          });
          fetchData(); // Refetch all data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialRequests, initialMetrics, fetchData, toast]);
  

  const handleUpdateRequest = async (
    id: string,
    status: 'Approved' | 'Rejected'
  ) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('time_off_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to update request. ${error.message}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Request has been ${status.toLowerCase()}.`,
      });
    }
  };
  
  if (!user) {
    return <p>You must be logged in to view this page.</p>;
  }

  // Employee View
  if (!isManager) {
    const employeeRequests = requests.filter(r => r.user_id === user.id);
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Leave Balances</CardTitle>
                    <CardDescription>Your available leave days as of today.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    {mockLeaveBalances.map(balance => {
                        let icon;
                        if (balance.type === 'Annual') icon = <Sun className="h-6 w-6 text-yellow-500" />;
                        else if (balance.type === 'Sick') icon = <Umbrella className="h-6 w-6 text-blue-500" />;
                        else icon = <Calendar className="h-6 w-6 text-gray-500" />;

                        return (
                            <Card key={balance.type}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{balance.type} Leave</CardTitle>
                                    {icon}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">{balance.balance}</div>
                                    <p className="text-xs text-muted-foreground">{balance.accruedThisYear} days accrued this year</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Dates</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {employeeRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.type}</TableCell>
                                    <TableCell>{isClient ? `${format(new Date(req.start_date), 'PPP')} - ${format(new Date(req.end_date), 'PPP')}`: null}</TableCell>
                                    <TableCell><Badge variant="secondary" className={statusColors[req.status]}>{req.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Public Holidays</CardTitle>
                    <CardDescription>List of recognized public holidays for {currentYear}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Day</TableHead><TableHead>Holiday Name</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {mockHolidays.map(holiday => {
                                const date = new Date(holiday.date + 'T00:00:00');
                                const day = date.toLocaleDateString('en-US', { weekday: 'long' });
                                const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                                return (
                                    <TableRow key={holiday.name}>
                                        <TableCell>{formattedDate}</TableCell>
                                        <TableCell>{day}</TableCell>
                                        <TableCell className="font-medium">{holiday.name}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
  }

  // Manager View
  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.title === 'Pending Requests' && <UserCheck className="h-4 w-4 text-muted-foreground" />}
              {metric.title === 'On Leave Today' && <Users className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>All Time Off Requests</CardTitle>
            <CardDescription>Review and manage all employee leave requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={(request as any).users?.avatar_url} />
                          <AvatarFallback>
                            {(request as any).users?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {(request as any).users?.full_name || '...'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>
                      {isClient
                        ? `${format(
                            new Date(request.start_date),
                            'PPP'
                          )} - ${format(new Date(request.end_date), 'PPP')}`
                        : null}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[request.status]}
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === 'Pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateRequest(request.id, 'Approved')}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateRequest(request.id, 'Rejected')}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Leave Trends</CardTitle>
            <CardDescription>Last 3 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} layout="vertical" margin={{left: 10}}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="month" type="category" tickLine={false} axisLine={false} tickMargin={10}/>
                <XAxis dataKey="requests" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="vacation" name="Vacation" stackId="a" fill="var(--color-vacation)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="sick" name="Sick Leave" stackId="a" fill="var(--color-sick)" radius={0} />
                <Bar dataKey="personal" name="Personal" stackId="a" fill="var(--color-personal)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
