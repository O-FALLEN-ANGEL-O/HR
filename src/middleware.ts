import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import type { UserRole } from './lib/types';

// Define public and authentication routes
const publicRoutes = ['/login', '/signup', '/auth/callback', '/register', '/aptitude-test', '/comprehensive-test', '/customer-service-test', '/english-grammar-test', '/typing-test'];
const authRoutes = ['/login', '/signup'];

// Role-based access control matrix
const roleAccess: Record<UserRole, string[]> = {
  admin: ['/admin', '/hr', '/applicants', '/jobs', '/interviews', '/college-drive', '/onboarding', '/performance', '/ai-tools', '/employee', '/intern', '/time-off'],
  super_hr: ['/hr', '/applicants', '/jobs', '/interviews', '/college-drive', '/onboarding', '/performance', '/ai-tools', '/employee', '/intern', '/time-off'],
  hr_manager: ['/hr', '/applicants', '/jobs', '/interviews', '/college-drive', '/onboarding', '/performance', '/ai-tools', '/employee', '/intern', '/time-off'],
  recruiter: ['/hr', '/applicants', '/jobs', '/interviews', '/college-drive', '/ai-tools/applicant-scoring'],
  interviewer: ['/interviews'],
  employee: ['/employee', '/time-off'],
  intern: ['/intern', '/onboarding'],
  guest: [],
};

function getHomePathForRole(role: UserRole): string {
  switch (role) {
    case 'admin': return '/admin/roles';
    case 'super_hr':
    case 'hr_manager':
    case 'recruiter': return '/hr/dashboard';
    case 'interviewer': return '/interviews';
    case 'employee': return '/employee/dashboard';
    case 'intern': return '/intern/dashboard';
    default: return '/login';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const { response, user, supabase } = await updateSession(request);

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/portal');

  // If the user is not logged in and the route is not public, redirect to login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If the user is logged in
  if (user) {
    // And tries to access an auth route, redirect to their home
    if (authRoutes.includes(pathname)) {
        const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single();
        const role = userProfile?.role || 'guest';
        return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
    }
    
    // Check role-based access for protected routes
    if (!isPublicRoute) {
      const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single();
      const role = userProfile?.role || 'guest';
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
