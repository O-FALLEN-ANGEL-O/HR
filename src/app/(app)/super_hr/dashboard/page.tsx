import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldCheck, UserCog, Users, BrainCircuit, GitBranch, DollarSign, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function SuperHrDashboardPage() {
  const features = [
    { href: "/hr/dashboard", icon: LayoutDashboard, title: "Global HR Dashboard", description: "View attrition, department strength, and more.", enabled: true },
    { href: "/admin/roles", icon: Users, title: "User & Role Management", description: "Assign roles and manage user permissions.", enabled: true },
    { href: "#", icon: DollarSign, title: "Salary Benchmarking", description: "Compare salaries to market standards.", enabled: false },
    { href: "#", icon: BrainCircuit, title: "Workforce Planning", description: "Predict future hiring needs.", enabled: false },
    { href: "#", icon: GitBranch, title: "Org Chart Builder", description: "Visualize and manage org structure.", enabled: false },
    { href: "#", icon: ShieldCheck, title: "Compliance Pulse", description: "View global compliance status.", enabled: false }
  ];

  return (
    <>
      <Header title="Super HR Dashboard" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
       <div className="mx-auto max-w-7xl space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Welcome, Super HR!</CardTitle>
                <CardDescription>Oversee advanced HR functions and manage system roles.</CardDescription>
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
