
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { applicantMatchScoring } from '@/ai/flows/applicant-match-scoring';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/user';
import type { LeaveBalance, UserProfile, HelpdeskTicket, College, Onboarding, Job } from '@/lib/types';
import { createCalendarEvent } from '@/services/google-calendar';

export async function addEmployee(formData: FormData) {
  const cookieStore = cookies();
  const supabaseAdmin = createAdminClient();
  const user = await getUser(cookieStore);

  if (!user || !['admin', 'super_hr', 'hr_manager'].includes(user.role)) {
    throw new Error('You do not have permission to add employees.');
  }
  
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const department = formData.get('department') as string;
  const role = formData.get('role') as UserProfile['role'];

  if (!fullName || !email || !department || !role) {
    throw new Error('All fields are required.');
  }

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role,
      department: department,
    },
  });

  if (authError) {
    throw new Error(`Could not create user: ${authError.message}`);
  }
  if (!authData.user) {
    throw new Error('User was not created in the authentication system.');
  }
  
  // The public.users table is now populated by a trigger, so we don't need to insert here.
  // We just need to generate the setup link.

  // 2. Generate a password recovery link for the new user
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: email,
  });

  if (linkError) {
    // If link generation fails, we should probably delete the user we just created to avoid orphans.
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Could not generate password setup link: ${linkError.message}`);
  }

  // NOTE: In a real application, you would now email `linkData.properties.action_link` to the new user.
  // For this demo, we will return it so the dialog can display it.
  console.log("Password Setup Link (for demo):", linkData.properties.action_link)
  
  revalidatePath('/hr/dashboard');
  
  return {
    setupLink: linkData.properties.action_link,
    userName: fullName
  };
}

export async function addJob(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const title = formData.get('title') as string;
  const department = formData.get('department') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as Job['status'];

  if (!title || !department || !status) {
    throw new Error('Title, Department, and Status are required.');
  }

  const { error } = await supabase.from('jobs').insert({
    title,
    department,
    description: description || '',
    status,
    posted_date: new Date().toISOString(),
    applicants: 0,
  });

  if (error) {
    throw new Error(`Failed to add job: ${error.message}`);
  }

  revalidatePath('/recruiter/jobs');
}

export async function updateJob(jobId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const title = formData.get('title') as string;
  const department = formData.get('department') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as Job['status'];

  if (!title || !department || !status) {
    throw new Error('Title, Department, and Status are required.');
  }

  const { error } = await supabase
    .from('jobs')
    .update({
      title,
      department,
      description: description || '',
      status,
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to update job: ${error.message}`);
  }

  revalidatePath('/recruiter/jobs');
}


export async function addCollege(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user || !['admin', 'super_hr', 'hr_manager', 'recruiter'].includes(user.role)) {
    throw new Error('You do not have permission to invite colleges.');
  }
  
  const name = formData.get('name') as string;
  const contact_email = formData.get('contact_email') as string;

  if (!name || !contact_email) {
    throw new Error('All fields are required.');
  }

  const { error } = await supabase.from('colleges').insert({
    name,
    contact_email,
    status: 'Invited',
    last_contacted: new Date().toISOString(),
    resumes_received: 0,
  });

  if (error) {
    throw new Error(`Failed to add college: ${error.message}`);
  }

  revalidatePath('/hr/campus');
}

export async function addExpenseReport(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const user = await getUser(cookieStore);

    if (!user) {
        throw new Error('You must be logged in to submit an expense report.');
    }

    const title = formData.get('title') as string;
    const total_amount = Number(formData.get('total_amount'));
    const description = formData.get('description') as string | undefined;

    if (!title || !total_amount) {
        throw new Error('Title and amount are required.');
    }

    const { data: report, error } = await supabase
        .from('expense_reports')
        .insert({
            user_id: user.id,
            title,
            total_amount,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
        }).select().single();

    if (error) {
        throw new Error(`Could not submit expense report: ${error.message}`);
    }
    
    if (description) {
        await supabase.from('expense_items').insert({
            expense_report_id: report.id,
            date: new Date().toISOString(),
            category: 'General',
            amount: total_amount,
            description: description,
        });
    }

    revalidatePath('/expenses');
}

export async function startOnboardingWorkflow(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const user_id = formData.get('user_id') as string;
  const manager_id = formData.get('manager_id') as string;
  const buddy_id = formData.get('buddy_id') as string | undefined;

  const { data: employee } = await supabase.from('users').select('full_name, avatar_url, department').eq('id', user_id).single();
  const { data: manager } = await supabase.from('users').select('full_name').eq('id', manager_id).single();
  const { data: buddy } = buddy_id ? await supabase.from('users').select('full_name').eq('id', buddy_id).single() : { data: null };


  const workflowData: Omit<Onboarding, 'id' | 'progress' | 'current_step'> = {
    user_id,
    manager_id,
    buddy_id: buddy_id || null,
    employee_name: employee?.full_name || 'N/A',
    employee_avatar: employee?.avatar_url || '',
    job_title: employee?.department || 'N/A',
    manager_name: manager?.full_name || 'N/A',
    buddy_name: buddy?.full_name || 'N/A',
    start_date: new Date().toISOString(),
  };

  const { error } = await supabase.from('onboarding_workflows').insert(workflowData);
  if (error) {
    throw new Error(`Could not start onboarding: ${error.message}`);
  }

  revalidatePath('/hr/onboarding');
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
    
    // Simple day diff, can be improved with date-fns
    const totalDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) + 1;
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
    
    if (leaveType !== 'unpaid_leave') {
        const { error: updateBalanceError } = await supabase
            .from('leave_balances')
            .update({ [leaveType]: balance[leaveType] - totalDays })
            .eq('user_id', user.id);
            
        if (updateBalanceError) throw new Error('Could not update leave balance.');
    }

    const { error: insertError } = await supabase.from('leaves').insert({
        user_id: user.id,
        leave_type: leaveType.replace('_leave', ''),
        start_date: startDate,
        end_date: endDate,
        reason: reason,
        status: 'pending',
        total_days: totalDays,
    });

    if (insertError) {
        // Rollback balance deduction if it happened
        if (leaveType !== 'unpaid_leave') {
            await supabase.from('leave_balances').update({ [leaveType]: balance[leaveType] }).eq('user_id', user.id);
        }
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
    if (fetchError || !leave) {
        throw new Error('Leave request not found.');
    }

    if (status === 'rejected' && leave.status === 'pending') {
        const leaveType = `${leave.leave_type}_leave` as keyof Omit<LeaveBalance, 'id' | 'user_id'>;
        if (leaveType !== 'unpaid_leave') {
            const { data: balance, error: balanceError } = await supabase
                .from('leave_balances')
                .select(leaveType)
                .eq('user_id', leave.user_id)
                .single();

            if (!balanceError && balance) {
                await supabase
                    .from('leave_balances')
                    .update({ [leaveType]: (balance[leaveType] || 0) + leave.total_days })
                    .eq('user_id', leave.user_id);
            }
        }
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
  revalidatePath(`/applicants/${applicant_id}`);
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
    revalidatePath(`/applicants/${applicantId}`);
}


export async function scheduleInterview(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user) {
    throw new Error('You must be logged in.');
  }

  const applicantId = formData.get('applicant_id') as string;
  const interviewerId = formData.get('interviewer_id') as string;
  const date = formData.get('date') as string;
  const time = formData.get('time') as string;
  const type = formData.get('type') as 'Video' | 'Phone' | 'In-person';

  if (!applicantId || !interviewerId || !date || !time || !type) {
    throw new Error('All fields are required to schedule an interview.');
  }

  const [{ data: applicant }, { data: interviewer }] = await Promise.all([
    supabase.from('applicants').select('name, email, jobs(title)').eq('id', applicantId).single(),
    supabase.from('users').select('full_name, email, avatar_url').eq('id', interviewerId).single(),
  ]);

  if (!applicant || !interviewer) {
    throw new Error('Could not find applicant or interviewer details.');
  }

  const { error } = await supabase.from('interviews').insert({
    applicant_id: applicantId,
    interviewer_id: interviewerId,
    date,
    time,
    type,
    status: 'Scheduled',
    candidate_name: applicant.name,
    candidate_avatar: '', 
    interviewer_name: interviewer.full_name || 'Interviewer',
    interviewer_avatar: interviewer.avatar_url || '',
    job_title: applicant.jobs?.title || 'N/A',
  });

  if (error) {
    throw new Error(`Could not schedule interview: ${error.message}`);
  }
  
  // Create calendar event
  const [hours, minutes] = time.split(':').map(Number);
  const startDateTime = new Date(date);
  startDateTime.setHours(hours, minutes);

  try {
      if (interviewer.email && applicant.email) {
        await createCalendarEvent({
            summary: `Interview: ${applicant.name} for ${applicant.jobs?.title || 'a position'}`,
            description: `Interview with ${applicant.name} for the ${applicant.jobs?.title || 'a position'}. Interviewer: ${interviewer.full_name}.`,
            start: startDateTime,
            attendees: [{ email: interviewer.email }, { email: applicant.email }],
        });
      }
  } catch(calendarError) {
      console.warn("Could not create calendar event, but interview was scheduled in the database.", calendarError);
  }

  revalidatePath('/interviewer/tasks');
}


export async function updateInterviewStatus(interviewId: string, status: 'Completed' | 'Canceled') {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const user = await getUser(cookieStore);
    
    if (!user) {
        throw new Error('You must be logged in.');
    }

    const { error } = await supabase.from('interviews').update({ status }).eq('id', interviewId);

    if (error) {
        throw new Error(`Failed to update interview status: ${error.message}`);
    }
    
    revalidatePath('/interviewer/tasks');
}

export async function addCompanyPost(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user || !['admin', 'super_hr', 'hr_manager'].includes(user.role)) {
    throw new Error('You do not have permission to create company posts.');
  }

  const content = formData.get('content') as string;
  const imageFile = formData.get('image') as File;
  let imageUrl: string | null = null;

  if (!content) {
    throw new Error('Post content cannot be empty.');
  }

  if (imageFile && imageFile.size > 0) {
    const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g, '-')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(fileName, imageFile);

    if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
        .from('post_images')
        .getPublicUrl(uploadData.path);
    imageUrl = urlData.publicUrl;
  }

  const { error } = await supabase.from('company_posts').insert({
    user_id: user.id,
    content,
    image_url: imageUrl,
  });

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  revalidatePath('/company-feed');
}

export async function addPostComment(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const user = await getUser(cookieStore);

    if (!user) throw new Error('You must be logged in.');

    const postId = formData.get('postId') as string;
    const comment = formData.get('comment') as string;

    if (!postId || !comment) {
        throw new Error('Post ID and comment are required.');
    }

    const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        comment,
    });

    if (error) {
        throw new Error(`Failed to add comment: ${error.message}`);
    }

    revalidatePath('/company-feed');
}

export async function addKudo(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user) throw new Error('You must be logged in.');

  const toUserId = formData.get('toUser') as string;
  const value = formData.get('value') as string;
  const message = formData.get('message') as string;

  if (!toUserId || !value || !message) {
    throw new Error('All fields are required.');
  }

  const { error } = await supabase.from('kudos').insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    value,
    message,
  });

  if (error) {
    throw new Error(`Failed to send kudos: ${error.message}`);
  }

  revalidatePath('/employee/kudos');
}

export async function addWeeklyAward(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const user = await getUser(cookieStore);

  if (!user || !['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'].includes(user.role)) {
    throw new Error('You do not have permission to give awards.');
  }

  const toUserId = formData.get('toUser') as string;
  const reason = formData.get('reason') as string;

  if (!toUserId || !reason) {
    throw new Error('All fields are required.');
  }

  const { error } = await supabase.from('weekly_awards').insert({
    awarded_user_id: toUserId,
    awarded_by_user_id: user.id,
    reason,
    week_of: new Date().toISOString().split('T')[0],
  });

   if (error) {
    throw new Error(`Failed to give award: ${error.message}`);
  }

  revalidatePath('/employee/kudos');
}

export async function createHelpdeskTicket(data: Omit<HelpdeskTicket, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'users' | 'ticket_comments'>) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const user = await getUser(cookieStore);

    if (!user) {
        throw new Error('You must be logged in.');
    }

    const { error } = await supabase.from('helpdesk_tickets').insert({
        ...data,
        user_id: user.id,
    });

    if (error) {
        throw new Error(`Failed to create ticket: ${error.message}`);
    }

    revalidatePath('/helpdesk');
}

export async function addTicketComment(ticketId: string, comment: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const user = await getUser(cookieStore);

    if (!user) {
        throw new Error('You must be logged in.');
    }

    const { error } = await supabase.from('ticket_comments').insert({
        ticket_id: ticketId,
        user_id: user.id,
        comment,
    });
    
    if (error) {
        throw new Error(`Failed to add comment: ${error.message}`);
    }

    // Also update the ticket's updated_at timestamp
    await supabase.from('helpdesk_tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId);


    revalidatePath('/helpdesk');
}
