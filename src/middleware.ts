
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

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
      '/auth/callback',
  ];

  if (publicPaths.some(path => pathname.startsWith(path))) {
      return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  
  // After login, check for onboarding
  const { data: profile } = await supabase
    .from('users')
    .select('profile_setup_complete')
    .eq('id', user.id)
    .single();

  if (profile && !profile.profile_setup_complete && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }
  if (profile?.profile_setup_complete && pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/', request.url));
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
