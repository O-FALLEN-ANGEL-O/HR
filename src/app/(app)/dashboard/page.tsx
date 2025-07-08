import { Header } from '@/components/header';
import {
  Card,
  CardContent,
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
import { metrics, recentJobs } from '@/lib/data';
import { format } from 'date-fns';
import { ArrowUp, ArrowDown, PlusCircle, Upload, PlayCircle, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
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
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <p className="text-xs text-muted-foreground flex items-center">
                  {metric.changeType === 'increase' ? (
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
                        Posted on {format(new Date(job.postedDate), 'PPP')}
                      </div>
                    </TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>{job.applicants}</TableCell>
                    <TableCell>
                      <Badge
                        variant={job.status === 'Open' ? 'default' : 'secondary'}
                        className={job.status === 'Open' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
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
                        <PlusCircle className="mr-2 h-4 w-4"/> Post Job
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="#">
                        <PlayCircle className="mr-2 h-4 w-4"/> Run Compliance
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
  );
}
