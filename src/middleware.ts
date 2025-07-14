import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import type { UserRole } from './lib/types';

const publicRoutes = ['/login', '/signup', '/auth/callback', '/register', '/403'];

// This should now be a flat list of all possible application routes
const allAppRoutes = [
    '/admin/dashboard', '/admin/roles',
    '/super_hr/dashboard',
    '/hr/dashboard', '/hr/applicants', '/hr/campus', '/hr/onboarding',
    '/recruiter/dashboard', '/recruiter/jobs',
    '/manager/dashboard',
    '/team-lead/dashboard',
    '/employee/dashboard', '/employee/directory', '/employee/documents', '/employee/payslips', '/employee/kudos',
    '/intern/dashboard',
    '/leaves',
    '/company-feed',
    '/performance',
    '/ai-tools/applicant-scoring', '/ai-tools/review-analyzer', '/ai-tools/chatbot',
];

const roleAccess: Record<UserRole, string[]> = {
  admin: ['/admin', '/(app)'], // Simplified for now
  super_hr: ['/super_hr', '/hr', '/recruiter', '/manager', '/employee', '/intern', '/ai-tools', '/leaves', '/company-feed', '/performance', '/employee/documents', '/admin/roles', '/employee/kudos'],
  hr_manager: ['/hr', '/recruiter', '/manager', '/employee', '/intern', '/ai-tools', '/leaves', '/company-feed', '/performance', '/employee/documents', '/employee/kudos'],
  recruiter: ['/recruiter', '/hr/applicants', '/recruiter/jobs', '/ai-tools/applicant-scoring', '/hr/campus'],
  interviewer: [], // To be defined
  manager: ['/manager', '/employee', '/leaves', '/company-feed', '/performance', '/employee/directory', '/team-lead', '/employee/kudos'],
  team_lead: ['/team-lead', '/manager', '/employee', '/leaves', '/company-feed', '/performance', '/employee/directory', '/employee/kudos'],
  employee: ['/employee', '/leaves', '/company-feed', '/kudos', '/employee/documents', '/employee/payslips', '/employee/directory', '/ai-tools/chatbot'],
  intern: ['/intern', '/leaves', '/employee/documents', '/kudos', '/ai-tools/chatbot'],
  guest: [],
  finance: [],
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
    case 'manager': return '/manager/dashboard';
    case 'team_lead': return '/team-lead/dashboard';
    case 'employee': return '/employee/dashboard';
    case 'intern': return '/intern/dashboard';
    default: return '/login';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude portal routes from auth checks
  if (pathname.startsWith('/portal/')) {
      return NextResponse.next();
  }

  const { response, user } = await updateSession(request);
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user) {
    const role = user.role;

    if (pathname === '/') {
       return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
    }

    const isAuthRoute = pathname === '/login' || pathname === '/signup';
    if (isAuthRoute) {
        return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
    }
    
    if (!isPublic) {
      const allowedPaths = roleAccess[role] || [];
      // A simple check to see if the user's role grants them access.
      const isAuthorized = allowedPaths.some(path => pathname.startsWith(path));
      
      if (!isAuthorized && role !== 'admin') { // Let admin access everything for now
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
