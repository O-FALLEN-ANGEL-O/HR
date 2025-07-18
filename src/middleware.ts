
import { type NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/user';
import type { UserRole } from './lib/types';

const protectedRoutes: {path: string, roles: UserRole[]}[] = [
    { path: '/admin', roles: ['admin', 'super_hr'] },
    { path: '/hr', roles: ['admin', 'super_hr', 'hr_manager', 'recruiter'] },
    { path: '/recruiter', roles: ['admin', 'super_hr', 'hr_manager', 'recruiter'] },
    { path: '/interviewer', roles: ['admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer'] },
];

export async function middleware(request: NextRequest) {
  // Always get user, as login is now bypassed. Defaults to admin.
  const user = await getUser(request.cookies);
  const { pathname } = request.nextUrl;
  
  // If for some reason there's no user, let them pass (shouldn't happen with new setup)
  if (!user) {
    return NextResponse.next();
  }

  // Check for role-based access to protected route groups
  const protectedRoute = protectedRoutes.find(r => pathname.startsWith(r.path));
  if (protectedRoute && !protectedRoute.roles.includes(user.role)) {
      return NextResponse.redirect(new URL('/403', request.url)); // Forbidden page
  }

  // Allow the request to proceed
  return NextResponse.next();
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
