
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
  '/update-password', // Added to public routes
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

  if (!user) {
    // If not logged in and not on a public route, redirect to login
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Allow access to public routes
    return response;
  }

  // User is logged in
  // Onboarding check
  if (!user.profile_setup_complete) {
    if (pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  } else { // Profile is complete
    // If user is on a public route (like /login) or the root, redirect them to their dashboard
    if (isPublicRoute || pathname === '/') {
        const homePath = getHomePathForRole(user.role);
        return NextResponse.redirect(new URL(homePath, request.url));
    }
  }

  // If user is logged in and trying to access any other route, let them proceed
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
