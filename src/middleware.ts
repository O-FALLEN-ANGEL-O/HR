import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Define public and authentication routes
const publicRoutes = ['/login', '/signup', '/auth/callback', '/register', '/aptitude-test', '/comprehensive-test', '/customer-service-test', '/english-grammar-test', '/typing-test'];
const authRoutes = ['/login', '/signup'];
const adminRoutes = ['/admin'];
const hrRoutes = ['/applicants', '/jobs', '/interviews', '/college-drive', '/onboarding', '/performance'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update user's session and get user, response, and supabase client
  const { response, user, supabase } = await updateSession(request);

  // If user is logged in and tries to access an auth route, redirect to dashboard
  if (user && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/portal');

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    // Fetch user role from public.users table
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = userProfile?.role;

    // Admin route protection
    if (adminRoutes.some(route => pathname.startsWith(route)) && role !== 'admin') {
        return NextResponse.redirect(new URL('/403', request.url));
    }

    // HR route protection
    const isHrRoute = hrRoutes.some(route => pathname.startsWith(route));
    const allowedHrRoles = ['admin', 'super_hr', 'hr_manager', 'recruiter'];
    if (isHrRoute && (!role || !allowedHrRoles.includes(role))) {
       return NextResponse.redirect(new URL('/403', request.url));
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
