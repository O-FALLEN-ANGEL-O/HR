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
  Bot,
  Briefcase,
  Calendar,
  ClipboardCheck,
  Clock,
  LayoutDashboard,
  PenSquare,
  ScanSearch,
  Sparkles,
  Users,
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
} from '@/components/ui/sidebar';
import { currentUser } from '@/lib/data';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isSubActive = (paths: string[]) => {
    return paths.some(path => pathname.startsWith(path));
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="h-14 justify-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-7 w-7 fill-primary"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
            </svg>
            <span className="text-xl font-semibold text-foreground">HR+</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/dashboard')}>
                <Link href="/dashboard">
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/applicants')}>
                <Link href="/applicants">
                  <Users />
                  Applicants
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/jobs')}>
                <Link href="/jobs">
                  <Briefcase />
                  Job Postings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/interviews')}>
                <Link href="/interviews">
                  <Calendar />
                  Interviews
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/onboarding')}>
                <Link href="/onboarding">
                  <ClipboardCheck />
                  Onboarding
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/performance')}>
                <Link href="/performance">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  Performance
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/time-off')}>
                <Link href="/time-off">
                  <Clock />
                  Time & Attendance
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 p-2"
                  onClick={() => setOpen(!open)}
                  aria-expanded={open}
                  data-active={isSubActive(['/ai-tools'])}
                >
                  <Sparkles/>
                  AI Tools
                </Button>
                {open && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive('/ai-tools/applicant-scoring')}>
                        <Link href="/ai-tools/applicant-scoring">
                          <ScanSearch/>
                          Applicant Scoring
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive('/ai-tools/chatbot')}>
                        <Link href="/ai-tools/chatbot">
                          <Bot/>
                          AI Chatbot
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                       <SidebarMenuSubButton asChild isActive={isActive('/ai-tools/review-analyzer')}>
                        <Link href="/ai-tools/review-analyzer">
                          <PenSquare/>
                          Review Analyzer
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="flex-col items-center gap-4">
           <div className="flex w-full items-center justify-between border-t p-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-sm">
                <span className="font-semibold">{currentUser.name}</span>
                <span className="text-muted-foreground">{currentUser.role}</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
