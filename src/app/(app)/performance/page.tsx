import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function PerformancePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Performance Management" />
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <BarChart3 className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="mt-4">Feature Coming Soon</CardTitle>
                <CardDescription>
                The Performance Management module is currently under development.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                We are working hard to bring you tools for tracking goals and providing feedback. Please check back later!
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
