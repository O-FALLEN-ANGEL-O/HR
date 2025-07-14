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
  Calendar,
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
    { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['manager'] },
    { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['employee', 'intern'] },
    
    // Admin
    { href: '/admin/roles', label: 'Users & Roles', icon: Users, roles: ['admin'] },
    { href: '/admin/settings', label: 'System Settings', icon: Settings, roles: ['admin'] },
    { href: '/admin/logs', label: 'RLS Logs', icon: FileText, roles: ['admin'] },
    { href: '/admin/templates', label: 'Templates', icon: FolderKanban, roles: ['admin'] },
    { href: '/admin/audit', label: 'Audit Trail', icon: ScanSearch, roles: ['admin'] },
    
    // Super HR
    { href: '/hr/applicants', label: 'Applicants', icon: Users, roles: ['super_hr'] },
    { href: '/leaves', label: 'Leave System', icon: Clock, roles: ['super_hr', 'hr_manager', 'manager', 'employee', 'intern'] },
    { href: '/employee/documents', label: 'Docs & Reports', icon: FileText, roles: ['super_hr', 'hr_manager', 'employee', 'intern'] },
    { href: '/ai-tools/review-analyzer', label: 'Performance AI', icon: Sparkles, roles: ['super_hr'] },

    // HR Manager
    { href: '/recruiter/jobs', label: 'Job Postings', icon: Briefcase, roles: ['hr_manager', 'recruiter'] },
    { href: '/hr/campus', label: 'Campus', icon: GraduationCap, roles: ['hr_manager', 'recruiter'] },
    { href: '/interviewer/tasks', label: 'Interviews', icon: Calendar, roles: ['hr_manager', 'interviewer'] },
    { href: '/hr/onboarding', label: 'Onboarding', icon: ClipboardCheck, roles: ['hr_manager'] },
    { href: '/employee/payslips', label: 'Payslips', icon: WalletCards, roles: ['hr_manager', 'employee'] },
    { href: '/admin/policies', label: 'Policies', icon: ShieldCheck, roles: ['hr_manager'] },

    // Employee
    { href: '/employee/kudos', label: 'Kudos', icon: Award, roles: ['employee', 'intern', 'hr_manager'] },
    { href: '/employee/directory', label: 'Directory', icon: Users, roles: ['employee', 'hr_manager'] },
    { href: '/employee/grievances', label: 'Grievances', icon: PenSquare, roles: ['employee'] },

  ];

  return allLinks.filter(link => link.roles.includes(role));
};


export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserProfile | null;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;
  
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
                <SidebarMenuButton asChild isActive={isActive(link.href)}>
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
                {(role === 'admin' || role === 'super_hr') && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin/roles"><Settings className="mr-2"/>Manage Roles</Link>
                    </DropdownMenuItem>
                )}
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
