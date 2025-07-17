import AppShell from '@/components/app-shell';
import { getUser } from '@/lib/supabase/user';
import { cookies } from 'next/headers';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const user = await getUser(cookieStore);
  
  if (!user) {
    // This case should be handled by middleware, but as a fallback
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return <AppShell user={user}>{children}</AppShell>;
}
