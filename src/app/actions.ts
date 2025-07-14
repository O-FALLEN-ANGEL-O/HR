'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { applicantMatchScoring } from '@/ai/flows/applicant-match-scoring';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/user';
import type { LeaveBalance } from '@/lib/types';

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
    
    // Simple day diff, can be improved with date-fns
    const totalDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) + 1;
    if (totalDays <= 0) throw new Error('End date must be after start date.');

    const { data: balance, error: balanceError } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (balanceError || !balance) throw new Error('Could not retrieve your leave balance.');
    if (balance[leaveType] < totalDays) {
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

    if (!approver || !['admin', 'hr_manager', 'manager', 'team_lead'].includes(approver.role)) {
        throw new Error('You do not have permission to approve/reject leaves.');
    }

    const { error } = await supabase.from('leaves').update({ status, approver_id: approver.id }).eq('id', leaveId);

    if (error) {
        throw new Error(`Failed to update leave status: ${error.message}`);
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
