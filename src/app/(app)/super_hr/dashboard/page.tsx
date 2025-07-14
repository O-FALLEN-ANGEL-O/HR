import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldCheck, UserCog, Workflow, Users, Clock, FileText, DollarSign, BrainCircuit, BarChart, GitBranch } from 'lucide-react';
import Link from 'next/link';

export default function SuperHrDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Super HR Dashboard" />
       <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Welcome, Super HR!</CardTitle>
                <CardDescription>Oversee advanced HR functions and manage system roles.</CardDescription>
            </CardHeader>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/hr/dashboard">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Global HR Dashboard</CardTitle>
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">View attrition, department strength, and more.</p>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/admin/roles">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">User & Role Management</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Assign roles and manage user permissions.</p>
                    </CardContent>
                </Card>
            </Link>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Salary Benchmarking</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Compare salaries to market standards. (Coming soon)</p>
                </CardContent>
            </Card>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Workforce Planning</CardTitle>
                    <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Predict future hiring needs. (Coming soon)</p>
                </CardContent>
            </Card>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Org Chart Builder</CardTitle>
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Visualize and manage org structure. (Coming soon)</p>
                </CardContent>
            </Card>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliance Pulse</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">View global compliance status. (Coming soon)</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
