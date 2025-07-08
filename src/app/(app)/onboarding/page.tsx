import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { onboardingWorkflows } from '@/lib/data';
import { PlusCircle, Upload } from 'lucide-react';
import { format } from 'date-fns';

export default function OnboardingPage() {
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
              {onboardingWorkflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={workflow.employeeAvatar} />
                        <AvatarFallback>
                          {workflow.employeeName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{workflow.employeeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {workflow.jobTitle}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(workflow.startDate), 'PPP')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">M:</span> {workflow.managerName}
                    </div>
                    <div>
                      <span className="font-medium">B:</span> {workflow.buddyName}
                    </div>
                  </TableCell>
                  <TableCell>{workflow.currentStep}</TableCell>
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
