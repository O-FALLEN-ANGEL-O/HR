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
import { ArrowRight, PlusCircle, Upload, User } from 'lucide-react';
import { format } from 'date-fns';
import type { Onboarding, UserProfile } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StartOnboardingDialog } from '@/components/start-onboarding-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

type OnboardingClientProps = {
  initialWorkflows: Onboarding[];
  users: UserProfile[];
};

export default function OnboardingClient({ initialWorkflows, users }: OnboardingClientProps) {
  const [workflows, setWorkflows] = React.useState(initialWorkflows);
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);

  const refetchWorkflows = React.useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('onboarding_workflows')
        .select('*')
        .order('start_date', { ascending: false });

    if (error) {
        toast({ title: 'Error', description: 'Could not refetch onboarding workflows.', variant: 'destructive'});
    } else {
        setWorkflows(data || []);
    }
  }, [toast]);

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
          refetchWorkflows();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, refetchWorkflows]);

  return (
    <>
      <Header title="Onboarding Workflows">
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Export Report
        </Button>
        <StartOnboardingDialog users={users} onWorkflowAdded={refetchWorkflows}>
            <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Start Onboarding
            </Button>
        </StartOnboardingDialog>
      </Header>
      <main className="flex-1 p-4 md:p-6">
        <Card>
            <CardHeader>
            <CardTitle>Active Onboarding</CardTitle>
            <CardDescription>
                Track the progress of new hires through their onboarding journey.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <ScrollArea className="h-[65vh] w-full">
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
                            <AvatarImage src={workflow.employee_avatar || undefined} />
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback className="bg-primary/10 text-primary">M</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>Manager: {workflow.manager_name}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <ArrowRight className="h-4 w-4" />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Avatar className="h-6 w-6">
                                            {workflow.buddy_name ? (
                                                <AvatarFallback className="bg-secondary text-secondary-foreground">B</AvatarFallback>
                                            ) : (
                                                <AvatarFallback className="bg-muted text-muted-foreground">?</AvatarFallback>
                                            )}
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {workflow.buddy_name ? `Buddy: ${workflow.buddy_name}` : 'No Buddy Assigned'}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
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
            </ScrollArea>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
