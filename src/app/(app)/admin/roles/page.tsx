import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import RoleManagerClient from './client';
import { Header } from '@/components/header';

export default async function RoleManagerPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
  }

  return (
    <>
      <Header title="User & Role Management" />
      <main className="flex-1 p-4 md:p-6">
        <RoleManagerClient users={users || []} />
      </main>
    </>
  );
}
