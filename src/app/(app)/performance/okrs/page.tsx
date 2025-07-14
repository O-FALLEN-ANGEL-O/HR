import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import OkrClient from './client';
import type { Objective } from '@/lib/types';
import { getUser } from '@/lib/supabase/user';

export default async function OkrPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  let query = supabase
    .from('objectives')
    .select('*, users(full_name, avatar_url), key_results(*)');

  if (user && user.role !== 'admin' && user.role !== 'hr_manager' && user.role !== 'super_hr') {
    query = query.eq('owner_id', user.id);
  }

  const { data, error } = await query.order('quarter', { ascending: false });

  if (error) {
    console.error('Error fetching OKRs:', error);
  }

  const objectives: Objective[] = data || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Objectives & Key Results" />
      <OkrClient initialObjectives={objectives} />
    </div>
  );
}
