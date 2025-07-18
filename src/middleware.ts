
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import type { UserRole } from './lib/types';

const roleDashboardPaths: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    super_hr: '/super_hr/dashboard',
    hr_manager: '/hr/dashboard',
    recruiter: '/recruiter/dashboard',
    manager: '/manager/dashboard',
    team_lead: '/team_lead/dashboard',
    employee: '/employee/dashboard',
    intern: '/intern/dashboard',
    interviewer: '/interviewer/tasks',
    finance: '/employee/dashboard',
    it_admin: '/employee/dashboard',
    support: '/helpdesk',
    auditor: '/employee/dashboard',
    guest: '/login',
};

const protectedRoutes: {path: string, roles: UserRole[]}[] = [
    { path: '/admin', roles: ['admin', 'super_hr'] },
    { path: '/hr', roles: ['admin', 'super_hr', 'hr_manager', 'recruiter'] },
    { path: '/recruiter', roles: ['admin', 'super_hr', 'hr_manager', 'recruiter'] },
    { path: '/interviewer', roles: ['admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer'] },
    // Add other protected route groups here
];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  
  const publicPaths = ['/login', '/register', '/update-password', '/portal', '/typing-test', '/aptitude-test', '/comprehensive-test', '/english-grammar-test', '/customer-service-test', '/start-test'];

  // If user is not logged in and trying to access a protected route, redirect to login
  if (!user && !publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is logged in
  if (user) {
    // If they are on a public-only page (like login), redirect them to their dashboard
    if (publicPaths.includes(pathname)) {
        return NextResponse.redirect(new URL(roleDashboardPaths[user.role] || '/', request.url));
    }
    
    // If user is on the root path, redirect to their specific dashboard
    if (pathname === '/') {
       return NextResponse.redirect(new URL(roleDashboardPaths[user.role], request.url));
    }

    // Check for role-based access to protected route groups
    const protectedRoute = protectedRoutes.find(r => pathname.startsWith(r.path));
    if (protectedRoute && !protectedRoute.roles.includes(user.role)) {
        return NextResponse.redirect(new URL('/403', request.url)); // Forbidden page
    }
  }

  return response;
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - anything with a file extension
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
