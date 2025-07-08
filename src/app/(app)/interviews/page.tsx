import * as React from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Interview } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import InterviewList from './client';

export default async function InterviewsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .order('date', { ascending: false });
    
  if (error) {
    console.error('Error fetching interviews:', error);
  }

  const interviews: Interview[] = data || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Interviews">
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      </Header>
      <InterviewList initialInterviews={interviews} />
    </div>
  );
}
