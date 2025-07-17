'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Newspaper,
  PenSquare,
  ScanSearch,
  Settings,
  Sparkles,
  Users,
  BarChart3,
  UserCheck,
  FileText,
  ShieldCheck,
  UserCog,
  WalletCards,
  MessageSquare,
  LifeBuoy,
  Target,
  User as UserIcon,
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
import { logout } from '@/app/auth/actions';
import type { UserProfile, UserRole } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const getNavLinks = (role: UserRole) => {
  const allLinks = [
    // Dashboards
    { href: '/admin/dashboard', label: 'Dashboard', icon: ShieldCheck, roles: ['admin'] },
    { href: '/super_hr/dashboard', label: 'Dashboard', icon: UserCog, roles: ['super_hr'] },
    { href: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['hr_manager'] },
    { href: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['recruiter'] },
    { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['manager', 'team_lead'] },
    { href: '/employee/dashboard', label: 'Home', icon: LayoutDashboard, roles: ['employee', 'intern', 'finance', 'it_admin', 'support', 'auditor', 'interviewer'] },
    
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

    // Company Wide
    { href: '/leaves', label: 'Leave System', icon: Clock, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead', 'employee', 'intern'] },
    { href: '/expenses', label: 'Expenses', icon: WalletCards, roles: ['employee', 'manager', 'team_lead', 'hr_manager', 'super_hr', 'admin', 'finance'] },
    { href: '/company-feed', label: 'Company Feed', icon: Newspaper, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead', 'employee', 'intern'] },
    { href: '/performance', label: 'Performance', icon: BarChart3, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'employee'] },
    { href: '/performance/okrs', label: 'OKRs', icon: Target, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'employee'] },
    { href: '/employee/directory', label: 'Directory', icon: Users, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead', 'employee', 'intern', 'finance', 'it_admin', 'support', 'auditor', 'interviewer'] },
    { href: '/employee/documents', label: 'Documents', icon: FileText, roles: ['admin', 'super_hr', 'hr_manager', 'employee', 'intern'] },
    { href: '/employee/payslips', label: 'Payslips', icon: WalletCards, roles: ['hr_manager', 'super_hr', 'employee'] },
    { href: '/employee/kudos', label: 'Kudos', icon: Award, roles: ['super_hr', 'hr_manager', 'manager', 'team_lead', 'employee', 'intern'] },
    { href: '/helpdesk', label: 'Helpdesk', icon: LifeBuoy, roles: ['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead', 'employee', 'intern', 'support', 'it_admin', 'finance'] },

    // AI Tools
    { href: '/ai-tools/applicant-scoring', label: 'AI Applicant Scoring', icon: Sparkles, roles: ['hr_manager', 'recruiter', 'super_hr'] },
    { href: '/ai-tools/review-analyzer', label: 'AI Review Analyzer', icon: Sparkles, roles: ['hr_manager', 'super_hr', 'manager'] },
    { href: '/ai-tools/chatbot', label: 'AI HR Chatbot', icon: Bot, roles: ['employee', 'intern'] },

  ];

  return allLinks.filter(link => link.roles.includes(role));
};


export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserProfile;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    // Exact match for the path
    if (path === pathname) return true;
    // Handle nested routes: if the path is a parent of the current pathname
    if (path !== '/' && pathname.startsWith(path + '/')) return true;
    return false;
  }
  
  const role = user?.role || 'guest';
  const navLinks = getNavLinks(role);

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
                    <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || ''} />
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
                {(role === 'admin' || role === 'super_hr') && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin/roles"><Settings className="mr-2"/>Manage Roles</Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
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
