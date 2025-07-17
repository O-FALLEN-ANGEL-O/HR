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
  const { pathname } = request.nextUrl;

  const { response, user, supabase } = await updateSession(request);

  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  // If no user is logged in
  if (!user) {
    // If user tries to access /auth/update-password without a session, send to login
    if (pathname === '/auth/update-password') {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    // Allow access to other public routes, otherwise redirect to login
    if (isPublic) {
      return response;
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is logged in
  if (user) {
    // Handle first-time login via magic link to force password update
    const { data: { session } } = await supabase.auth.getSession();
    const isFirstMagicLinkLogin = session?.user?.sign_in_count === 1 && session.user.app_metadata.provider === 'email';
    
    if (isFirstMagicLinkLogin && pathname !== '/auth/update-password') {
      return NextResponse.redirect(new URL('/auth/update-password', request.url));
    }
    
    // If not first login, but profile is not complete, redirect to onboarding
    if (!user.profile_setup_complete && !isFirstMagicLinkLogin) {
      if (pathname !== '/onboarding') {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }

    // If onboarding is complete, prevent access to onboarding and update password pages
    if (user.profile_setup_complete && (pathname === '/onboarding' || pathname === '/auth/update-password')) {
      return NextResponse.redirect(new URL(getHomePathForRole(user.role), request.url));
    }

    // Redirect from root or login to the correct dashboard if profile is complete
    if ((pathname === '/' || pathname === '/login') && user.profile_setup_complete) {
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
