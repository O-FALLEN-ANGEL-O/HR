
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getUser } from '@/lib/supabase/user';
import type { UserRole } from './lib/types';
import { NextResponse } from 'next/server';

const protectedRoutes: {path: string, roles: UserRole[]}[] = [
    { path: '/admin', roles: ['admin', 'super_hr'] },
    { path: '/hr', roles: ['admin', 'super_hr', 'hr_manager', 'recruiter'] },
    { path: '/recruiter', roles: ['admin', 'super_hr', 'hr_manager', 'recruiter'] },
    { path: '/interviewer', roles: ['admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer'] },
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Public paths that do not require authentication or role checks
    const publicPaths = [
        '/login', 
        '/register', 
        '/update-password',
        '/typing-test',
        '/aptitude-test',
        '/comprehensive-test',
        '/english-grammar-test',
        '/customer-service-test',
        '/portal',
        '/start-test',
    ];

    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }
    
    // For demo purposes, we will use a cookie to simulate user login.
    // In a real app, `updateSession` would handle Supabase auth.
    const user = await getUser(request.cookies);

    if (!user) {
      // If no user is found, redirect to the login page.
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    
    // Redirect to onboarding if profile is not complete
    if (!user.profile_setup_complete && pathname !== '/onboarding') {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
    }
    
    // If profile is complete but they are on onboarding page, redirect to home
    if (user.profile_setup_complete && pathname === '/onboarding') {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // Check for role-based access to protected route groups
    const protectedRoute = protectedRoutes.find(r => pathname.startsWith(r.path));
    if (protectedRoute && !protectedRoute.roles.includes(user.role)) {
        return NextResponse.redirect(new URL('/403', request.url));
    }
    
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
