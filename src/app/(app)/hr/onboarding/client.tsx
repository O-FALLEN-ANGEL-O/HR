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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Upload } from 'lucide-react';
import { format } from 'date-fns';
import type { Onboarding } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

type OnboardingClientProps = {
  initialWorkflows: Onboarding[];
};

export default function OnboardingClient({ initialWorkflows }: OnboardingClientProps) {
  const [workflows, setWorkflows] = React.useState(initialWorkflows);
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    setWorkflows(initialWorkflows);
  }, [initialWorkflows]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-onboarding')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'onboarding_workflows' },
        (payload) => {
          toast({
            title: 'Onboarding Data Updated',
            description: 'The list of onboarding workflows has been updated.',
          });
          if (payload.eventType === 'INSERT') {
            setWorkflows((prev) => [payload.new as Onboarding, ...prev].sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setWorkflows((prev) =>
              prev.map((workflow) =>
                workflow.id === payload.new.id ? { ...workflow, ...(payload.new as Onboarding) } : workflow
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setWorkflows((prev) => prev.filter((workflow) => workflow.id !== (payload.old as Onboarding).id));
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
      <Header title="Onboarding Workflows">
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Export Report
        </Button>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Start Onboarding
        </Button>
      </Header>

      <Card>
        <CardHeader>
          <CardTitle>Active Onboarding</CardTitle>
          <CardDescription>
            Track the progress of new hires through their onboarding journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Manager / Buddy</TableHead>
                <TableHead>Current Step</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={workflow.employee_avatar} />
                        <AvatarFallback>
                          {workflow.employee_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{workflow.employee_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {workflow.job_title}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isClient ? format(new Date(workflow.start_date), 'PPP') : ''}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">M:</span> {workflow.manager_name}
                    </div>
                    <div>
                      <span className="font-medium">B:</span> {workflow.buddy_name}
                    </div>
                  </TableCell>
                  <TableCell>{workflow.current_step}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={workflow.progress} className="w-32" />
                      <span className="text-sm font-medium">
                        {workflow.progress}%
                      </span>
                    </div>
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
