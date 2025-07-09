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
    .select('id, full_name, email, department, avatar_url')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
  }

  const users: Omit<UserProfile, 'role' | 'created_at'>[] = (data || []).map(u => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    department: u.department,
    avatar_url: u.avatar_url,
  }));
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Employee Directory" />
      <EmployeeDirectoryClient users={users} />
    </div>
  );
}
