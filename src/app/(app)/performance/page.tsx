import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import PerformanceClient from './client';
import type { PerformanceReview } from '@/lib/types';
import { Header } from '@/components/header';


export default async function PerformancePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('performance_reviews')
    .select('*, users(full_name, avatar_url)')
    .order('review_date', { ascending: false });

  if (error) {
    console.error('Error fetching performance reviews:', error);
  }

  const reviews: PerformanceReview[] = data || [];

  return (
     <div className="flex flex-1 flex-col">
      <Header title="Performance Management" />
      <main className="flex-1 p-4 md:p-6">
        <PerformanceClient initialReviews={reviews} />
      </main>
    </div>
  );
}
