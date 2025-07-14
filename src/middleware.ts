import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import type { UserRole } from './lib/types';

const publicRoutes = ['/login', '/signup', '/auth/callback', '/register', '/aptitude-test', '/comprehensive-test', '/customer-service-test', '/english-grammar-test', '/typing-test', '/403'];
const authRoutes = ['/login', 'signup'];

// Role-based access control matrix based on the new plan
const roleAccess: Record<UserRole, string[]> = {
  admin: ['/admin', '/(app)'], // Full access
  super_hr: ['/super_hr', '/hr', '/recruiter', '/interviewer', '/manager', '/employee', '/intern', '/ai-tools', '/leaves', '/company-feed', '/performance', '/employee/documents', '/admin/roles', '/employee/kudos', '/expenses'],
  hr_manager: ['/hr', '/recruiter', '/interviewer', '/manager', '/employee', '/intern', '/ai-tools', '/leaves', '/company-feed', '/performance', '/employee/documents', '/employee/kudos', '/expenses'],
  recruiter: ['/recruiter', '/hr/applicants', '/recruiter/jobs', '/ai-tools/applicant-scoring', '/hr/campus', '/interviewer/tasks'],
  interviewer: ['/interviewer', '/interviewer/tasks'],
  manager: ['/manager', '/employee', '/leaves', '/company-feed', '/performance', '/employee/directory', '/team-lead', '/employee/kudos', '/expenses'],
  team_lead: ['/team-lead', '/manager', '/employee', '/leaves', '/company-feed', '/performance', '/employee/directory', '/employee/kudos', '/expenses'],
  employee: ['/employee', '/leaves', '/company-feed', '/kudos', '/employee/documents', '/employee/payslips', '/employee/directory', '/ai-tools/chatbot', '/performance/okrs', '/expenses'],
  intern: ['/intern', '/leaves', '/employee/documents', '/kudos', '/ai-tools/chatbot', '/performance/okrs', '/expenses'],
  guest: [], // Guests have no access to app routes, handled by publicRoutes
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
    case 'finance': return '/expenses';
    default: return '/login';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/portal');

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user) {
    const role = user.role;

    if (pathname === '/') {
       return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
    }

    if (authRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
    }
    
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
