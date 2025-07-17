
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import type { UserRole } from './lib/types';

const publicRoutes = [
  '/login',
  '/signup',
  '/auth/callback',
  '/register',
  '/403',
  '/portal',
  '/typing-test',
  '/aptitude-test',
  '/comprehensive-test',
  '/english-grammar-test',
  '/customer-service-test',
  '/start-test',
  '/update-password',
];

function getHomePathForRole(role: UserRole): string {
    const dashboardMap: Partial<Record<UserRole, string>> = {
        admin: '/admin/dashboard',
        super_hr: '/super_hr/dashboard',
        hr_manager: '/hr/dashboard',
        recruiter: '/recruiter/dashboard',
        manager: '/manager/dashboard',
        team_lead: '/team-lead/dashboard',
        intern: '/intern/dashboard',
    };
    // Default to employee dashboard for all other roles
    return dashboardMap[role] || '/employee/dashboard';
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If user is not logged in
  if (!user) {
    if (!isPublicRoute) {
      // And is trying to access a protected route, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Otherwise, allow access to public routes
    return response;
  }

  // User is logged in
  const homePath = getHomePathForRole(user.role);

  // Onboarding check
  if (!user.profile_setup_complete) {
    // If onboarding is not complete, redirect to /onboarding, unless they are already there.
    if (pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return response;
  }
  
  // If user is fully onboarded and tries to access a public route or the root
  if (pathname === '/' || isPublicRoute) {
    // send them to their dashboard
    return NextResponse.redirect(new URL(homePath, request.url));
  }

  // Allow access to all other protected routes
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.svg (favicon file)
     * - anything with a file extension
     */
    '/((?!_next/static|_next/image|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
