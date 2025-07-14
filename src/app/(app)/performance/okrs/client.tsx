'use client';

import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Target } from 'lucide-react';
import type { Objective } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

const statusColors = {
  on_track: 'bg-green-100 text-green-800',
  at_risk: 'bg-yellow-100 text-yellow-800',
  off_track: 'bg-red-100 text-red-800',
};

const statusText = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  off_track: 'Off Track',
};

export default function OkrClient({ initialObjectives }: { initialObjectives: Objective[] }) {
  const [objectives, setObjectives] = React.useState(initialObjectives);
  const { toast } = useToast();

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-okrs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'objectives' },
        () => {
            // Refetch logic here or simply reload for now
            window.location.reload();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'key_results' },
        () => {
            window.location.reload();
        }
      )
      .subscribe();
      
      return () => {
          supabase.removeChannel(channel);
      }
  }, []);


  return (
    <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>Company OKRs</CardTitle>
                <CardDescription>Track progress towards company-wide and individual goals.</CardDescription>
            </div>
            <Button><PlusCircle className="mr-2"/> Add Objective</Button>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {objectives.map((objective) => {
                    const overallProgress = objective.key_results.length > 0
                        ? objective.key_results.reduce((acc, kr) => acc + kr.progress, 0) / objective.key_results.length
                        : 0;

                    return (
                        <AccordionItem value={objective.id} key={objective.id}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-4 flex-1 pr-4">
                                    <Avatar>
                                        <AvatarImage src={objective.users?.avatar_url || undefined} />
                                        <AvatarFallback>{objective.users?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold">{objective.title}</p>
                                        <p className="text-sm text-muted-foreground">{objective.users?.full_name} &bull; {objective.quarter}</p>
                                    </div>
                                    <div className="w-48">
                                        <Progress value={overallProgress} />
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/2">Key Result</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Progress</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {objective.key_results.map((kr) => (
                                            <TableRow key={kr.id}>
                                                <TableCell>{kr.description}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={statusColors[kr.status]}>
                                                        {statusText[kr.status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={kr.progress} className="w-32" />
                                                        <span>{kr.progress}%</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
        </CardContent>
    </Card>
  );
}
