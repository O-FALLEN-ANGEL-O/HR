import * as React from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Job } from '@/lib/types';
import JobsClient from './client';

export default async function JobsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('posted_date', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
  }

  const jobs: Job[] = data || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <JobsClient initialJobs={jobs} />
    </div>
  );
}
