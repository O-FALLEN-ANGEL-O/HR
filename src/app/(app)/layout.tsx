import AppShell from '@/components/app-shell';
import { getUser } from '@/lib/supabase/user';
import { cookies } from 'next/headers';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const user = await getUser(cookieStore);
  return <AppShell user={user}>{children}</AppShell>;
}
