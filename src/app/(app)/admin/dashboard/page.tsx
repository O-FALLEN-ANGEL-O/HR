import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Settings, Workflow } from 'lucide-react';
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Settings</CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Configure system-wide settings and integrations. (Coming Soon)</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Workflow Automation</CardTitle>
                    <Workflow className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Manage and automate HR workflows. (Coming Soon)</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
