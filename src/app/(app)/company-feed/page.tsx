import { Header } from '@/components/header';
import { getUser } from '@/lib/supabase/user';
import { cookies } from 'next/headers';
import CompanyFeedClient from './client';

export default async function CompanyFeedPage() {
  const cookieStore = cookies();
  const user = await getUser(cookieStore);
  const userRole = user?.role;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Company Feed" />
      <CompanyFeedClient userRole={userRole} />
    </div>
  );
}
