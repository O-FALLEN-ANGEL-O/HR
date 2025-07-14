import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import type { UserRole } from './lib/types';

// Define public and authentication routes
const publicRoutes = ['/login', '/signup', '/auth/callback', '/register', '/aptitude-test', '/comprehensive-test', '/customer-service-test', '/english-grammar-test', '/typing-test', '/403'];
const authRoutes = ['/login', '/signup'];

// Role-based access control matrix
const roleAccess: Record<UserRole, string[]> = {
  admin: ['/admin', '/hr', '/super_hr', '/recruiter', '/applicants', '/jobs', '/interviews', '/college-drive', '/onboarding', '/ai-tools', '/employee', '/intern', '/leaves', '/company-feed', '/performance', '/manager', '/team-lead'],
  super_hr: ['/super_hr', '/hr', '/applicants', '/jobs', '/interviews', '/college-drive', '/onboarding', '/ai-tools', '/employee', '/intern', '/leaves', '/admin/roles', '/company-feed', '/performance'],
  hr_manager: ['/hr', '/applicants', '/jobs', '/interviews', '/college-drive', '/onboarding', '/ai-tools', '/employee', '/intern', '/leaves', '/company-feed', '/performance'],
  manager: ['/manager', '/employee', '/leaves', '/company-feed', '/performance'],
  team_lead: ['/team-lead', '/employee', '/leaves', '/company-feed'],
  recruiter: ['/recruiter', '/hr/dashboard', '/applicants', '/jobs', '/ai-tools/applicant-scoring', '/company-feed'],
  interviewer: ['/interviews'],
  employee: ['/employee', '/leaves', '/company-feed', '/kudos', '/employee/documents', '/employee/payslips'],
  intern: ['/intern', '/onboarding', '/company-feed', '/leaves'],
  guest: [],
};

function getHomePathForRole(role: UserRole): string {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'super_hr': return '/super_hr/dashboard';
    case 'hr_manager': return '/hr/dashboard';
    case 'manager': return '/manager/dashboard';
    case 'team_lead': return '/team-lead/dashboard';
    case 'recruiter': return '/recruiter/dashboard';
    case 'interviewer': return '/interviews';
    case 'employee': return '/employee/dashboard';
    case 'intern': return '/intern/dashboard';
    default: return '/login';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // This function now returns the full user profile, including the role.
  const { response, user } = await updateSession(request);

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/portal');

  // If the user is not logged in and the route is not public, redirect to login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If the user is logged in
  if (user) {
    const role = user.role;

    // If a logged-in user lands on the root path, redirect them to their dashboard
    if (pathname === '/') {
       return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
    }

    // And tries to access an auth route, redirect to their home
    if (authRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
    }
    
    // Check role-based access for protected routes
    if (!isPublicRoute) {
      const allowedPaths = roleAccess[role] || [];
      const isAuthorized = allowedPaths.some(path => pathname.startsWith(path));
      
      if (!isAuthorized) {
        return NextResponse.redirect(new URL('/403', request.url));
      }
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
