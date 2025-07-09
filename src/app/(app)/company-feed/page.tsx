import { Header } from '@/components/header';
import { getUser } from '@/lib/supabase/user';
import { cookies } from 'next/headers';
import CompanyFeedClient from './client';
import { createClient } from '@/lib/supabase/server';
import type { CompanyPost } from '@/lib/types';

export default async function CompanyFeedPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);
  
  const { data, error } = await supabase
    .from('company_posts')
    .select('*, users (full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching company posts:", error);
  }

  const posts: CompanyPost[] = data || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Company Feed" />
      <CompanyFeedClient user={user} initialPosts={posts} />
    </div>
  );
}
