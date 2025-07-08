import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ClipboardCheck, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function InternDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Intern Welcome Hub" />
       <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Welcome to the Team!</CardTitle>
                <CardDescription>This is your portal for your internship journey.</CardDescription>
            </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/onboarding">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Onboarding Tasks</CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Complete your onboarding checklist.</p>
                    </CardContent>
                </Card>
            </Link>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Learning Materials</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Access training documents and project briefs. (Coming Soon)</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
