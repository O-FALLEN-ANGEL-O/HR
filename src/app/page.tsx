
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// This page exists to catch the root URL and redirect.
// The primary redirect logic is now in the middleware.
export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If a session exists, the middleware will handle the redirect.
  // If not, redirect to login. This handles the case where a user
  // lands on the root URL without a session.
  if (!session) {
    redirect('/login');
  } else {
    // This part should theoretically not be reached if the middleware is working correctly,
    // but it serves as a reliable fallback. The middleware will catch this redirect
    // and send the user to their correct dashboard.
    redirect('/');
  }
}
