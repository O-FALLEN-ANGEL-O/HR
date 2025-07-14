'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Job } from '@/lib/types';
import { format } from 'date-fns';
import { MoreVertical, Users, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { JobDialog } from '@/components/job-dialog';
import { Header } from '@/components/header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


type JobsClientProps = {
  initialJobs: Job[];
};

const statusColors: { [key: string]: string } = {
  Open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'On hold':
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export default function JobsClient({ initialJobs }: JobsClientProps) {
  const [jobs, setJobs] = React.useState<Job[]>(initialJobs);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [isClient, setIsClient] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          toast({
            title: 'Job Postings Updated',
            description: 'The list of jobs has been updated.',
          });
           if (payload.eventType === 'INSERT') {
            setJobs((prev) => [payload.new as Job, ...prev].sort((a,b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((job) =>
                job.id === payload.new.id ? { ...job, ...(payload.new as Job) } : job
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setJobs((prev) => prev.filter((job) => job.id !== (payload.old as Job).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const filteredJobs = React.useMemo(() => {
    return jobs
      .filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((job) =>
        statusFilter === 'all' ? true : job.status === statusFilter
      );
  }, [jobs, searchTerm, statusFilter]);

  const handleJobAction = async (jobId: string, status: 'Closed' | 'On hold') => {
    const supabase = createClient();
    const { error } = await supabase
      .from('jobs')
      .update({ status: status })
      .eq('id', jobId);

    if (error) {
      toast({ title: 'Error', description: `Failed to update job status. ${error.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Job has been ${status === 'Closed' ? 'closed' : 'put on hold'}.` });
    }
  };

  return (
    <>
      <Header title="Job Postings Management">
        <JobDialog onJobAddedOrUpdated={() => {}}>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </JobDialog>
      </Header>
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
        <Input
          placeholder="Search by title or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-auto sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="On hold">On hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{job.title}</CardTitle>
                  <CardDescription>{job.department}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <JobDialog job={job} onJobAddedOrUpdated={() => {}}>
                       <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Job
                       </DropdownMenuItem>
                    </JobDialog>
                    <DropdownMenuItem onClick={() => handleJobAction(job.id, 'On hold')}>
                      <MoreVertical className="mr-2 h-4 w-4" /> Put on hold
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-red-500" onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Close Job
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will mark the job as 'Closed'. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleJobAction(job.id, 'Closed')}>
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  <span>{job.applicants} Applicants</span>
                </div>
                <span>
                  Posted {isClient ? format(new Date(job.posted_date), 'PPP') : null}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary" className={statusColors[job.status]}>
                {job.status}
              </Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
