'use client';

import * as React from 'react';
import type { Metric, UserProfile } from '@/lib/types';
import dynamic from 'next/dynamic';

import { Header } from '@/components/header';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { format } from 'date-fns';
import {
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Upload,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AddEmployeeDialog } from '@/components/add-employee-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const DashboardCharts = dynamic(() => import('./charts').then(mod => mod.DashboardCharts), {
    ssr: false,
    loading: () => (
        <>
            <Card className="lg:col-span-3">
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Skeleton className="h-[250px] w-[250px] rounded-full" />
                </CardContent>
            </Card>
            <Card className="lg:col-span-4">
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[280px] w-full" />
                </CardContent>
            </Card>
        </>
    )
});


type DashboardClientProps = {
    initialMetrics: Metric[];
    initialRecentHires: Partial<UserProfile>[];
    employeeDistributionData: any[];
    jobFunnelData: any[];
}

export default function HrDashboardClient({ initialMetrics, initialRecentHires, employeeDistributionData, jobFunnelData }: DashboardClientProps) {
    const [metrics, setMetrics] = React.useState(initialMetrics);
    const [recentHires, setRecentHires] = React.useState(initialRecentHires);
    const { toast } = useToast();

    React.useEffect(() => {
        setMetrics(initialMetrics);
    }, [initialMetrics]);

    React.useEffect(() => {
        setRecentHires(initialRecentHires);
    }, [initialRecentHires]);

    React.useEffect(() => {
        const supabase = createClient();
        
        const channel = supabase
            .channel('realtime-hr-dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'users' },
                () => {
                     toast({
                        title: 'Dashboard Updated',
                        description: 'Dashboard data has been updated.',
                    });
                     // In a real app, you would refetch all the data here.
                     // For now, a reload is a simple way to see updates.
                     window.location.reload();
                }
            ).subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        }

    }, [toast]);


    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Header title="HR Dashboard">
               <div className="flex flex-wrap gap-2">
                 <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Export
                    </Button>
                    <AddEmployeeDialog onEmployeeAdded={() => window.location.reload()}>
                        <Button size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Employee
                        </Button>
                    </AddEmployeeDialog>
               </div>
            </Header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    {metric.change && (
                        <p className="flex items-center text-xs text-muted-foreground">
                        {metric.change_type === 'increase' ? (
                            <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <ArrowDown className="h-4 w-4 text-red-500" />
                        )}
                        {metric.change} from last month
                        </p>
                    )}
                    </CardContent>
                </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                <DashboardCharts 
                    employeeDistributionData={employeeDistributionData} 
                    hiringPipelineData={jobFunnelData}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-7">
                <CardHeader>
                    <CardTitle>Recently Hired Employees</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Joined On</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentHires.map((employee) => (
                            <TableRow key={employee.email}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{employee.full_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="font-medium whitespace-nowrap">{employee.full_name}</div>
                                    </div>
                                </TableCell>
                                <TableCell>{employee.department}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {format(new Date(employee.created_at!), 'PPP')}
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
                </Card>
            </div>
        </div>
    )
}
