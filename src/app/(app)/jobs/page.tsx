import * as React from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Job } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import JobsClient from './client';

export default async function JobsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('postedDate', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
  }

  const jobs: Job[] = data || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Job Postings">
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </Header>
      <JobsClient initialJobs={jobs} />
    </div>
  );
}
