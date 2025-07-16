import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, ShieldCheck, History, HeartPulse, FileLock2, ScanSearch, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const features = [
    { href: "/admin/roles", icon: Users, title: "User & Role Management", description: "Assign roles, manage permissions, and add or remove users.", enabled: true },
    { href: "/hr/dashboard", icon: LayoutDashboard, title: "Global HR Dashboard", description: "View attrition, department strength, and more.", enabled: true },
    { href: "#", icon: History, title: "Role Audit History", description: "See who was assigned what role and when.", enabled: false },
    { href: "#", icon: HeartPulse, title: "System Health Monitor", description: "Track API health and integration logs.", enabled: false },
    { href: "#", icon: FileLock2, title: "Access Control Templates", description: "Predefined access sets for faster role setup.", enabled: false },
    { href: "#", icon: ScanSearch, title: "Audit Trail", description: "Review logs of all major actions in the system.", enabled: false },
    { href: "#", icon: ShieldCheck, title: "RLS Management", description: "Configure dynamic row-level security policies.", enabled: false }
  ];

  return (
    <>
      <Header title="Admin Dashboard" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Card>
              <CardHeader>
                  <CardTitle>Welcome, Admin!</CardTitle>
                  <CardDescription>This is your control center for the entire HR+ platform.</CardDescription>
              </CardHeader>
          </Card>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const card = (
                  <Card key={index} className={`flex flex-col h-full transition-all duration-300 ${feature.enabled ? 'hover:shadow-lg hover:-translate-y-1' : 'opacity-60 cursor-not-allowed bg-card'}`}>
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
