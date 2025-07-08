import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/types';
import RoleManagerClient from './client';

export default async function RoleManagerPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    // Handle error appropriately
  }

  return <RoleManagerClient users={users || []} />;
}
