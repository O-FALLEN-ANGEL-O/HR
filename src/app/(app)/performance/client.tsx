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
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

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
        async (payload) => {
          toast({
            title: 'Performance Reviews Updated',
            description: 'The list of performance reviews has been updated.',
          });
          
          const { data, error } = await supabase
            .from('performance_reviews')
            .select('*, users(full_name, avatar_url)')
            .order('review_date', { ascending: false });

          if (error) {
            console.error("Error re-fetching performance reviews", error);
          } else {
             setReviews(data || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return (
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Performance Reviews</CardTitle>
            <CardDescription>
              Manage and track employee performance reviews.
            </CardDescription>
          </div>
           <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Start Review Cycle
          </Button>
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
                        <AvatarImage src={review.users?.avatar_url || undefined} />
                        <AvatarFallback>
                          {review.users?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{review.users?.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.job_title}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isClient && review.review_date ? format(new Date(review.review_date), 'PPP') : ''}
                  </TableCell>
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
  );
}
