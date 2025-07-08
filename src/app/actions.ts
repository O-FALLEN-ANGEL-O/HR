'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { applicantMatchScoring } from '@/ai/flows/applicant-match-scoring';
import { currentUser } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export async function addApplicantNote(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const note = formData.get('note') as string;
  const applicant_id = formData.get('applicant_id') as string;

  if (!note || !applicant_id) {
    throw new Error('Note and applicant ID are required.');
  }

  const { error } = await supabase.from('applicant_notes').insert({
    applicant_id,
    note,
    author_name: currentUser.name,
    author_avatar: currentUser.avatar,
  });

  if (error) {
    console.error('Error adding note:', error);
    throw new Error('Could not add note.');
  }

  revalidatePath(`/applicants/${applicant_id}`);
}

export async function generateAiMatchScore(applicantId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Fetch the applicant data
    const { data: applicant, error: applicantError } = await supabase
        .from('applicants')
        .select('*')
        .eq('id', applicantId)
        .single();
    
    if (applicantError || !applicant) {
        throw new Error('Could not find applicant.');
    }

    // 2. Fetch the job description
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('description')
        .eq('title', applicant.job_title)
        .single();

    if (jobError || !job || !job.description) {
        throw new Error(`Could not find job description for "${applicant.job_title}".`);
    }

    // 3. Prepare the data for the AI flow
    const applicantProfile = applicant.resume_data 
        ? JSON.stringify(applicant.resume_data, null, 2) 
        : 'No resume data available.';
    
    // 4. Call the AI flow
    const result = await applicantMatchScoring({
        jobDescription: job.description,
        applicantProfile: applicantProfile,
    });

    // 5. Update the applicant record with the score
    const { error: updateError } = await supabase
        .from('applicants')
        .update({
            ai_match_score: result.matchScore,
            ai_justification: result.justification,
        })
        .eq('id', applicantId);
    
    if (updateError) {
        console.error("Error updating applicant with AI score:", updateError);
        throw new Error("Could not save AI score to the database.");
    }
    
    // 6. Revalidate the path to show the new data
    revalidatePath(`/applicants/${applicantId}`);
}
