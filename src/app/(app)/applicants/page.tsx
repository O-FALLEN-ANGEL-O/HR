import * as React from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Applicant } from '@/lib/types';
import ApplicantList from './client';
import ApplicantsHeader from './header.client';

export default async function ApplicantsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('applicants')
    .select('*')
    .order('applied_date', { ascending: false });

  if (error) {
    console.error('Error fetching applicants:', error);
    // In a real app, you'd want to show a proper error UI
  }

  const applicants: Applicant[] = data || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <ApplicantsHeader />
      <ApplicantList initialApplicants={applicants} />
    </div>
  );
}
