'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { applicantMatchScoring } from '@/ai/flows/applicant-match-scoring';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/user';
import type { Kudo } from '@/lib/types';

export async function addCompanyPost(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user || !['admin', 'hr_manager', 'super_hr'].includes(user.role)) {
    throw new Error('You do not have permission to create a company post.');
  }

  const content = formData.get('content') as string;
  const imageUrl = formData.get('imageUrl') as string;

  if (!content) throw new Error('Post content cannot be empty.');

  const { error } = await supabase.from('company_posts').insert({
    author_id: user.id,
    content,
    image_url: imageUrl || undefined,
  });

  if (error) {
    console.error('Error creating company post:', error);
    throw new Error('Could not create company post.');
  }

  revalidatePath('/company-feed');
}

export async function addKudo(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user) throw new Error('You must be logged in to give kudos.');

  const toUserId = formData.get('toUser') as string;
  const message = formData.get('message') as string;
  const value = formData.get('value') as Kudo['value'];

  if (!toUserId || !message || !value) {
    throw new Error('All fields are required to give kudos.');
  }

  const { error } = await supabase.from('kudos').insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    message,
    value,
  });

  if (error) {
    console.error('Error adding kudo:', error);
    throw new Error('Could not save your kudo.');
  }

  revalidatePath('/employee/kudos');
}

export async function addWeeklyAward(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user || !['admin', 'hr_manager', 'super_hr'].includes(user.role)) {
    throw new Error('You do not have permission to give weekly awards.');
  }

  const toUserId = formData.get('toUser') as string;
  const reason = formData.get('reason') as string;

  if (!toUserId || !reason) {
    throw new Error('Employee and reason are required.');
  }

  // First, delete any existing awards for the week to ensure only one.
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const { error: deleteError } = await supabase
    .from('weekly_awards')
    .delete()
    .gte('week_of', weekStart.toISOString());
  
  if (deleteError) {
    console.error('Error clearing old weekly awards:', deleteError);
  }

  const { error: insertError } = await supabase.from('weekly_awards').insert({
    user_id: toUserId,
    awarded_by_user_id: user.id,
    reason,
    week_of: new Date().toISOString(),
  });

  if (insertError) {
    console.error('Error adding weekly award:', insertError);
    throw new Error('Could not save the weekly award.');
  }

  revalidatePath('/employee/kudos');
}

export async function updateTimeOffRequest(requestId: string, status: 'Approved' | 'Rejected') {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const user = await getUser(cookieStore);

    if (!user || !['admin', 'hr_manager', 'super_hr', 'manager'].includes(user.role)) {
        throw new Error('You do not have permission to update time off requests.');
    }

    const { error } = await supabase
      .from('time_off_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
        console.error('Error updating time off request:', error);
        throw new Error('Could not update the request.');
    }

    revalidatePath('/time-off');
    revalidatePath('/manager/dashboard');
}

export async function addApplicantNote(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user) {
    throw new Error('You must be logged in to add a note.');
  }

  const note = formData.get('note') as string;
  const applicant_id = formData.get('applicant_id') as string;

  if (!note || !applicant_id) {
    throw new Error('Note and applicant ID are required.');
  }

  const { error } = await supabase.from('applicant_notes').insert({
    applicant_id,
    note,
    author_name: user.full_name || 'HR Team',
    author_avatar: user.avatar_url || '',
    user_id: user.id,
  });

  if (error) {
    console.error('Error adding note:', error);
    throw new Error('Could not add note. You may not have the required permissions.');
  }

  revalidatePath(`/applicants/${applicant_id}`);
}

export async function updateInterviewStatus(interviewId: string, status: 'Completed' | 'Canceled') {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const user = await getUser(cookieStore);

    if (!user || !['admin', 'hr_manager', 'super_hr', 'recruiter', 'interviewer'].includes(user.role)) {
        throw new Error('You do not have permission to update interviews.');
    }

    const { error } = await supabase
      .from('interviews')
      .update({ status })
      .eq('id', interviewId);

    if (error) {
        console.error('Error updating interview status:', error);
        throw new Error('Could not update interview.');
    }

    revalidatePath('/interviews');
}


export async function generateAiMatchScore(applicantId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: applicant, error: applicantError } = await supabase
        .from('applicants')
        .select('job_id, resume_data')
        .eq('id', applicantId)
        .single();
    
    if (applicantError || !applicant || !applicant.job_id) {
        throw new Error('Could not find applicant or they are not associated with a job.');
    }

    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('description')
        .eq('id', applicant.job_id)
        .single();

    if (jobError || !job || !job.description) {
        throw new Error(`Could not find job description for the associated job.`);
    }

    const applicantProfile = applicant.resume_data 
        ? JSON.stringify(applicant.resume_data, null, 2) 
        : 'No resume data available.';
    
    const result = await applicantMatchScoring({
        jobDescription: job.description,
        applicantProfile: applicantProfile,
    });

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
    
    revalidatePath(`/applicants/${applicantId}`);
}
