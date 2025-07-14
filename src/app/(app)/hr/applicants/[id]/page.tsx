import * as React from 'react';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Applicant, ApplicantNote } from '@/lib/types';
import ApplicantProfileClient from './client';

type ApplicantProfilePageProps = {
  params: {
    id: string;
  };
};

export default async function ApplicantProfilePage({ params }: ApplicantProfilePageProps) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: applicantData, error: applicantError } = await supabase
    .from('applicants')
    .select('*, jobs(title)')
    .eq('id', params.id)
    .single();

  if (applicantError || !applicantData) {
    notFound();
  }
  
  const { data: notesData, error: notesError } = await supabase
    .from('applicant_notes')
    .select('*')
    .eq('applicant_id', params.id)
    .order('created_at', { ascending: false });

  if (notesError) {
    // We can still render the page without notes
    console.error("Error fetching notes:", notesError);
  }

  const applicant: Applicant = applicantData;
  const notes: ApplicantNote[] = notesData || [];

  return <ApplicantProfileClient initialApplicant={applicant} initialNotes={notes} />;
}
