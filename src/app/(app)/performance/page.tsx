import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { PerformanceReview } from '@/lib/types';
import PerformanceClient from './client';

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

  const performanceReviews: PerformanceReview[] = data || [];

  return <PerformanceClient initialReviews={performanceReviews} />;
}
