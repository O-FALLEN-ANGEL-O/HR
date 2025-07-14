import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// This page exists to catch the root URL and redirect.
// The primary redirect logic is now in the middleware and callback.
export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If a session exists, the middleware will handle the redirect.
  // If not, redirect to login.
  if (!session) {
    redirect('/login');
  } else {
    // If somehow a user with a session lands here, the middleware should have already
    // redirected them. As a fallback, we can redirect to a generic dashboard or login.
    redirect('/employee/dashboard'); // Fallback redirect
  }
}
