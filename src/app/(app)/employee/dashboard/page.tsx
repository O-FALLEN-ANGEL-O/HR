import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Clock, Users, FileText, Award, FolderKanban, LifeBuoy, User, GitCommit, Handshake, BarChart, BadgePercent } from 'lucide-react';
import Link from 'next/link';

const features = [
    {
        title: "My Profile",
        description: "View and manage your personal information.",
        icon: User,
        href: "#",
        comingSoon: true,
    },
    {
        title: "Leave Manager",
        description: "Apply for leave and view balance.",
        icon: Clock,
        href: "/leaves",
    },
     {
        title: "Leave Forecast",
        description: "AI suggests best dates for vacation.",
        icon: GitCommit,
        href: "#",
        comingSoon: true,
    },
    {
        title: "Employee Directory",
        description: "Find and connect with your colleagues.",
        icon: Users,
        href: "/employee/directory",
    },
    {
        title: "Payslips",
        description: "Access and download your monthly payslips.",
        icon: FileText,
        href: "/employee/payslips",
    },
    {
        title: "Salary Breakdown",
        description: "Interactive chart of your CTC vs in-hand.",
        icon: BarChart,
        href: "#",
        comingSoon: true,
    },
    {
        title: "Kudos",
        description: "Recognize your peers for their great work.",
        icon: Award,
        href: "/employee/kudos",
    },
    {
        title: "Peer Endorsements",
        description: "Give skill-based endorsements to peers.",
        icon: Handshake,
        href: "#",
        comingSoon: true,
    },
    {
        title: "Engagement Polls",
        description: "Quick one-question polls from HR.",
        icon: BadgePercent,
        href: "#",
        comingSoon: true,
    },
    {
        title: "Company Policies",
        description: "Read and acknowledge company documents.",
        icon: FolderKanban,
        href: "/employee/documents",
    },
     {
        title: "Helpdesk",
        description: "Submit a ticket to IT or HR for assistance.",
        icon: LifeBuoy,
        href: "/helpdesk",
    },
]

export default function EmployeeDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="My Dashboard" />
       <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Welcome!</CardTitle>
                <CardDescription>This is your personal employee dashboard. Access all your tools and information from here.</CardDescription>
            </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
                 const cardContent = (
                    <Card className={`${!feature.comingSoon && 'hover:bg-muted/50 transition-colors'} h-full`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
                            <feature.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                            {feature.comingSoon && <p className="text-xs font-bold text-primary mt-2">Coming Soon</p>}
                        </CardContent>
                    </Card>
                );

                return feature.comingSoon ? <div key={feature.title} className="cursor-not-allowed opacity-60">{cardContent}</div> : (
                     <Link href={feature.href} key={feature.title}>
                        {cardContent}
                    </Link>
                )
            })}
        </div>
      </div>
    </div>
  );
}
