
import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import EmployeeDirectoryClient from './client';
import type { UserProfile } from '@/lib/types';

export default async function EmployeeDirectoryPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, department, avatar_url, phone, profile_setup_complete')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
  }

  const users: UserProfile[] = data || [];
  
  return (
    <div className="flex flex-1 flex-col">
      <Header title="Employee Directory" />
      <main className="flex-1 p-4 md:p-6">
        <EmployeeDirectoryClient users={users} />
      </main>
    </div>
  );
}
