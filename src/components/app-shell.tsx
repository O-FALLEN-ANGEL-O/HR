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
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarClose,
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
  const commonHrLinks = [
    { href: '/hr/applicants', label: 'Applicants', icon: Users, roles: ['super_hr', 'hr_manager', 'recruiter', 'admin'] },
    { href: '/recruiter/jobs', label: 'Job Postings', icon: Briefcase, roles: ['hr_manager', 'recruiter', 'admin', 'super_hr'] },
    { href: '/interviewer/tasks', label: 'Interviews', icon: Calendar, roles: ['interviewer', 'hr_manager', 'admin', 'super_hr'] },
    { href: '/hr/onboarding', label: 'Onboarding', icon: ClipboardCheck, roles: ['super_hr', 'hr_manager', 'admin', 'intern'] },
    { href: '/leaves', label: 'Leave Mgt.', icon: Clock, roles: ['admin', 'super_hr', 'hr_manager', 'employee', 'intern', 'manager', 'team_lead'] },
    { href: '/hr/campus', label: 'College Drives', icon: GraduationCap, roles: ['hr_manager', 'super_hr', 'admin'] },
  ];

  const employeeLinks = [
     { href: '/company-feed', label: 'Company Feed', icon: Newspaper, roles: ['employee', 'intern', 'hr_manager', 'super_hr', 'admin', 'recruiter', 'manager', 'team_lead'] },
     { href: '/employee/directory', label: 'Directory', icon: Users, roles: ['employee', 'hr_manager', 'super_hr', 'admin', 'manager', 'team_lead'] },
     { href: '/employee/payslips', label: 'Payslips', icon: WalletCards, roles: ['employee'] },
     { href: '/employee/kudos', label: 'Kudos', icon: Award, roles: ['employee', 'intern', 'hr_manager'] },
     { href: '/employee/documents', label: 'Documents', icon: FolderKanban, roles: ['admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'employee', 'intern', 'manager', 'team_lead'] },
  ];
  
  const aiTools = {
    group: 'AI Tools',
    links: [
        { href: '/ai-tools/applicant-scoring', label: 'Applicant Scoring', icon: ScanSearch, roles: ['hr_manager', 'recruiter', 'admin', 'super_hr'] },
        { href: '/ai-tools/review-analyzer', label: 'Review Analyzer', icon: PenSquare, roles: ['super_hr', 'hr_manager', 'admin'] },
        { href: '/ai-tools/chatbot', label: 'AI Chatbot', icon: Bot, roles: ['employee', 'intern', 'hr_manager', 'admin', 'super_hr'] },
    ]
  };

  const allLinks = [
    // Dashboards
    { href: '/admin/dashboard', label: 'Admin Dashboard', icon: ShieldCheck, roles: ['admin'] },
    { href: '/super_hr/dashboard', label: 'Super HR Dashboard', icon: UserCog, roles: ['super_hr'] },
    { href: '/hr/dashboard', label: 'HR Dashboard', icon: LayoutDashboard, roles: ['hr_manager', 'admin', 'super_hr'] },
    { href: '/recruiter/dashboard', label: 'Recruiter Dashboard', icon: LayoutDashboard, roles: ['recruiter'] },
    { href: '/manager/dashboard', label: 'Manager Dashboard', icon: LayoutDashboard, roles: ['manager'] },
    { href: '/team-lead/dashboard', label: 'Team Lead Dashboard', icon: LayoutDashboard, roles: ['team_lead'] },
    { href: '/employee/dashboard', label: 'My Dashboard', icon: LayoutDashboard, roles: ['employee', 'intern'] },
    { href: '/interviewer/tasks', label: 'Interviewer Tasks', icon: UserCheck, roles: ['interviewer']},

    // Other Links
    ...commonHrLinks,
    ...employeeLinks,
    
    // Admin specific
    { href: '/admin/roles', label: 'Role Management', icon: Settings, roles: ['admin', 'super_hr'] },
  ];

  const filteredLinks = allLinks.filter(link => link.roles.includes(role));
  const filteredAiTools = {
      ...aiTools,
      links: aiTools.links.filter(link => link.roles.includes(role))
  };

  return { navLinks: filteredLinks, aiTools: filteredAiTools };
};


export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserProfile | null;
}) {
  const pathname = usePathname();
  const [openAiSubMenu, setOpenAiSubMenu] = React.useState(false);

  const isActive = (path: string) => pathname === path;
  const isSubActive = (paths: string[]) => paths.some((path) => pathname.startsWith(path));

  const role = user?.role || 'guest';
  const { navLinks, aiTools } = getNavLinks(role);

  React.useEffect(() => {
    if (isSubActive(['/ai-tools'])) {
        setOpenAiSubMenu(true);
    }
  }, [pathname, isSubActive])

  const AiToolsSubMenu = () => (
    <SidebarMenuSub>
        {aiTools.links.map(link => (
            <SidebarMenuSubItem key={link.href}>
                <SidebarMenuSubButton asChild isActive={isActive(link.href)}>
                    <Link href={link.href}><link.icon />{link.label}</Link>
                </SidebarMenuSubButton>
            </SidebarMenuSubItem>
        ))}
    </SidebarMenuSub>
  );

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
            {aiTools.links.length > 0 && (
                <SidebarMenuItem>
                    <Button variant="ghost" className="w-full justify-start gap-2 p-2" onClick={() => setOpenAiSubMenu(!openAiSubMenu)} aria-expanded={openAiSubMenu} data-active={isSubActive(['/ai-tools'])}>
                        <Sparkles />AI Tools
                    </Button>
                    {openAiSubMenu && <AiToolsSubMenu />}
                </SidebarMenuItem>
            )}
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
                {role === 'admin' && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin/roles"><Settings className="mr-2"/>Admin Settings</Link>
                    </DropdownMenuItem>
                )}
                 {role === 'super_hr' && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin/roles"><UserCog className="mr-2"/>Assign Roles</Link>
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
