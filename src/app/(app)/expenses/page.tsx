import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import ExpensesClient from './client';
import type { ExpenseReport } from '@/lib/types';
import { getUser } from '@/lib/supabase/user';

export default async function ExpensesPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  let query = supabase
    .from('expense_reports')
    .select('*, users(full_name, avatar_url), expense_items(*)');

  if (user && user.role !== 'admin' && user.role !== 'hr_manager' && user.role !== 'super_hr' && user.role !== 'finance') {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query.order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching expense reports:', error);
  }

  const reports: ExpenseReport[] = data || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Expense Management" />
      <ExpensesClient initialReports={reports} />
    </div>
  );
}
