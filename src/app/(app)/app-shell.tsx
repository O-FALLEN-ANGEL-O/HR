
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Award,
  Bot,
  Briefcase,
  Building2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Settings,
  Sparkles,
  Users,
  BarChart3,
  FileText,
  ShieldCheck,
  UserCog,
  WalletCards,
  MessageSquare,
  LifeBuoy,
  Target,
  User as UserIcon,
  ChevronsUpDown,
} from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarClose,
  SidebarInset,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { loginWithRole, logout } from '@/app/auth/actions';
import type { UserProfile, UserRole } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';


const getNavLinks = (role: UserRole) => {
  const dashboards = [
    { href: '/admin/dashboard', label: 'Admin Dashboard', icon: ShieldCheck, roles: ['admin'] },
    { href: '/super_hr/dashboard', label: 'Super HR Dashboard', icon: UserCog, roles: ['super_hr'] },
    { href: '/hr/dashboard', label: 'HR Dashboard', icon: LayoutDashboard, roles: ['hr_manager'] },
    { href: '/recruiter/dashboard', label: 'Recruiter Dashboard', icon: LayoutDashboard, roles: ['recruiter'] },
    { href: '/manager/dashboard', label: 'Manager Dashboard', icon: LayoutDashboard, roles: ['manager'] },
    { href: '/team-lead/dashboard', label: 'Team Lead Dashboard', icon: LayoutDashboard, roles: ['team_lead'] },
    { href: '/intern/dashboard', label: 'Intern Hub', icon: LayoutDashboard, roles: ['intern'] },
    { href: '/employee/dashboard', label: 'Home', icon: LayoutDashboard, roles: ['employee', 'finance', 'it_admin', 'support', 'auditor', 'interviewer'] },
  ];
  
  const allLinks = [
    // Unique Dashboards first
    ...dashboards.filter(link => link.roles.includes(role)),
    
    // Admin
    { href: '/admin/roles', label: 'Users & Roles', icon: Users, roles: ['admin', 'super_hr'] },
    
    // HR / Recruiter
    { href: '/hr/applicants', label: 'Applicants', icon: Users, roles: ['hr_manager', 'recruiter', 'super_hr'] },
    { href: '/recruiter/jobs', label: 'Job Postings', icon: Briefcase, roles: ['hr_manager', 'recruiter', 'super_hr'] },
    { href: '/hr/campus', label: 'Campus Drives', icon: GraduationCap, roles: ['hr_manager', 'recruiter', 'super_hr'] },
    { href: '/hr/onboarding', label: 'Onboarding', icon: ClipboardCheck, roles: ['hr_manager', 'super_hr'] },
    { href: '/interviewer/tasks', label: 'Interviews', icon: MessageSquare, roles: ['interviewer', 'hr_manager', 'recruiter', 'super_hr', 'manager'] },

    // Manager / Team Lead
    { href: '/manager/team', label: 'My Team', icon: Users, roles: ['manager', 'team_lead'], comingSoon: true },

    // Company Wide (visible to almost everyone)
    { href: '/leaves', label: 'Leave System', icon: Clock, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead', 'employee', 'intern'] },
    { href: '/expenses', label: 'Expenses', icon: WalletCards, roles: ['employee', 'manager', 'team_lead', 'hr_manager', 'super_hr', 'admin', 'finance'] },
    { href: '/company-feed', label: 'Company Feed', icon: Newspaper, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead', 'employee', 'intern'] },
    { href: '/performance', label: 'Performance', icon: BarChart3, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'employee'] },
    { href: '/performance/okrs', label: 'OKRs', icon: Target, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'employee'] },
    { href: '/employee/directory', label: 'Directory', icon: Users, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead', 'employee', 'intern', 'finance', 'it_admin', 'support', 'auditor', 'interviewer'] },
    { href: '/employee/documents', label: 'Documents', icon: FileText, roles: ['admin', 'super_hr', 'hr_manager', 'employee', 'intern', 'finance', 'it_admin', 'support'] },
    { href: '/employee/payslips', label: 'Payslips', icon: WalletCards, roles: ['hr_manager', 'super_hr', 'employee', 'finance'] },
    { href: '/employee/kudos', label: 'Kudos', icon: Award, roles: ['super_hr', 'hr_manager', 'manager', 'team_lead', 'employee', 'intern'] },
    { href: '/helpdesk', label: 'Helpdesk', icon: LifeBuoy, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead', 'employee', 'intern', 'support', 'it_admin', 'finance'] },

    // AI Tools
    { href: '/ai-tools/applicant-scoring', label: 'AI Applicant Scoring', icon: Sparkles, roles: ['hr_manager', 'recruiter', 'super_hr'] },
    { href: '/ai-tools/review-analyzer', label: 'AI Review Analyzer', icon: Sparkles, roles: ['hr_manager', 'super_hr', 'manager'] },
    { href: '/ai-tools/chatbot', label: 'AI HR Chatbot', icon: Bot, roles: ['employee', 'intern', 'manager', 'team_lead', 'hr_manager', 'super_hr', 'admin'] },
  ];

  // Filter links based on role and remove dashboard duplicates
  const userLinks = allLinks.filter(link => link.roles.includes(role));
  const uniqueLinks = userLinks.reduce((acc, current) => {
      if (!acc.find(item => item.href === current.href)) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof allLinks);

  // The very first link should always be the user's primary dashboard or home.
  const primaryDashboard = dashboards.find(d => d.roles.includes(role));
  const sortedLinks = uniqueLinks.sort((a, b) => {
    if (a.href === primaryDashboard?.href) return -1;
    if (b.href === primaryDashboard?.href) return 1;
    return 0;
  });


  return sortedLinks;
};

const allRoles: UserRole[] = [
  'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer',
  'manager', 'team_lead', 'employee', 'intern', 'finance',
  'it_admin', 'support', 'auditor',
];


export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserProfile;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === pathname) return true;
    if (path !== '/' && pathname.startsWith(path + '/')) return true;
    return false;
  }
  
  const role = user?.role || 'guest';
  const navLinks = getNavLinks(role);
  
  const handleRoleChange = async (newRole: UserRole) => {
    await loginWithRole(newRole);
    window.location.href = '/'; // Force a full reload to apply new role everywhere
  };
  
  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="h-14 flex-row items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold text-foreground group-data-[collapsible=icon]:hidden">HR+</span>
          </Link>
          <SidebarClose />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navLinks.map(link => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton asChild isActive={isActive(link.href)} disabled={link.comingSoon}>
                  <Link href={link.href}><link.icon />{link.label}</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="flex-col items-center gap-4">
          <div className="flex w-full items-center justify-between border-t p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-1 h-auto">
                   <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || ''} data-ai-hint="person" />
                    <AvatarFallback>{user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-sm items-start">
                    <span className="font-semibold">{user?.full_name || 'Guest'}</span>
                    <span className="text-muted-foreground capitalize">{user?.role.replace(/_/g, ' ') || 'user'}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile"><UserIcon className="mr-2"/>My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ChevronsUpDown className="mr-2 h-4 w-4" />
                    <span>Switch Role</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {allRoles.map((r) => (
                        <DropdownMenuItem key={r} onClick={() => handleRoleChange(r)} className="capitalize">
                          {r.replace(/_/g, ' ')}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                {(role === 'admin' || role === 'super_hr') && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin/roles"><Settings className="mr-2"/>Manage Roles</Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
