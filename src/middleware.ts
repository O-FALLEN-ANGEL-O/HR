
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
  '/auth/update-password',
];

const firstLoginRoute = '/complete-profile';

function getHomePathForRole(role: UserRole): string {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'super_hr': return '/super_hr/dashboard';
    case 'hr_manager': return '/hr/dashboard';
    case 'recruiter': return '/recruiter/dashboard';
    case 'interviewer': return '/interviewer/tasks';
    case 'manager': return '/manager/dashboard';
    case 'team_lead': return '/team-lead/dashboard';
    case 'employee': return '/employee/dashboard';
    case 'intern': return '/intern/dashboard';
    default: return '/login';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicRoutes.some(route => pathname.startsWith(route));
  const isFirstLogin = pathname.startsWith(firstLoginRoute);

  const { response, user } = await updateSession(request);

  // If no user is logged in
  if (!user) {
    // Allow access to public routes, otherwise redirect to login
    if (isPublic) {
      return response;
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is logged in
  if (user) {
    // Check if user has completed their profile setup
    if (!user.profile_setup_complete && !isFirstLogin) {
      // If setup is not complete and they are not on the setup page, redirect them.
      return NextResponse.redirect(new URL(firstLoginRoute, request.url));
    }

    if (user.profile_setup_complete && isFirstLogin) {
      // If they have completed setup and try to access the setup page, redirect to their dashboard.
       return NextResponse.redirect(new URL(getHomePathForRole(user.role), request.url));
    }
    
    // Redirect from root to the correct dashboard
    if (pathname === '/') {
       return NextResponse.redirect(new URL(getHomePathForRole(user.role), request.url));
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
