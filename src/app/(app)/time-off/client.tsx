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
import { Check, UserCheck, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { TimeOffRequest, TimeOffMetric } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const statusColors: { [key: string]: string } = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

const chartConfig = {
  requests: {
    label: 'Requests',
  },
  vacation: {
    label: 'Vacation',
    color: 'hsl(var(--chart-1))',
  },
  sick: {
    label: 'Sick Leave',
    color: 'hsl(var(--chart-2))',
  },
  personal: {
    label: 'Personal',
    color: 'hsl(var(--chart-3))',
  },
};

type TimeOffClientProps = {
  initialRequests: TimeOffRequest[];
  initialMetrics: TimeOffMetric[];
  initialChartData: any[];
};

export default function TimeOffClient({
  initialRequests,
  initialMetrics,
  initialChartData,
}: TimeOffClientProps) {
  const [requests, setRequests] = React.useState<TimeOffRequest[]>(initialRequests);
  const [metrics, setMetrics] = React.useState<TimeOffMetric[]>(initialMetrics);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    // This effect ensures that if the server component re-fetches, the client state is updated.
    setRequests(initialRequests);
    setMetrics(initialMetrics);
  }, [initialRequests, initialMetrics]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-time-off')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_off_requests' },
        (payload) => {
          toast({
            title: 'Time Off Requests Updated',
            description: 'The list of time off requests has been updated.',
          });
          if (payload.eventType === 'INSERT') {
            setRequests((prev) =>
              [payload.new as TimeOffRequest, ...prev].sort(
                (a, b) =>
                  new Date(b.start_date).getTime() -
                  new Date(a.start_date).getTime()
              )
            );
          } else if (payload.eventType === 'UPDATE') {
            setRequests((prev) =>
              prev.map((request) =>
                request.id === payload.new.id
                  ? { ...request, ...(payload.new as TimeOffRequest) }
                  : request
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests((prev) =>
              prev.filter(
                (request) => request.id !== (payload.old as TimeOffRequest).id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

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
                          <AvatarImage src={request.employee_avatar} />
                          <AvatarFallback>
                            {request.employee_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {request.employee_name}
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
              <BarChart data={initialChartData} layout="vertical" margin={{left: 10}}>
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