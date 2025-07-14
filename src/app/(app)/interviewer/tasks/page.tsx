import * as React from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Interview, Applicant, UserProfile } from '@/lib/types';
import { Header } from '@/components/header';
import InterviewList from './client';
import { ScheduleInterviewDialog } from '@/components/schedule-interview-dialog';

export default async function InterviewsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const interviewQuery = supabase
    .from('interviews')
    .select('*')
    .order('date', { ascending: false });
  
  const applicantsQuery = supabase
    .from('applicants')
    .select('id, name, avatar, jobs(title)')
    .in('stage', ['Applied', 'Phone Screen']);
    
  const interviewersQuery = supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .in('role', ['interviewer', 'manager', 'hr_manager', 'super_hr']);

  const [
    { data: interviews, error: interviewsError },
    { data: applicants, error: applicantsError },
    { data: interviewers, error: interviewersError }
  ] = await Promise.all([interviewQuery, applicantsQuery, interviewersQuery]);
    
  if (interviewsError) {
    console.error('Error fetching interviews:', interviewsError);
  }
  if (applicantsError) {
    console.error('Error fetching applicants:', applicantsError);
  }
  if (interviewersError) {
    console.error('Error fetching interviewers:', interviewersError);
  }

  const typedInterviews: Interview[] = interviews || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Interview Tasks">
        <ScheduleInterviewDialog 
            applicants={applicants || []}
            interviewers={interviewers || []}
        />
      </Header>
      <InterviewList initialInterviews={typedInterviews} />
    </div>
  );
}
