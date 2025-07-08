'use client';

import * as React from 'react';
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
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Job } from '@/lib/types';
import { format } from 'date-fns';
import { MoreVertical, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

type JobsClientProps = {
  initialJobs: Job[];
}

const statusColors: { [key: string]: string } = {
    Open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'On hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

export default function JobsClient({ initialJobs }: JobsClientProps) {
  const [jobs, setJobs] = React.useState<Job[]>(initialJobs);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  React.useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const filteredJobs = React.useMemo(() => {
    return jobs
      .filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(job =>
        statusFilter === 'all' ? true : job.status === statusFilter
      );
  }, [jobs, searchTerm, statusFilter]);

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Input
          placeholder="Search by title or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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
        {filteredJobs.map(job => (
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
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Job</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">Close Job</DropdownMenuItem>
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
                <span>Posted {format(new Date(job.postedDate), 'PPP')}</span>
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
