
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

  const { response, user, supabase } = await updateSession(request);

  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

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
    // Check if user has set a password. The sign_in_count is 1 for the first magic link login.
    const { data: { session } } = await supabase.auth.getSession();
    const isFirstLogin = session?.user?.sign_in_count === 1 && session.user.app_metadata.provider === 'email';
    
    if (isFirstLogin && pathname !== '/auth/update-password') {
      return NextResponse.redirect(new URL('/auth/update-password', request.url));
    }
    
    // Check if profile setup is complete
    if (!user.profile_setup_complete && !isFirstLogin) {
      if (pathname !== '/onboarding') {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }

    // If onboarding is complete, prevent access to onboarding page
    if (user.profile_setup_complete && pathname === '/onboarding') {
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
