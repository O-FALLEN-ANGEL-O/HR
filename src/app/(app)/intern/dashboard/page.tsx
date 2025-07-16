import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ClipboardCheck, BookOpen, Clock, Award, User, Wallet, BarChart } from 'lucide-react';
import Link from 'next/link';

export default function InternDashboardPage() {
  const features = [
    { href: "/hr/onboarding", icon: ClipboardCheck, title: "Onboarding Tasks", description: "Complete your onboarding checklist.", enabled: true },
    { href: "/leaves", icon: Clock, title: "Request Leave", description: "Apply for time off and track your requests.", enabled: true },
    { href: "/employee/documents", icon: BookOpen, title: "Learning Materials", description: "Access training documents and project briefs.", enabled: true },
    { href: "/employee/kudos", icon: Award, title: "Kudos", description: "Give and receive recognition.", enabled: true },
    { href: "#", icon: User, title: "My Mentor", description: "View your assigned mentor's profile.", enabled: false },
    { href: "#", icon: Wallet, title: "Stipend Tracker", description: "View stipend release date.", enabled: false },
    { href: "#", icon: BarChart, title: "Progress Card", description: "Auto-generated report from mentor.", enabled: false },
  ];
  
  return (
    <>
      <Header title="Intern Welcome Hub" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Card>
              <CardHeader>
                  <CardTitle>Welcome to the Team!</CardTitle>
                  <CardDescription>This is your portal for your internship journey. Here are some quick links to get you started.</CardDescription>
              </CardHeader>
          </Card>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const card = (
                  <Card key={index} className={`flex flex-col h-full transition-all duration-300 ${feature.enabled ? 'hover:shadow-lg hover:-translate-y-1' : 'opacity-60 cursor-not-allowed bg-muted/50'}`}>
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                          <div className="space-y-1">
                            <CardTitle className="text-base font-bold">{feature.title}</CardTitle>
                            <CardDescription className="text-xs">{feature.description}</CardDescription>
                          </div>
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <feature.icon className="h-5 w-5 text-primary" />
                          </div>
                      </CardHeader>
                      <CardContent className="flex-grow flex items-end">
                          {!feature.enabled && <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Coming Soon</p>}
                      </CardContent>
                  </Card>
                );

                return feature.enabled ? <Link href={feature.href} className="flex">{card}</Link> : card;
              })}
          </div>
        </div>
      </main>
    </>
  );
}
