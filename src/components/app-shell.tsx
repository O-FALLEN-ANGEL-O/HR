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
  Calendar,
  ClipboardCheck,
  Clock,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
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
  CalendarDays,
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
    { href: '/applicants', label: 'Applicants', icon: Users },
    { href: '/jobs', label: 'Job Postings', icon: Briefcase },
    { href: '/interviews', label: 'Interviews', icon: Calendar },
    { href: '/college-drive', label: 'College Drives', icon: GraduationCap },
    { href: '/onboarding', label: 'Onboarding', icon: ClipboardCheck },
    { href: '/performance', label: 'Performance', icon: BarChart3 },
    { href: '/ai-tools/applicant-scoring', label: 'Applicant Scoring', icon: ScanSearch, group: 'AI Tools' },
    { href: '/ai-tools/chatbot', label: 'AI Chatbot', icon: Bot, group: 'AI Tools' },
    { href: '/ai-tools/review-analyzer', label: 'Review Analyzer', icon: PenSquare, group: 'AI Tools' },
  ];

  switch (role) {
    case 'admin':
      return [
        { href: '/admin/dashboard', label: 'Admin Dashboard', icon: ShieldCheck },
        { href: '/admin/roles', label: 'Role Management', icon: UserCheck },
        { href: '/hr/dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
        ...commonHrLinks,
      ];
    case 'super_hr':
        return [
            { href: '/super_hr/dashboard', label: 'Super HR Dashboard', icon: UserCog },
            { href: '/hr/dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
            ...commonHrLinks,
        ];
    case 'hr_manager':
      return [
        { href: '/hr/dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
        ...commonHrLinks,
      ];
    case 'manager':
      return [
        { href: '/manager/dashboard', label: 'Manager Dashboard', icon: LayoutDashboard },
        { href: '/time-off', label: 'Team Time Off', icon: Clock },
        { href: '/performance', label: 'Team Performance', icon: BarChart3 },
        { href: '/employee/directory', label: 'Employee Directory', icon: Users },
      ];
    case 'team_lead':
      return [
        { href: '/team-lead/dashboard', label: 'Team Lead Hub', icon: LayoutDashboard },
        { href: '/employee/directory', label: 'Team Directory', icon: Users },
        { href: '/employee/kudos', label: 'Team Kudos', icon: Award },
      ];
    case 'recruiter':
      return [
        { href: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/applicants', label: 'Applicants', icon: Users },
        { href: '/jobs', label: 'Job Postings', icon: Briefcase },
        { href: '/ai-tools/applicant-scoring', label: 'Applicant Scoring', icon: ScanSearch },
      ];
    case 'interviewer':
      return [
        { href: '/interviews', label: 'My Interviews', icon: Calendar },
      ];
    case 'employee':
      return [
        { href: '/employee/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { href: '/employee/directory', label: 'Directory', icon: Users },
        { href: '/employee/payslips', label: 'Payslips', icon: WalletCards },
        { href: '/time-off', label: 'Time Off', icon: Clock },
        { href: '/employee/kudos', label: 'Kudos', icon: Award },
        { href: '/employee/documents', label: 'Policies', icon: FolderKanban },
      ];
    case 'intern':
        return [
          { href: '/intern/dashboard', label: 'Welcome', icon: LayoutDashboard },
          { href: '/onboarding', label: 'Onboarding Tasks', icon: ClipboardCheck },
        ]
    default:
      return [];
  }
};

const AiToolsSubMenu = ({ isActive, isSubActive }: { isActive: (p: string) => boolean, isSubActive: (p: string[]) => boolean }) => (
    <SidebarMenuSub>
        <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild isActive={isActive('/ai-tools/applicant-scoring')}>
            <Link href="/ai-tools/applicant-scoring"><ScanSearch />Applicant Scoring</Link>
        </SidebarMenuSubButton>
        </SidebarMenuSubItem>
        <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild isActive={isActive('/ai-tools/chatbot')}>
            <Link href="/ai-tools/chatbot"><Bot />AI Chatbot</Link>
        </SidebarMenuSubButton>
        </SidebarMenuSubItem>
        <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild isActive={isActive('/ai-tools/review-analyzer')}>
            <Link href="/ai-tools/review-analyzer"><PenSquare />Review Analyzer</Link>
        </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    </SidebarMenuSub>
)

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
  const navLinks = getNavLinks(role);
  const aiToolsInNav = navLinks.some(link => link.group === 'AI Tools');

  React.useEffect(() => {
    if (isSubActive(['/ai-tools'])) {
        setOpenAiSubMenu(true);
    }
  }, [pathname, isSubActive])

  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="h-14 flex-row items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 w-7 fill-primary">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
            </svg>
            <span className="text-xl font-semibold text-foreground group-data-[collapsible=icon]:hidden">HR+</span>
          </Link>
          <SidebarClose />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navLinks.filter(link => !link.group).map(link => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton asChild isActive={isActive(link.href)}>
                  <Link href={link.href}><link.icon />{link.label}</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {aiToolsInNav && (
                <SidebarMenuItem>
                    <Button variant="ghost" className="w-full justify-start gap-2 p-2" onClick={() => setOpenAiSubMenu(!openAiSubMenu)} aria-expanded={openAiSubMenu} data-active={isSubActive(['/ai-tools'])}>
                        <Sparkles />AI Tools
                    </Button>
                    {openAiSubMenu && <AiToolsSubMenu isActive={isActive} isSubActive={isSubActive} />}
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
