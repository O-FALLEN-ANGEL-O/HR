import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Settings, Workflow, ScanSearch, FileText, ShieldCheck, History, HeartPulse, FileArchive, LayoutDashboard, FileLock2, BarChart, GitBranch, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Admin Dashboard" />
      <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Welcome, Admin!</CardTitle>
                <CardDescription>This is your control center for the entire HR+ platform.</CardDescription>
            </CardHeader>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/roles">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">User & Role Management</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Assign roles, manage permissions, and add or remove users.</p>
                    </CardContent>
                </Card>
            </Link>
             <Link href="/hr/dashboard">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Global HR Dashboard</CardTitle>
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">View attrition, department strength, and more.</p>
                    </CardContent>
                </Card>
            </Link>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Role Audit History</CardTitle>
                    <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">See who was assigned what role and when. (Coming Soon)</p>
                </CardContent>
            </Card>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Health Monitor</CardTitle>
                    <HeartPulse className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Track API health and integration logs. (Coming Soon)</p>
                </CardContent>
            </Card>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Access Control Templates</CardTitle>
                    <FileLock2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Predefined access sets for faster role setup. (Coming Soon)</p>
                </CardContent>
            </Card>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Audit Trail</CardTitle>
                    <ScanSearch className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Review logs of all major actions in the system. (Coming Soon)</p>
                </CardContent>
            </Card>
             <Card className="opacity-60 cursor-not-allowed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">RLS Management</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Configure dynamic row-level security policies. (Coming Soon)</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
