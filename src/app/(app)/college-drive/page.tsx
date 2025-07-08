import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { College } from '@/lib/types';

const statusColors: { [key: string]: string } = {
  Invited: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Attended: 'bg-green-100 text-green-800',
  Declined: 'bg-red-100 text-red-800',
};

export default async function CollegeDrivePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('colleges')
    .select('*')
    .order('lastContacted', { ascending: false });

  if (error) {
    console.error('Error fetching colleges:', error);
  }

  const colleges: College[] = data || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="College Drives & Internships">
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
                      {college.contactEmail}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[college.status]}>
                      {college.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{college.resumesReceived}</div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(college.lastContacted), 'PPP')}
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
                        <DropdownMenuItem>View Applicants</DropdownMenuItem>
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
