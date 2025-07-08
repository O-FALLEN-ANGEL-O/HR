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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PerformanceReview } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

const statusColors: { [key: string]: string } = {
  Pending: 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
};

type PerformanceClientProps = {
  initialReviews: PerformanceReview[];
};

export default function PerformanceClient({ initialReviews }: PerformanceClientProps) {
  const [reviews, setReviews] = React.useState(initialReviews);
  const { toast } = useToast();

  React.useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-performance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'performance_reviews' },
        (payload) => {
          toast({
            title: 'Performance Reviews Updated',
            description: 'The list of performance reviews has been updated.',
          });
          if (payload.eventType === 'INSERT') {
            setReviews((prev) => [payload.new as PerformanceReview, ...prev].sort((a,b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setReviews((prev) =>
              prev.map((review) =>
                review.id === payload.new.id ? { ...review, ...(payload.new as PerformanceReview) } : review
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setReviews((prev) => prev.filter((review) => review.id !== (payload.old as PerformanceReview).id));
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
      <Header title="Performance Management">
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Start Review Cycle
        </Button>
      </Header>

      <Card>
        <CardHeader>
          <CardTitle>Performance Reviews</CardTitle>
          <CardDescription>
            Manage and track employee performance reviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={review.employee_avatar} />
                        <AvatarFallback>
                          {review.employee_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{review.employee_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.job_title}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{review.review_date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[review.status]}>
                      {review.status}
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
                        <DropdownMenuItem>View Review</DropdownMenuItem>
                        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
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
