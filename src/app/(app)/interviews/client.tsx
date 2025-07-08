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
import { Interview } from '@/lib/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MoreHorizontal, Phone, Users, Video } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type InterviewListProps = {
  initialInterviews: Interview[];
};

const statusColors: { [key: string]: string } = {
    Scheduled: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    Canceled: 'bg-red-100 text-red-800',
  };
  
const typeIcons: { [key: string]: React.ReactNode } = {
    Video: <Video className="h-4 w-4" />,
    Phone: <Phone className="h-4 w-4" />,
    'In-person': <Users className="h-4 w-4" />,
};

export default function InterviewList({ initialInterviews }: InterviewListProps) {
  const [interviews, setInterviews] = React.useState(initialInterviews);
  const [filter, setFilter] = React.useState('all');
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredInterviews = React.useMemo(() => {
    if (filter === 'all') return interviews;
    return interviews.filter((interview) => interview.status === filter);
  }, [interviews, filter]);

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="upcoming">
        <InterviewTable interviews={interviews.filter(i => i.status === 'Scheduled')} isClient={isClient} />
      </TabsContent>
      <TabsContent value="completed">
        <InterviewTable interviews={interviews.filter(i => i.status === 'Completed')} isClient={isClient} />
      </TabsContent>
      <TabsContent value="all">
        <InterviewTable interviews={interviews} isClient={isClient} />
      </TabsContent>
    </Tabs>
  );
}

function InterviewTable({ interviews, isClient }: { interviews: Interview[], isClient: boolean }) {
    if (interviews.length === 0) {
        return <div className="text-center text-muted-foreground p-8">No interviews to display.</div>
    }
    
    return (
        <Card>
            <CardContent className="p-0">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Interviewer</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {interviews.map((interview) => (
                    <TableRow key={interview.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={interview.candidate_avatar} />
                            <AvatarFallback>
                            {interview.candidate_name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{interview.candidate_name}</div>
                            <div className="text-sm text-muted-foreground">
                            for {interview.job_title}
                            </div>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={interview.interviewer_avatar} />
                            <AvatarFallback>
                            {interview.interviewer_name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span>{interview.interviewer_name}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{isClient ? format(new Date(interview.date), 'PPP') : null}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                             <Clock className="h-4 w-4 ml-0.5" />
                             <span className="ml-0.5">{interview.time}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        {typeIcons[interview.type]}
                        <span>{interview.type}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className={statusColors[interview.status]}>
                        {interview.status}
                        </Badge>
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
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Collect Feedback</DropdownMenuItem>
                            <DropdownMenuItem>Reschedule</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
    )
}
