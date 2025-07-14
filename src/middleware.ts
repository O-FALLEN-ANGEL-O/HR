import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import type { UserRole } from './lib/types';

// Centralized list of all public-facing routes
const publicRoutes = [
  '/login', 
  '/signup', 
  '/auth/callback', 
  '/register', 
  '/403',
  '/portal', // Portal root for applicants
  '/typing-test',
  '/aptitude-test',
  '/comprehensive-test',
  '/english-grammar-test',
  '/customer-service-test'
];

const roleAccess: Record<UserRole, string[]> = {
  admin: ['/'], // Admin can access everything
  super_hr: ['/super_hr', '/hr', '/recruiter', '/interviewer', '/manager', '/employee', '/intern', '/ai-tools', '/leaves', '/company-feed', '/performance', '/expenses', '/admin/roles'],
  hr_manager: ['/hr', '/recruiter', '/interviewer', '/manager', '/employee', '/intern', '/ai-tools', '/leaves', '/company-feed', '/performance', '/expenses'],
  recruiter: ['/recruiter', '/hr/applicants', '/recruiter/jobs', '/interviewer', '/ai-tools/applicant-scoring', '/hr/campus'],
  interviewer: ['/interviewer', '/hr/applicants'],
  manager: ['/manager', '/employee', '/leaves', '/company-feed', '/performance', '/employee/directory', '/team-lead', '/employee/kudos', '/expenses', '/interviewer'],
  team_lead: ['/team-lead', '/manager', '/employee', '/leaves', '/company-feed', '/performance', '/employee/directory', '/employee/kudos', '/expenses'],
  employee: ['/employee', '/leaves', '/company-feed', '/kudos', '/employee/documents', '/employee/payslips', '/employee/directory', '/ai-tools/chatbot', '/performance', '/expenses'],
  intern: ['/intern', '/leaves', '/employee/documents', '/kudos', '/ai-tools/chatbot'],
  guest: [],
  finance: ['/expenses'],
  it_admin: [],
  support: [],
  auditor: [],
};

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

  // Check if the current route is public
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  const { response, user } = await updateSession(request);

  if (!user && !isPublic) {
    // No user and not a public route, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user) {
    const role = user.role;
    
    // If user is on the root path, redirect to their designated dashboard
    if (pathname === '/') {
       return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
    }

    // If user is logged in, prevent access to login/signup pages
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
    if (isAuthRoute) {
        return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
    }
    
    // For non-public routes, check role-based access
    if (!isPublic) {
      if (role === 'admin') {
        // Admin has access to everything, proceed
        return response;
      }
      
      const allowedPaths = roleAccess[role] || [];
      const isAuthorized = allowedPaths.some(path => pathname.startsWith(path));
      
      if (!isAuthorized) {
        // If not authorized, redirect to the forbidden page
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }
  }

  // For all other cases, continue with the request
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
