'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { applicantMatchScoring } from '@/ai/flows/applicant-match-scoring';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/user';
import type { Kudo, LeaveBalance, Interview } from '@/lib/types';
import { differenceInDays } from 'date-fns';

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

  if (!user || !['admin', 'hr_manager', 'super_hr', 'manager'].includes(user.role)) {
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

export async function applyForLeave(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const user = await getUser(cookieStore);

    if (!user) throw new Error('You must be logged in.');

    const leaveType = formData.get('leave_type') as keyof Omit<LeaveBalance, 'id' | 'user_id'>;
    const startDate = formData.get('start_date') as string;
    const endDate = formData.get('end_date') as string;
    const reason = formData.get('reason') as string;

    if (!leaveType || !startDate || !endDate || !reason) {
        throw new Error('All fields are required.');
    }
    
    const totalDays = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    if (totalDays <= 0) throw new Error('End date must be after start date.');

    const { data: balance, error: balanceError } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (balanceError || !balance) throw new Error('Could not retrieve your leave balance.');
    if (leaveType !== 'unpaid_leave' && balance[leaveType] < totalDays) {
        throw new Error('Insufficient leave balance for this request.');
    }
    
    // Deduct from balance
    const { error: updateBalanceError } = await supabase
        .from('leave_balances')
        .update({ [leaveType]: balance[leaveType] - totalDays })
        .eq('user_id', user.id);
        
    if (updateBalanceError) throw new Error('Could not update leave balance.');

    const { error: insertError } = await supabase.from('leaves').insert({
        user_id: user.id,
        leave_type: leaveType.replace('_leave', ''),
        start_date: startDate,
        end_date: endDate,
        reason: reason,
        total_days: totalDays,
        status: 'pending',
    });

    if (insertError) {
        // Rollback balance deduction
        await supabase.from('leave_balances').update({ [leaveType]: balance[leaveType] }).eq('user_id', user.id);
        throw new Error(`Could not submit leave request: ${insertError.message}`);
    }

    revalidatePath('/leaves');
}

export async function updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected') {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const approver = await getUser(cookieStore);

    if (!approver || !['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'].includes(approver.role)) {
        throw new Error('You do not have permission to approve/reject leaves.');
    }

    const { data: leave, error: fetchError } = await supabase.from('leaves').select('*').eq('id', leaveId).single();
    if (fetchError || !leave) throw new Error('Leave request not found.');

    const { error: updateError } = await supabase.from('leaves').update({ status, approver_id: approver.id }).eq('id', leaveId);

    if (updateError) {
        throw new Error(`Failed to update leave status: ${updateError.message}`);
    }

    // If a request is rejected, refund the leave days to the user's balance.
    if (status === 'rejected') {
        const { data: balance, error: balanceError } = await supabase.from('leave_balances').select('*').eq('user_id', leave.user_id).single();
        if (balanceError || !balance) throw new Error('Could not find user balance to refund.');

        const leaveTypeKey = `${leave.leave_type}_leave` as keyof LeaveBalance;
        if (leaveTypeKey in balance) {
            const currentBalance = balance[leaveTypeKey] as number;
            const newBalance = currentBalance + leave.total_days;
            await supabase.from('leave_balances').update({ [leaveTypeKey]: newBalance }).eq('user_id', leave.user_id);
        }
    }
    
    revalidatePath('/leaves');
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

  revalidatePath(`/hr/applicants/${applicant_id}`);
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

    revalidatePath('/interviewer/tasks');
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
    
    revalidatePath(`/hr/applicants/${applicantId}`);
}

export async function rejectApplicant(applicantId: string, reason: string, notes?: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user || !['admin', 'hr_manager', 'super_hr', 'recruiter'].includes(user.role)) {
    throw new Error('You do not have permission to perform this action.');
  }

  const { error } = await supabase
    .from('applicants')
    .update({ 
        stage: 'Rejected',
        rejection_reason: reason,
        rejection_notes: notes,
     })
    .eq('id', applicantId);

  if (error) {
    console.error('Error rejecting applicant:', error);
    throw new Error(`Could not update applicant status: ${error.message}`);
  }

  revalidatePath('/hr/applicants');
}

export async function scheduleInterview(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user || !['admin', 'hr_manager', 'super_hr', 'recruiter'].includes(user.role)) {
    throw new Error('You do not have permission to perform this action.');
  }

  const applicantId = formData.get('applicant_id') as string;
  const interviewerId = formData.get('interviewer_id') as string;
  const date = formData.get('date') as string;
  const time = formData.get('time') as string;
  const type = formData.get('type') as Interview['type'];

  if (!applicantId || !interviewerId || !date || !time || !type) {
    throw new Error('All fields are required to schedule an interview.');
  }

  const { data: applicant, error: applicantError } = await supabase.from('applicants').select('name, avatar, job_id').eq('id', applicantId).single();
  const { data: interviewer, error: interviewerError } = await supabase.from('users').select('full_name, avatar_url').eq('id', interviewerId).single();
  
  if (applicantError || interviewerError) {
    throw new Error('Could not retrieve applicant or interviewer details.');
  }
  
  const { data: job, error: jobError } = await supabase.from('jobs').select('title').eq('id', applicant.job_id!).single();

  if (jobError) {
    throw new Error('Could not retrieve job details.');
  }

  const { error: insertError } = await supabase.from('interviews').insert({
    applicant_id: applicantId,
    interviewer_id: interviewerId,
    candidate_name: applicant.name,
    candidate_avatar: applicant.avatar,
    job_title: job.title,
    interviewer_name: interviewer.full_name,
    interviewer_avatar: interviewer.avatar_url,
    date,
    time,
    type,
    status: 'Scheduled',
  });
  
  if (insertError) {
    console.error('Error scheduling interview:', insertError);
    throw new Error('Could not schedule interview.');
  }

  // Update applicant stage to 'Interview'
  await supabase.from('applicants').update({ stage: 'Interview' }).eq('id', applicantId);
  
  revalidatePath('/interviewer/tasks');
  revalidatePath('/hr/applicants');
}
