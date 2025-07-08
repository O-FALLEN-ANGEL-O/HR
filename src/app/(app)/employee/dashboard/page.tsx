import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Clock, FileText } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="My Dashboard" />
       <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Welcome!</CardTitle>
                <CardDescription>Your personal employee dashboard.</CardDescription>
            </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/time-off">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Time Off</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Request time off and view your leave balance.</p>
                    </CardContent>
                </Card>
            </Link>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Documents</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Access your personal documents and company policies. (Coming Soon)</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
