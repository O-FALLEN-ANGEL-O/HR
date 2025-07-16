import { Header } from '@/components/header';
import { getUser } from '@/lib/supabase/user';
import { cookies } from 'next/headers';
import CompanyFeedClient from './client';
import { createClient } from '@/lib/supabase/server';
import type { CompanyPost } from '@/lib/types';
import { DashboardCard } from '../employee/dashboard/dashboard-card';

export default async function CompanyFeedPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);
  
  const { data, error } = await supabase
    .from('company_posts')
    .select('*, users (full_name, avatar_url, role, department), post_comments(*, users(full_name, avatar_url))')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching company posts:", error);
  }

  const posts: CompanyPost[] = data || [];

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Company Feed" />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto w-full max-w-3xl">
           <CompanyFeedClient user={user} initialPosts={posts} />
        </div>
      </main>
    </div>
  );
}
