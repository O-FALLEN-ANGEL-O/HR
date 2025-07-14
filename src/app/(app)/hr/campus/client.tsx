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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Send, Users } from 'lucide-react';
import { format } from 'date-fns';
import type { College } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const statusColors: { [key: string]: string } = {
  Invited: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Attended: 'bg-green-100 text-green-800',
  Declined: 'bg-red-100 text-red-800',
};

type CollegeDriveClientProps = {
  initialColleges: College[];
};

export default function CollegeDriveClient({ initialColleges }: CollegeDriveClientProps) {
  const [colleges, setColleges] = React.useState(initialColleges);
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    setColleges(initialColleges);
  }, [initialColleges]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-colleges')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'colleges' },
        async () => {
          toast({
            title: 'College Data Updated',
            description: 'The list of colleges has been updated.',
          });
          const { data } = await supabase
            .from('colleges')
            .select('*, applicants(count)')
            .order('last_contacted', { ascending: false });
          
          if(data) {
             const updatedColleges = data.map(c => ({
              ...c,
              resumes_received: c.applicants[0]?.count || 0,
            }));
            setColleges(updatedColleges);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="College Drives &amp; Internships">
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Invite College
        </Button>
      </Header>

      <Card>
        <CardHeader>
          <CardTitle>Partner Colleges</CardTitle>
          <CardDescription>
            Manage campus recruitment drives and track correspondence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>College Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resumes Received</TableHead>
                <TableHead>Last Contacted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colleges.map((college) => (
                <TableRow key={college.id}>
                  <TableCell>
                    <div className="font-medium">{college.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {college.contact_email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[college.status]}>
                      {college.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{college.resumes_received}</div>
                  </TableCell>
                  <TableCell>
                    {isClient ? format(new Date(college.last_contacted), 'PPP') : ''}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" />
                          Send Reminder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/hr/applicants')}>
                          <Users className="mr-2 h-4 w-4" />
                          View Applicants
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
