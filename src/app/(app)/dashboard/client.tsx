'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Metric, Job } from '@/lib/types';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardCharts } from './charts';

import { format } from 'date-fns';
import {
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Upload,
  PlayCircle,
  Users,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

const employeeDistributionData = [
    { role: 'Engineering', count: 450, fill: 'var(--color-engineering)' },
    { role: 'Product', count: 150, fill: 'var(--color-product)' },
    { role: 'Design', count: 100, fill: 'var(--color-design)' },
    { role: 'Sales', count: 250, fill: 'var(--color-sales)' },
    { role: 'HR', count: 54, fill: 'var(--color-hr)' },
    { role: 'Other', count: 200, fill: 'var(--color-other)' },
];

const hiringPipelineData = [
    { stage: 'Applied', count: 125 },
    { stage: 'Screening', count: 80 },
    { stage: 'Interview', count: 45 },
    { stage: 'Offer', count: 15 },
];


type DashboardClientProps = {
    initialMetrics: Metric[];
    initialRecentJobs: Job[];
}

export default function DashboardClient({ initialMetrics, initialRecentJobs }: DashboardClientProps) {
    const [metrics, setMetrics] = React.useState(initialMetrics);
    const [recentJobs, setRecentJobs] = React.useState(initialRecentJobs);
    const { toast } = useToast();

    React.useEffect(() => {
        setMetrics(initialMetrics);
    }, [initialMetrics]);

    React.useEffect(() => {
        setRecentJobs(initialRecentJobs);
    }, [initialRecentJobs]);

    React.useEffect(() => {
        const supabase = createClient();
        const metricsChannel = supabase
            .channel('realtime-metrics')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'metrics' },
                (payload) => {
                     toast({
                        title: 'Metrics Updated',
                        description: 'Dashboard metrics have been updated.',
                    });
                    if (payload.eventType === 'INSERT') {
                        setMetrics((prev) => [...prev, payload.new as Metric].sort((a,b) => a.id - b.id));
                    } else if (payload.eventType === 'UPDATE') {
                        setMetrics((prev) =>
                            prev.map((metric) =>
                                metric.id === payload.new.id ? { ...metric, ...(payload.new as Metric) } : metric
                            )
                        );
                    }
                }
            ).subscribe();
        
        const jobsChannel = supabase
            .channel('realtime-dashboard-jobs')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'jobs' },
                (payload) => {
                    toast({
                        title: 'Job Postings Updated',
                        description: 'Recent job postings have been updated.',
                    });
                     if (payload.eventType === 'INSERT') {
                        setRecentJobs((prev) => [payload.new as Job, ...prev].sort((a,b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()).slice(0,3));
                    } else if (payload.eventType === 'UPDATE') {
                       // Check if the job is already in the list
                        const jobExists = recentJobs.some(job => job.id === payload.new.id);
                        if (jobExists) {
                             setRecentJobs((prev) => prev.map((job) => job.id === payload.new.id ? { ...job, ...(payload.new as Job) } : job));
                        } else {
                            // If not, it might be a new "Open" job, add it and resort
                             setRecentJobs((prev) => [payload.new as Job, ...prev].sort((a,b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()).slice(0,3));
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setRecentJobs((prev) => prev.filter((job) => job.id !== (payload.old as Job).id));
                    }
                }
            ).subscribe();

        return () => {
            supabase.removeChannel(metricsChannel);
            supabase.removeChannel(jobsChannel);
        }

    }, [toast, recentJobs]);


    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Header title="Dashboard">
                <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Export
                </Button>
                <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Employee
                </Button>
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
                    hiringPipelineData={hiringPipelineData}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Recent Job Postings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Applicants</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentJobs.map((job) => (
                        <TableRow key={job.id}>
                            <TableCell>
                            <div className="font-medium">{job.title}</div>
                            <div className="text-sm text-muted-foreground">
                                Posted on {format(new Date(job.posted_date), 'PPP')}
                            </div>
                            </TableCell>
                            <TableCell>{job.department}</TableCell>
                            <TableCell>{job.applicants}</TableCell>
                            <TableCell>
                            <Badge
                                variant={job.status === 'Open' ? 'default' : 'secondary'}
                                className={
                                job.status === 'Open'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : ''
                                }
                            >
                                {job.status}
                            </Badge>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Quick Actions & Notifications</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                    <Button asChild variant="outline">
                        <Link href="/jobs">
                        <PlusCircle className="mr-2 h-4 w-4" /> Post Job
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="#">
                        <PlayCircle className="mr-2 h-4 w-4" /> Run Compliance
                        </Link>
                    </Button>
                    </div>
                    <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                        <p className="text-sm font-medium">New hire onboard</p>
                        <p className="text-sm text-muted-foreground">
                            Olivia Martinez has completed the initial paperwork.
                        </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <Calendar className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                        <p className="text-sm font-medium">Interview Reminder</p>
                        <p className="text-sm text-muted-foreground">
                            Sophia Williams' final interview is tomorrow at 10 AM.
                        </p>
                        </div>
                    </div>
                    </div>
                </CardContent>
                </Card>
            </div>
        </div>
    )
}
