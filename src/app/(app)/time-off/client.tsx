
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { TimeOffRequest } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


const statusColors: { [key: string]: string } = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

export default function TimeOffClient() {
  const [requests, setRequests] = React.useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true);
    
    const fetchRequests = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
          .from('time_off_requests')
          .select('*')
          .order('start_date', { ascending: false });

      if (error) {
          console.error('Error fetching time off requests:', error);
          toast({ title: 'Error', description: 'Could not load time off requests.', variant: 'destructive' });
      } else {
          setRequests(data || []);
      }
      setLoading(false);
    }

    fetchRequests();
  }, [toast]);
  
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
            setRequests((prev) => [payload.new as TimeOffRequest, ...prev].sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setRequests((prev) =>
              prev.map((request) =>
                request.id === payload.new.id ? { ...request, ...(payload.new as TimeOffRequest) } : request
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests((prev) => prev.filter((request) => request.id !== (payload.old as TimeOffRequest).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleUpdateRequest = async (id: string, status: 'Approved' | 'Rejected') => {
    const supabase = createClient();
    const { error } = await supabase
      .from('time_off_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: `Failed to update request. ${error.message}`, variant: 'destructive'});
    } else {
      toast({ title: 'Success', description: `Request has been ${status.toLowerCase()}.` });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Off Requests</CardTitle>
        <CardDescription>
          Review and approve employee time off requests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
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
                      ? `${format(new Date(request.start_date), 'PPP')} - ${format(
                          new Date(request.end_date),
                          'PPP'
                        )}`
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
                        <Button variant="outline" size="sm" onClick={() => handleUpdateRequest(request.id, 'Approved')}>
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateRequest(request.id, 'Rejected')}>
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
        )}
      </CardContent>
    </Card>
  );
}
