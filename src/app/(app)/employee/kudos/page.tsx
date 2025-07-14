import { Header } from '@/components/header';
import KudosClient from './client';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Kudo, UserProfile, WeeklyAward } from '@/lib/types';
import { getUser } from '@/lib/supabase/user';
import { startOfWeek } from 'date-fns';

async function getData(user: UserProfile | null) {
    if (!user) return { kudos: [], users: [], weeklyAward: null };
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const kudosQuery = supabase
        .from('kudos')
        .select('*, users_from:users!from_user_id(full_name, avatar_url), users_to:users!to_user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);

    const usersQuery = supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .neq('id', user.id) // Exclude current user from list
        .order('full_name');

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const weeklyAwardQuery = supabase
        .from('weekly_awards')
        .select('*, users(full_name, avatar_url), awarded_by:users!awarded_by_user_id(full_name)')
        .gte('week_of', weekStart.toISOString().split('T')[0])
        .order('week_of', { ascending: false })
        .limit(1);

    const [kudosRes, usersRes, awardRes] = await Promise.all([
        kudosQuery,
        usersQuery,
        weeklyAwardQuery,
    ]);

    if (kudosRes.error) console.error("Error fetching kudos:", kudosRes.error);
    if (usersRes.error) console.error("Error fetching users:", usersRes.error);
    if (awardRes.error) console.error("Error fetching weekly award:", awardRes.error);

    return {
        kudos: (kudosRes.data as Kudo[]) || [],
        users: (usersRes.data as UserProfile[]) || [],
        weeklyAward: (awardRes.data?.[0] as WeeklyAward) || null,
    };
}


export default async function KudosPage() {
  const cookieStore = cookies();
  const user = await getUser(cookieStore);
  const { kudos, users, weeklyAward } = await getData(user);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Kudos & Recognition" />
      <KudosClient
        currentUser={user}
        initialKudos={kudos}
        initialUsers={users}
        initialWeeklyAward={weeklyAward}
      />
    </div>
  );
}
