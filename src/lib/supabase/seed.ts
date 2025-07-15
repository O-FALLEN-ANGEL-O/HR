

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { faker } from '@faker-js/faker';
import type { UserRole, Job, Applicant, College, Leave, LeaveBalance, Onboarding, PerformanceReview, Kudo, Payslip, CompanyDocument, Objective, KeyResult, ExpenseReport, ExpenseItem, HelpdeskTicket, CompanyPost, PostComment, WeeklyAward } from '@/lib/types';
import type { ProcessResumeOutput } from '@/ai/flows/process-resume';


// Configure dotenv to load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BATCH_SIZE = 100;
const departments = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Human Resources', 'Finance'];
const jobTitlesByDept: Record<string, string[]> = {
    'Engineering': ['Software Engineer', 'Senior Software Engineer', 'DevOps Engineer'],
    'Product': ['Product Manager', 'Product Analyst'],
    'Design': ['UI/UX Designer', 'Graphic Designer'],
    'Sales': ['Sales Development Representative', 'Account Executive'],
    'Marketing': ['Content Marketer', 'Digital Marketing Specialist'],
    'Human Resources': ['HR Generalist', 'Recruiter'],
    'Finance': ['Accountant', 'Financial Analyst']
};

async function main() {
  if (process.env.FORCE_DB_SEED !== 'true') {
    console.log('🌱 SKIPPING DB SEED: To run the seed script, set FORCE_DB_SEED=true in your environment.');
    return;
  }
  
  console.log('🌱 Starting database seed process...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('🔴 ERROR: Supabase URL or service key is missing. Make sure they are set in your .env.local file. Skipping seeding.');
    process.exit(0); 
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase admin client initialized.');

  // --- 1. Clean up existing data ---
  console.log('🧹 Cleaning up old data...');
  const tablesToClean = [
    'ticket_comments', 'helpdesk_tickets', 'expense_items', 'expense_reports', 'company_documents', 'payslips',
    'weekly_awards', 'kudos', 'post_comments', 'company_posts', 'key_results', 'objectives', 'performance_reviews', 'onboarding_workflows', 'leaves', 'leave_balances',
    'interviews', 'applicant_notes', 'applicants', 'colleges', 'jobs'
  ];
  for (const table of tablesToClean) {
    const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error(`🔴 Error cleaning table ${table}:`, error.message);
    else console.log(`- Cleaned ${table}`);
  }
  
  // --- 2. Clean up existing auth users for a fresh seed ---
  console.log('🧹 Deleting existing auth users...');
  const { data: { users: existingUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error('🔴 Error listing users:', listError.message);
  } else if (existingUsers.length > 0) {
    console.log(`Found ${existingUsers.length} users to delete...`);
    for (const user of existingUsers) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id, true); // true to hard-delete
      if (deleteError) {
        console.error(`🔴 Failed to delete user ${user.id}: ${deleteError.message}`);
      }
    }
    console.log(`✅ Deleted ${existingUsers.length} auth users.`);
  } else {
    console.log('✅ No existing auth users to delete.');
  }

  // --- 3. Create one simple user for each role ---
  const usersToCreate: { email: string; role: UserRole; fullName: string, department: string }[] = [
    { email: 'admin@hrplus.com', role: 'admin', fullName: 'Admin User', department: 'Management' },
    { email: 'super_hr@hrplus.com', role: 'super_hr', fullName: 'Super HR Susan', department: 'Human Resources' },
    { email: 'hr_manager@hrplus.com', role: 'hr_manager', fullName: 'HR Manager Harry', department: 'Human Resources' },
    { email: 'recruiter@hrplus.com', role: 'recruiter', fullName: 'Recruiter Rick', department: 'Human Resources' },
    { email: 'finance@hrplus.com', role: 'finance', fullName: 'Finance Fiona', department: 'Finance' },
    { email: 'it_admin@hrplus.com', role: 'it_admin', fullName: 'IT Admin Ira', department: 'IT' },
    { email: 'support@hrplus.com', role: 'support', fullName: 'Support Steve', department: 'IT' },
    { email: 'manager@hrplus.com', role: 'manager', fullName: 'Manager Mike', department: 'Engineering' },
    { email: 'team_lead@hrplus.com', role: 'team_lead', fullName: 'Team Lead Tina', department: 'Engineering' },
    { email: 'interviewer@hrplus.com', role: 'interviewer', fullName: 'Interviewer Ingrid', department: 'Engineering' },
    { email: 'employee@hrplus.com', role: 'employee', fullName: 'Employee Eric', department: 'Engineering' },
    { email: 'intern@hrplus.com', role: 'intern', fullName: 'Intern Ian', department: 'Engineering' },
  ];
  
  // Add more fake users
  for (let i = 0; i < 40; i++) {
    const department = faker.helpers.arrayElement(departments);
    usersToCreate.push({
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['employee', 'interviewer', 'team_lead']),
      fullName: faker.person.fullName(),
      department: department
    })
  }


  console.log(`👤 Creating ${usersToCreate.length} users with password "password"...`);
  const createdUsers: any[] = [];
  for (const userData of usersToCreate) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: 'password', // Set a default password
      email_confirm: true,  // Mark email as confirmed to allow password login
      user_metadata: {
        full_name: userData.fullName,
        role: userData.role,
        department: userData.department,
        avatar_url: faker.image.avatar(),
        profile_setup_complete: true, // Mark profile as complete for seeded users
      },
    });

    if (error) {
      console.error(`🔴 Error creating user ${userData.email}: ${error.message}`);
    } else if (data.user) {
      // The public.users table is populated by a trigger, so we fetch it after creation
      const { data: userProfile } = await supabaseAdmin.from('users').select('*').eq('id', data.user.id).single();
      createdUsers.push(userProfile);
    }
  }
   console.log(`✅ Successfully created ${createdUsers.length} users.`);


  // --- 4. SEED APPLICATION DATA ---
  
  // Jobs
  console.log('🌱 Seeding Jobs...');
  const jobs: Omit<Job, 'id' | 'applicants'>[] = [];
  for (let i = 0; i < 20; i++) {
    const department = faker.helpers.arrayElement(departments);
    jobs.push({
        title: faker.person.jobTitle(),
        department,
        description: faker.lorem.paragraphs(3),
        status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold']),
        posted_date: faker.date.past({ years: 1 }).toISOString(),
    });
  }
  const { data: createdJobs } = await supabaseAdmin.from('jobs').insert(jobs).select();
  console.log(`✅ Inserted ${createdJobs?.length || 0} jobs`);


  // Colleges
  console.log('🌱 Seeding Colleges...');
   const colleges: Omit<College, 'id' | 'applicants'>[] = Array.from({ length: 15 }, () => ({
        name: `${faker.location.city()} University`,
        status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended']),
        resumes_received: 0,
        contact_email: faker.internet.email(),
        last_contacted: faker.date.past({ years: 1 }).toISOString(),
    }));
    const { data: createdColleges } = await supabaseAdmin.from('colleges').insert(colleges).select();
    console.log(`✅ Inserted ${createdColleges?.length || 0} colleges`);

  // Applicants
  console.log('🌱 Seeding Applicants...');
  const applicants: Omit<Applicant, 'id' | 'jobs'>[] = [];
  for (let i = 0; i < 100; i++) {
    const resume_data: ProcessResumeOutput = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        links: [faker.internet.url()],
        skills: faker.helpers.arrayElements(['React', 'Node.js', 'PostgreSQL', 'Communication', 'Teamwork', 'Project Management'], { min: 3, max: 5 }),
        experience: [{ jobTitle: 'Previous Role', company: faker.company.name(), duration: '2020-2022' }],
        education: [{ institution: faker.helpers.arrayElement(createdColleges || []).name, degree: 'B.Tech', year: '2020' }],
        fullText: faker.lorem.paragraphs(5),
    };

    applicants.push({
      name: resume_data.fullName,
      email: resume_data.email,
      phone: resume_data.phone,
      job_id: faker.helpers.arrayElement(createdJobs || []).id,
      college_id: faker.helpers.arrayElement(createdColleges || []).id,
      stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected']),
      applied_date: faker.date.past({ years: 1 }).toISOString(),
      avatar: faker.image.avatar(),
      source: faker.helpers.arrayElement(['walk-in', 'college', 'email', 'manual']),
      resume_data,
      ai_match_score: faker.number.int({ min: 40, max: 95 }),
      ai_justification: faker.lorem.sentence(),
      wpm: faker.number.int({ min: 30, max: 90 }),
      accuracy: faker.number.int({ min: 80, max: 99 }),
      aptitude_score: faker.number.int({ min: 50, max: 98 }),
      comprehensive_score: faker.number.int({min: 50, max: 98}),
      english_grammar_score: faker.number.int({min: 50, max: 98}),
      customer_service_score: faker.number.int({min: 50, max: 98})
    });
  }
  const { data: createdApplicants } = await supabaseAdmin.from('applicants').insert(applicants).select();
  console.log(`✅ Inserted ${createdApplicants?.length || 0} applicants`);

  // Applicant Notes
  console.log('🌱 Seeding Applicant Notes...');
  const applicantNotes: Omit<ApplicantNote, 'id'>[] = [];
  for (let i = 0; i < 200; i++) {
    const user = faker.helpers.arrayElement(createdUsers);
    applicantNotes.push({
      applicant_id: faker.helpers.arrayElement(createdApplicants || []).id,
      user_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      note: faker.lorem.paragraph(),
      created_at: faker.date.past({ years: 1 }).toISOString()
    });
  }
  const { data: createdApplicantNotes } = await supabaseAdmin.from('applicant_notes').insert(applicantNotes).select();
  console.log(`✅ Inserted ${createdApplicantNotes?.length || 0} applicant notes`);

  // Interviews
  console.log('🌱 Seeding Interviews...');
  const interviews: Omit<Interview, 'id'>[] = [];
  for (let i = 0; i < 50; i++) {
    const applicant = faker.helpers.arrayElement(createdApplicants || []);
    const interviewer = faker.helpers.arrayElement(createdUsers.filter((u:any) => ['hr_manager', 'recruiter', 'interviewer', 'manager'].includes(u.role)));
    const job = createdJobs?.find(j => j.id === applicant.job_id);

    interviews.push({
      applicant_id: applicant.id,
      interviewer_id: interviewer.id,
      date: faker.date.future().toISOString().split('T')[0],
      time: `${faker.number.int({ min: 9, max: 16 })}:00`,
      type: faker.helpers.arrayElement(['Video', 'Phone', 'In-person']),
      status: faker.helpers.arrayElement(['Scheduled', 'Completed', 'Canceled']),
      candidate_name: applicant.name,
      candidate_avatar: applicant.avatar || null,
      interviewer_name: interviewer.full_name,
      interviewer_avatar: interviewer.avatar_url,
      job_title: job?.title || 'Software Engineer'
    });
  }
  const { data: createdInterviews } = await supabaseAdmin.from('interviews').insert(interviews).select();
  console.log(`✅ Inserted ${createdInterviews?.length || 0} interviews`);

  // Leave Balances
  console.log('🌱 Seeding Leave Balances...');
  const leaveBalances: Omit<LeaveBalance, 'id'>[] = createdUsers.map((user:any) => ({
      user_id: user.id,
      sick_leave: 12,
      casual_leave: 12,
      earned_leave: 15,
      unpaid_leave: 0,
  }));
  const { data: createdLeaveBalances } = await supabaseAdmin.from('leave_balances').insert(leaveBalances).select();
  console.log(`✅ Inserted ${createdLeaveBalances?.length || 0} leave balances`);

  // Leaves
  console.log('🌱 Seeding Leaves...');
  const leaves: Omit<Leave, 'id' | 'users'>[] = [];
  for (let i = 0; i < 100; i++) {
    const user = faker.helpers.arrayElement(createdUsers);
    const startDate = faker.date.past({ years: 1 });
    const endDate = new Date(startDate.getTime() + faker.number.int({ min: 1, max: 5 }) * 24 * 60 * 60 * 1000);
    leaves.push({
      user_id: user.id,
      leave_type: faker.helpers.arrayElement(['sick', 'casual', 'earned']),
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      reason: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['approved', 'rejected', 'pending']),
      approver_id: faker.helpers.arrayElement(createdUsers.filter((u:any) => u.role === 'manager')).id,
      created_at: faker.date.past({ years: 1 }).toISOString(),
      total_days: faker.number.int({ min: 1, max: 5 }),
    });
  }
  const { data: createdLeaves } = await supabaseAdmin.from('leaves').insert(leaves).select();
  console.log(`✅ Inserted ${createdLeaves?.length || 0} leaves`);

  // Onboarding
  console.log('🌱 Seeding Onboarding...');
  const onboardingWorkflows: Omit<Onboarding, 'id'>[] = [];
  for (let i = 0; i < 20; i++) {
    const user = faker.helpers.arrayElement(createdUsers.filter((u:any) => ['employee', 'intern'].includes(u.role)));
    const manager = faker.helpers.arrayElement(createdUsers.filter((u:any) => ['manager', 'team_lead'].includes(u.role)));
    const buddy = faker.helpers.arrayElement(createdUsers.filter((u:any) => u.role === 'employee' && u.id !== user.id));

    onboardingWorkflows.push({
      user_id: user.id,
      manager_id: manager.id,
      buddy_id: buddy.id,
      employee_name: user.full_name,
      employee_avatar: user.avatar_url,
      job_title: faker.person.jobTitle(),
      manager_name: manager.full_name,
      buddy_name: buddy.full_name,
      progress: faker.number.int({ min: 0, max: 100 }),
      current_step: faker.helpers.arrayElement(['Paperwork', 'Team Intro', 'First Project']),
      start_date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
    });
  }
  const { data: createdOnboarding } = await supabaseAdmin.from('onboarding_workflows').insert(onboardingWorkflows).select();
  console.log(`✅ Inserted ${createdOnboarding?.length || 0} onboarding workflows`);

  // Performance Reviews
  console.log('🌱 Seeding Performance Reviews...');
  const performanceReviews: Omit<PerformanceReview, 'id' | 'users'>[] = [];
  for (let i = 0; i < 50; i++) {
    const user = faker.helpers.arrayElement(createdUsers.filter((u:any) => ['employee', 'manager', 'team_lead'].includes(u.role)));
    performanceReviews.push({
      user_id: user.id,
      review_date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
      status: faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed']),
      job_title: faker.person.jobTitle()
    });
  }
  const { data: createdReviews } = await supabaseAdmin.from('performance_reviews').insert(performanceReviews).select();
  console.log(`✅ Inserted ${createdReviews?.length || 0} performance reviews`);

  // Objectives
  console.log('🌱 Seeding Objectives...');
  const objectives: Omit<Objective, 'id' | 'users' | 'key_results'>[] = [];
  for (let i = 0; i < 30; i++) {
    objectives.push({
      owner_id: faker.helpers.arrayElement(createdUsers).id,
      title: faker.company.catchPhrase(),
      quarter: `Q${faker.number.int({ min: 1, max: 4 })} ${faker.number.int({ min: 2023, max: 2024 })}`
    });
  }
  const { data: createdObjectives } = await supabaseAdmin.from('objectives').insert(objectives).select();
  console.log(`✅ Inserted ${createdObjectives?.length || 0} objectives`);

  // Key Results
  console.log('🌱 Seeding Key Results...');
  const keyResults: Omit<KeyResult, 'id'>[] = [];
  for (const objective of createdObjectives || []) {
    for (let i = 0; i < faker.number.int({min: 2, max: 4}); i++) {
      keyResults.push({
        objective_id: objective.id,
        description: faker.lorem.sentence(),
        progress: faker.number.int({ min: 0, max: 100 }),
        status: faker.helpers.arrayElement(['on_track', 'at_risk', 'off_track'])
      });
    }
  }
  const { data: createdKeyResults } = await supabaseAdmin.from('key_results').insert(keyResults).select();
  console.log(`✅ Inserted ${createdKeyResults?.length || 0} key results`);

  // Company Posts
  console.log('🌱 Seeding Company Posts...');
  const companyPosts: Omit<CompanyPost, 'id' | 'users' | 'post_comments'>[] = [];
  for (let i = 0; i < 15; i++) {
    companyPosts.push({
      user_id: faker.helpers.arrayElement(createdUsers.filter((u:any) => ['hr_manager', 'admin', 'super_hr'].includes(u.role))).id,
      content: faker.lorem.paragraphs(2),
      image_url: faker.helpers.maybe(() => faker.image.urlLoremFlickr({ category: 'business' })),
      created_at: faker.date.past({ years: 1 }).toISOString()
    });
  }
  const { data: createdPosts } = await supabaseAdmin.from('company_posts').insert(companyPosts).select();
  console.log(`✅ Inserted ${createdPosts?.length || 0} company posts`);

  // Post Comments
  console.log('🌱 Seeding Post Comments...');
  const postComments: Omit<PostComment, 'id' | 'users'>[] = [];
  for (const post of createdPosts || []) {
    for (let i = 0; i < faker.number.int({min: 0, max: 10}); i++) {
      postComments.push({
        post_id: post.id,
        user_id: faker.helpers.arrayElement(createdUsers).id,
        comment: faker.lorem.paragraph(),
        created_at: faker.date.past({ years: 1 }).toISOString()
      });
    }
  }
  const { data: createdComments } = await supabaseAdmin.from('post_comments').insert(postComments).select();
  console.log(`✅ Inserted ${createdComments?.length || 0} post comments`);

  // Kudos
  console.log('🌱 Seeding Kudos...');
  const kudos: Omit<Kudo, 'id' | 'users_from' | 'users_to'>[] = [];
  for (let i = 0; i < 100; i++) {
    const fromUser = faker.helpers.arrayElement(createdUsers);
    const toUser = faker.helpers.arrayElement(createdUsers.filter((u:any) => u.id !== fromUser.id));
    kudos.push({
      from_user_id: fromUser.id,
      to_user_id: toUser.id,
      value: faker.helpers.arrayElement(['Team Player', 'Innovation', 'Customer First', 'Ownership']),
      message: faker.lorem.sentence(),
      created_at: faker.date.past({ years: 1 }).toISOString()
    });
  }
  const { data: createdKudos } = await supabaseAdmin.from('kudos').insert(kudos).select();
  console.log(`✅ Inserted ${createdKudos?.length || 0} kudos`);

  // Weekly Awards
  console.log('🌱 Seeding Weekly Awards...');
  const weeklyAwards: Omit<WeeklyAward, 'id' | 'users' | 'awarded_by'>[] = [];
  for (let i = 0; i < 10; i++) {
    const awardedBy = faker.helpers.arrayElement(createdUsers.filter((u:any) => ['manager', 'hr_manager', 'admin'].includes(u.role)));
    const awardedUser = faker.helpers.arrayElement(createdUsers.filter((u:any) => u.id !== awardedBy.id));
    weeklyAwards.push({
      awarded_user_id: awardedUser.id,
      awarded_by_user_id: awardedBy.id,
      reason: faker.lorem.sentence(),
      week_of: faker.date.past({ weeks: i + 1 }).toISOString().split('T')[0]
    });
  }
  const { data: createdAwards } = await supabaseAdmin.from('weekly_awards').insert(weeklyAwards).select();
  console.log(`✅ Inserted ${createdAwards?.length || 0} weekly awards`);

  // Payslips
  console.log('🌱 Seeding Payslips...');
  const payslips: Omit<Payslip, 'id'>[] = [];
  for (const user of createdUsers) {
    for (let i=0; i < 6; i++) {
      const gross = faker.number.float({ min: 3000, max: 15000, precision: 2 });
      payslips.push({
        user_id: user.id,
        month: faker.date.month(),
        year: 2024,
        gross_salary: gross,
        net_salary: gross * 0.75,
        download_url: '#'
      });
    }
  }
  const { data: createdPayslips } = await supabaseAdmin.from('payslips').insert(payslips).select();
  console.log(`✅ Inserted ${createdPayslips?.length || 0} payslips`);

  // Company Documents
  console.log('🌱 Seeding Company Documents...');
  const companyDocuments: Omit<CompanyDocument, 'id'>[] = [
    { title: 'Employee Handbook', description: 'Company policies and procedures', category: 'HR', last_updated: new Date().toISOString(), download_url: '#' },
    { title: 'Code of Conduct', description: 'Ethical guidelines and standards', category: 'HR', last_updated: new Date().toISOString(), download_url: '#' },
    { title: 'IT Security Policy', description: 'Guidelines for using company IT resources', category: 'IT', last_updated: new Date().toISOString(), download_url: '#' },
  ];
  const { data: createdDocs } = await supabaseAdmin.from('company_documents').insert(companyDocuments).select();
  console.log(`✅ Inserted ${createdDocs?.length || 0} company documents`);

  // Expense Reports
  console.log('🌱 Seeding Expense Reports...');
  const expenseReports: Omit<ExpenseReport, 'id' | 'users' | 'expense_items'>[] = [];
  for (let i = 0; i < 50; i++) {
    expenseReports.push({
      user_id: faker.helpers.arrayElement(createdUsers).id,
      title: faker.commerce.productName(),
      total_amount: faker.number.float({ min: 50, max: 5000, precision: 2 }),
      status: faker.helpers.arrayElement(['draft', 'submitted', 'approved', 'rejected', 'reimbursed']),
      submitted_at: faker.date.past({ years: 1 }).toISOString()
    });
  }
  const { data: createdReports } = await supabaseAdmin.from('expense_reports').insert(expenseReports).select();
  console.log(`✅ Inserted ${createdReports?.length || 0} expense reports`);

  // Expense Items
  console.log('🌱 Seeding Expense Items...');
  const expenseItems: Omit<ExpenseItem, 'id'>[] = [];
  for (const report of createdReports || []) {
     for (let i = 0; i < faker.number.int({min: 1, max: 5}); i++) {
      expenseItems.push({
        expense_report_id: report.id,
        date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
        category: faker.helpers.arrayElement(['Travel', 'Meals', 'Software']),
        amount: faker.number.float({ min: 10, max: 1000, precision: 2 }),
        description: faker.lorem.sentence()
      });
    }
  }
  const { data: createdItems } = await supabaseAdmin.from('expense_items').insert(expenseItems).select();
  console.log(`✅ Inserted ${createdItems?.length || 0} expense items`);

  // Helpdesk Tickets
  console.log('🌱 Seeding Helpdesk Tickets...');
  const helpdeskTickets: Omit<HelpdeskTicket, 'id' | 'users' | 'ticket_comments'>[] = [];
  for (let i = 0; i < 50; i++) {
    const resolver = faker.helpers.arrayElement(createdUsers.filter((u:any) => ['it_admin', 'support', 'hr_manager'].includes(u.role)));
    helpdeskTickets.push({
      user_id: faker.helpers.arrayElement(createdUsers).id,
      subject: faker.hacker.phrase(),
      description: faker.lorem.paragraphs(2),
      category: faker.helpers.arrayElement(['IT', 'HR', 'Finance', 'General']),
      status: faker.helpers.arrayElement(['Open', 'In Progress', 'Resolved', 'Closed']),
      priority: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Urgent']),
      created_at: faker.date.past({ years: 1 }).toISOString(),
      updated_at: faker.date.past({ years: 1 }).toISOString(),
      resolver_id: resolver?.id
    });
  }
  const { data: createdTickets } = await supabaseAdmin.from('helpdesk_tickets').insert(helpdeskTickets).select();
  console.log(`✅ Inserted ${createdTickets?.length || 0} helpdesk tickets`);

  // Ticket Comments
  console.log('🌱 Seeding Ticket Comments...');
  const ticketComments: Omit<TicketComment, 'id' | 'users'>[] = [];
  for (const ticket of createdTickets || []) {
    for (let i=0; i<faker.number.int({min: 0, max: 5}); i++) {
      ticketComments.push({
        ticket_id: ticket.id,
        user_id: faker.helpers.arrayElement(createdUsers).id,
        comment: faker.lorem.paragraph(),
        created_at: faker.date.past({ years: 1 }).toISOString()
      });
    }
  }
  const { data: createdTicketComments } = await supabaseAdmin.from('ticket_comments').insert(ticketComments).select();
  console.log(`✅ Inserted ${createdTicketComments?.length || 0} ticket comments`);


  console.log('✅ Database seeding process completed successfully!');
}

main().catch(error => {
    console.error('🔴 Seeding failed:', error);
    process.exit(1);
});
