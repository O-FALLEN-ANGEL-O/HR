import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import HelpdeskClient from './client';
import type { HelpdeskTicket } from '@/lib/types';
import { getUser } from '@/lib/supabase/user';

export default async function HelpdeskPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  let query = supabase
    .from('helpdesk_tickets')
    .select('*, users(full_name, avatar_url), ticket_comments(*, users(full_name, avatar_url))');

  // Non-admins/support only see their own tickets
  if (user && !['admin', 'super_hr', 'it_admin', 'support', 'finance'].includes(user.role)) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching helpdesk tickets:', error);
  }

  const tickets: HelpdeskTicket[] = data || [];

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Helpdesk & Support" />
      <main className="flex-1 p-4 md:p-6">
        <HelpdeskClient initialTickets={tickets} currentUser={user} />
      </main>
    </div>
  );
}
