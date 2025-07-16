
'use server';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import type { UserProfile, ApplicantStage } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is missing from environment variables.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// List of demo users to create
const demoUsers = [
    { email: 'john.admin@company.com', fullName: 'John Admin', role: 'admin', department: 'Executive' },
    { email: 'olivia.superhr@company.com', fullName: 'Olivia SuperHR', role: 'super_hr', department: 'Human Resources' },
    { email: 'sarah.hr@company.com', fullName: 'Sarah HR', role: 'hr_manager', department: 'Human Resources' },
    { email: 'mike.recruiter@company.com', fullName: 'Mike Recruiter', role: 'recruiter', department: 'Human Resources' },
    { email: 'emily.manager@company.com', fullName: 'Emily Manager', role: 'manager', department: 'Engineering' },
    { email: 'david.teamlead@company.com', fullName: 'David TeamLead', role: 'team_lead', department: 'Engineering' },
    { email: 'lisa.employee@company.com', fullName: 'Lisa Employee', role: 'employee', department: 'Engineering' },
    { email: 'tom.intern@company.com', fullName: 'Tom Intern', role: 'intern', department: 'Engineering' },
    { email: 'rachel.finance@company.com', fullName: 'Rachel Finance', role: 'finance', department: 'Finance' },
    { email: 'james.it@company.com', fullName: 'James IT', role: 'it_admin', department: 'IT' },
    { email: 'alex.support@company.com', fullName: 'Alex Support', role: 'support', department: 'IT' },
    { email: 'emma.auditor@company.com', fullName: 'Emma Auditor', role: 'auditor', department: 'Finance' },
    { email: 'noah.interviewer@company.com', fullName: 'Noah Interviewer', role: 'interviewer', department: 'Product' },
];

async function seed() {
  console.log('🌱 Starting full database seed process...');
  
  if (!supabaseAdmin) {
    console.error('🔴 Supabase admin client is not initialized. Aborting.');
    return;
  }
  console.log('✅ Supabase admin client initialized.');

  // Clean up existing data
  console.log('🧹 Cleaning up old data...');
  
  // 1. Delete all auth users. The `on delete cascade` should handle public.users.
  const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();
  console.log(`Found ${authUsers.length} auth users to delete...`);
  for (const user of authUsers) {
    await supabaseAdmin.auth.admin.deleteUser(user.id);
  }
  console.log('✅ Finished deleting auth users.');

  // 2. Clean all other public tables
  const tablesToClean = [
      'ticket_comments', 'helpdesk_tickets', 'expense_items', 'expense_reports',
      'company_documents', 'payslips', 'weekly_awards', 'kudos', 'post_comments',
      'company_posts', 'key_results', 'objectives', 'performance_reviews', 'onboarding_workflows',
      'leaves', 'leave_balances', 'interviews', 'applicant_notes', 'applicants', 'colleges', 'jobs',
      'users' // Also explicitly clean users table as a fallback
  ];

  for (const table of tablesToClean) {
    // Delete all rows from the table without a filter
    const { error: deleteError } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Use a condition that is always true for UUIDs to delete all rows
     if (deleteError) {
        if (!deleteError.message.includes('does not exist')) {
            console.warn(`🟡 Could not clean table ${table}: ${deleteError.message}`);
        }
    }
  }
  console.log('✅ Finished cleaning public tables.');
  
  // 3. Seed Users
  console.log('👤 Creating auth users and public profiles...');
  const createdUsers: UserProfile[] = [];
  for (const userData of demoUsers) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: 'password123',
          email_confirm: true,
          user_metadata: {
              full_name: userData.fullName,
              role: userData.role,
              department: userData.department
          }
      });

      if (authError || !authData.user) {
          console.error(`🔴 Error creating auth user ${userData.email}:`, authError?.message);
          continue;
      }
      
      const { error: profileError } = await supabaseAdmin.from('users').insert({
          id: authData.user.id,
          full_name: userData.fullName,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          profile_setup_complete: true,
          avatar_url: faker.image.avatar(),
      });

      if (profileError) {
          console.error(`🔴 Error creating public profile for ${userData.email}:`, profileError.message);
      } else {
          createdUsers.push({
            id: authData.user.id,
            full_name: userData.fullName,
            email: userData.email,
            role: userData.role,
            department: userData.department,
            avatar_url: '', 
            created_at: new Date().toISOString()
          });
      }
  }
  console.log(`✅ Created ${createdUsers.length} users.`);
  
  if (createdUsers.length === 0) {
      console.error('🔴 No users were created. Aborting seed of other tables.');
      return;
  }

  // 4. Seed all other tables
  console.log('🚀 Starting data generation for other tables...');
  try {
    const managers = createdUsers.filter(u => ['manager', 'team_lead', 'super_hr'].includes(u.role));
    const employees = createdUsers.filter(u => ['employee', 'intern'].includes(u.role));
    
    await seedJobs();
    const { data: jobs } = await supabaseAdmin.from('jobs').select('id');
    
    await seedColleges();
    const { data: colleges } = await supabaseAdmin.from('colleges').select('id');

    if (jobs && colleges) {
      await seedApplicants(jobs, colleges);
      const { data: applicants } = await supabaseAdmin.from('applicants').select('id, name, email');
      if (applicants) {
         await seedApplicantNotes(applicants, createdUsers);
         await seedInterviews(applicants, createdUsers.filter(u => ['interviewer', 'manager'].includes(u.role)));
      }
    }
    
    await seedLeaveBalancesAndLeave(createdUsers, managers);
    await seedOnboarding(employees, managers);
    await seedPerformanceReviews(employees);
    await seedOkrs(createdUsers);
    await seedCompanyFeed(createdUsers);
    await seedKudos(createdUsers);
    await seedWeeklyAward(managers, employees);
    await seedPayslips(employees);
    await seedCompanyDocs();
    await seedExpenses(createdUsers);
    await seedHelpdesk(createdUsers);

    console.log('\n🎉 Full database seed process complete!');
  } catch (e: any) {
    console.error('🔴 A critical error occurred during seeding:', e.message);
    console.error(e.stack);
  }
}

// --- Seeder Functions ---

async function seedJobs() {
  const jobCount = 15;
  const jobs = Array.from({ length: jobCount }, () => ({
    title: faker.person.jobTitle(),
    department: faker.person.jobArea(),
    description: faker.lorem.paragraphs(3),
    status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold']),
    posted_date: faker.date.past({ years: 1 }),
    applicants: faker.number.int({ min: 5, max: 100 }),
  }));
  await supabaseAdmin.from('jobs').insert(jobs);
  console.log(`✅ Seeded ${jobCount} jobs.`);
}

async function seedColleges() {
    const collegeCount = 10;
    const colleges = Array.from({ length: collegeCount }, () => ({
        name: `${faker.location.city()} University`,
        status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended', 'Declined']),
        resumes_received: faker.number.int({ min: 20, max: 200 }),
        contact_email: faker.internet.email(),
        last_contacted: faker.date.recent({ days: 30 })
    }));
    await supabaseAdmin.from('colleges').insert(colleges);
    console.log(`✅ Seeded ${collegeCount} colleges.`);
}

async function seedApplicants(jobs: {id: string}[], colleges: {id: string}[]) {
    const applicantCount = 50;
    const stages: ApplicantStage[] = ['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'];
    const applicants = Array.from({ length: applicantCount }, () => {
        const name = faker.person.fullName();
        return {
            name,
            email: faker.internet.email({ firstName: name.split(' ')[0], lastName: name.split(' ')[1] }),
            phone: faker.phone.number(),
            job_id: faker.helpers.arrayElement(jobs).id,
            college_id: faker.helpers.arrayElement(colleges).id,
            stage: faker.helpers.arrayElement(stages),
            applied_date: faker.date.past({ years: 1 }),
            avatar: faker.image.avatar(),
            source: faker.helpers.arrayElement(['walk-in', 'college', 'email', 'manual']),
            ai_match_score: faker.number.int({min: 40, max: 99}),
            ai_justification: faker.lorem.sentence(),
            wpm: faker.number.int({ min: 40, max: 120 }),
            accuracy: faker.number.int({ min: 80, max: 99 }),
            aptitude_score: faker.number.int({ min: 60, max: 98 }),
        };
    });
    await supabaseAdmin.from('applicants').insert(applicants);
    console.log(`✅ Seeded ${applicantCount} applicants.`);
}

async function seedApplicantNotes(applicants: {id: string}[], users: UserProfile[]) {
    const notes = applicants.flatMap(applicant => 
        Array.from({ length: faker.number.int({ min: 0, max: 4 }) }, () => {
            const author = faker.helpers.arrayElement(users);
            return {
                applicant_id: applicant.id,
                user_id: author.id,
                author_name: author.full_name,
                author_avatar: author.avatar_url,
                note: faker.hacker.phrase(),
            };
        })
    );
    if (notes.length > 0) {
        await supabaseAdmin.from('applicant_notes').insert(notes);
        console.log(`✅ Seeded ${notes.length} applicant notes.`);
    }
}

async function seedInterviews(applicants: {id: string, name: string}[], interviewers: UserProfile[]) {
    if (applicants.length === 0 || interviewers.length === 0) return;
    const interviews = applicants.map(applicant => {
        const interviewer = faker.helpers.arrayElement(interviewers);
        return {
            applicant_id: applicant.id,
            interviewer_id: interviewer.id,
            date: faker.date.future({ years: 0.1 }),
            time: `${faker.number.int({min: 9, max: 17})}:00`,
            type: faker.helpers.arrayElement(['Video', 'Phone', 'In-person']),
            status: 'Scheduled',
            candidate_name: applicant.name,
            interviewer_name: interviewer.full_name,
            job_title: faker.person.jobTitle(),
        };
    });
    await supabaseAdmin.from('interviews').insert(interviews);
    console.log(`✅ Seeded ${interviews.length} interviews.`);
}

async function seedLeaveBalancesAndLeave(users: UserProfile[], managers: UserProfile[]) {
    if (users.length === 0) return;
    const balances = users.map(user => ({
        user_id: user.id,
        sick_leave: 12,
        casual_leave: 15,
        earned_leave: 10,
        unpaid_leave: faker.number.int({ min: 0, max: 5 }),
    }));
    await supabaseAdmin.from('leave_balances').insert(balances);
    console.log(`✅ Seeded ${balances.length} leave balances.`);
    
    if (managers.length === 0) return;
    const leaves = users.flatMap(user =>
        Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => {
            const startDate = faker.date.past({ years: 1 });
            const endDate = new Date(startDate.getTime() + faker.number.int({ min: 1, max: 5 }) * 24 * 60 * 60 * 1000);
            return {
                user_id: user.id,
                leave_type: faker.helpers.arrayElement(['sick', 'casual', 'earned']),
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                reason: faker.lorem.sentence(),
                status: faker.helpers.arrayElement(['approved', 'rejected', 'pending']),
                approver_id: faker.helpers.arrayElement(managers).id,
                total_days: (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1,
            };
        })
    );
    await supabaseAdmin.from('leaves').insert(leaves);
    console.log(`✅ Seeded ${leaves.length} leave records.`);
}

async function seedOnboarding(employees: UserProfile[], managers: UserProfile[]) {
    if (employees.length === 0 || managers.length === 0) return;
    const workflows = employees.slice(0, 5).map(employee => {
        const buddy = faker.helpers.arrayElement(employees.filter(e => e.id !== employee.id));
        return {
            user_id: employee.id,
            manager_id: faker.helpers.arrayElement(managers).id,
            buddy_id: buddy ? buddy.id : null,
            employee_name: employee.full_name,
            job_title: faker.person.jobTitle(),
            manager_name: faker.person.fullName(),
            buddy_name: buddy ? buddy.full_name : null,
            progress: faker.number.int({ min: 10, max: 100 }),
            current_step: faker.helpers.arrayElement(['IT Setup', 'Documentation', 'Team Intro']),
            start_date: faker.date.recent({ days: 20 }),
        };
    });
    if (workflows.length > 0) {
        await supabaseAdmin.from('onboarding_workflows').insert(workflows);
        console.log(`✅ Seeded ${workflows.length} onboarding workflows.`);
    }
}

async function seedPerformanceReviews(employees: UserProfile[]) {
    if (employees.length === 0) return;
    const reviews = employees.map(employee => ({
        user_id: employee.id,
        review_date: faker.date.past({ years: 1 }),
        status: faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed']),
        job_title: employee.department
    }));
    await supabaseAdmin.from('performance_reviews').insert(reviews);
    console.log(`✅ Seeded ${reviews.length} performance reviews.`);
}

async function seedOkrs(users: UserProfile[]) {
    if (users.length === 0) return;
    const objectives = Array.from({ length: 5 }, () => ({
        owner_id: faker.helpers.arrayElement(users).id,
        title: faker.company.catchPhrase(),
        quarter: `Q${faker.number.int({min: 1, max: 4})} ${new Date().getFullYear()}`,
    }));
    const { data: insertedObjectives } = await supabaseAdmin.from('objectives').insert(objectives).select();

    if (insertedObjectives) {
        const keyResults = insertedObjectives.flatMap(obj => 
            Array.from({ length: 3 }, () => ({
                objective_id: obj.id,
                description: faker.lorem.sentence(),
                progress: faker.number.int({ min: 0, max: 100 }),
                status: faker.helpers.arrayElement(['on_track', 'at_risk', 'off_track']),
            }))
        );
        await supabaseAdmin.from('key_results').insert(keyResults);
        console.log(`✅ Seeded ${objectives.length} OKRs and their key results.`);
    }
}

async function seedCompanyFeed(users: UserProfile[]) {
     if (users.length === 0) return;
    const posts = Array.from({ length: 10 }, () => ({
        user_id: faker.helpers.arrayElement(users).id,
        content: faker.lorem.paragraph(),
        image_url: faker.datatype.boolean() ? faker.image.urlLoremFlickr({ category: 'business', width: 600, height: 400 }) : null,
    }));
    const { data: insertedPosts } = await supabaseAdmin.from('company_posts').insert(posts).select();

    if (insertedPosts) {
        const comments = insertedPosts.flatMap(post => 
            Array.from({ length: faker.number.int({ min: 0, max: 8})}, () => ({
                post_id: post.id,
                user_id: faker.helpers.arrayElement(users).id,
                comment: faker.lorem.sentence(),
            }))
        );
        if (comments.length > 0) {
            await supabaseAdmin.from('post_comments').insert(comments);
        }
    }
    console.log(`✅ Seeded ${posts.length} company posts and comments.`);
}

async function seedKudos(users: UserProfile[]) {
     if (users.length < 2) return;
    const kudos = Array.from({ length: 20 }, () => {
        const fromUser = faker.helpers.arrayElement(users);
        const toUser = faker.helpers.arrayElement(users.filter(u => u.id !== fromUser.id));
        return {
            from_user_id: fromUser.id,
            to_user_id: toUser.id,
            value: faker.helpers.arrayElement(['Team Player', 'Innovation', 'Customer First', 'Ownership']),
            message: faker.lorem.sentence(),
        };
    });
    await supabaseAdmin.from('kudos').insert(kudos);
    console.log(`✅ Seeded ${kudos.length} kudos.`);
}

async function seedWeeklyAward(managers: UserProfile[], employees: UserProfile[]) {
    if (managers.length > 0 && employees.length > 0) {
        await supabaseAdmin.from('weekly_awards').insert({
            awarded_user_id: faker.helpers.arrayElement(employees).id,
            awarded_by_user_id: faker.helpers.arrayElement(managers).id,
            reason: 'For outstanding performance and dedication this week.',
            week_of: new Date().toISOString().split('T')[0],
        });
        console.log(`✅ Seeded 1 weekly award.`);
    }
}

async function seedPayslips(employees: UserProfile[]) {
     if (employees.length === 0) return;
    const payslips = employees.flatMap(emp => 
        Array.from({ length: 3 }, () => {
            const gross = faker.number.int({ min: 50000, max: 150000 });
            return {
                user_id: emp.id,
                month: faker.date.month(),
                year: new Date().getFullYear(),
                gross_salary: gross,
                net_salary: gross * 0.8,
                download_url: '#',
            };
        })
    );
    await supabaseAdmin.from('payslips').insert(payslips);
    console.log(`✅ Seeded ${payslips.length} payslips.`);
}

async function seedCompanyDocs() {
    const docs = [
        { title: 'Employee Handbook', description: 'Company policies and procedures.', category: 'HR', last_updated: new Date(), download_url: '#' },
        { title: 'IT Security Policy', description: 'Guidelines for using company IT assets.', category: 'IT', last_updated: new Date(), download_url: '#' },
        { title: 'Expense Claim Policy', description: 'How to claim expenses.', category: 'Finance', last_updated: new Date(), download_url: '#' },
    ];
    await supabaseAdmin.from('company_documents').insert(docs);
    console.log(`✅ Seeded ${docs.length} company documents.`);
}

async function seedExpenses(users: UserProfile[]) {
     if (users.length === 0) return;
    const reports = users.map(user => ({
        user_id: user.id,
        title: `Expenses for ${faker.commerce.department()}`,
        total_amount: faker.finance.amount(),
        status: faker.helpers.arrayElement(['draft', 'submitted', 'approved', 'rejected', 'reimbursed']),
        submitted_at: faker.date.recent({ days: 40 }),
    }));
    const { data: insertedReports } = await supabaseAdmin.from('expense_reports').insert(reports).select();
    
    if (insertedReports) {
        const items = insertedReports.map(report => ({
            expense_report_id: report.id,
            date: faker.date.recent({ days: 5 }),
            category: faker.helpers.arrayElement(['Travel', 'Meals', 'Software']),
            amount: report.total_amount,
            description: faker.lorem.sentence(),
        }));
        await supabaseAdmin.from('expense_items').insert(items);
    }
    console.log(`✅ Seeded ${reports.length} expense reports and items.`);
}

async function seedHelpdesk(users: UserProfile[]) {
    if (users.length === 0) return;
    const supportStaff = users.filter(u => ['it_admin', 'support'].includes(u.role));
    const tickets = Array.from({ length: 15 }, () => ({
        user_id: faker.helpers.arrayElement(users).id,
        subject: faker.hacker.phrase(),
        description: faker.lorem.paragraph(),
        category: faker.helpers.arrayElement(['IT', 'HR', 'Finance', 'General']),
        status: faker.helpers.arrayElement(['Open', 'In Progress', 'Resolved', 'Closed']),
        priority: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Urgent']),
        resolver_id: supportStaff.length > 0 ? faker.helpers.arrayElement(supportStaff).id : null,
    }));
    const { data: insertedTickets } = await supabaseAdmin.from('helpdesk_tickets').insert(tickets).select();

    if (insertedTickets) {
        const comments = insertedTickets.flatMap(ticket => 
            Array.from({ length: faker.number.int({ min: 0, max: 5})}, () => ({
                ticket_id: ticket.id,
                user_id: faker.helpers.arrayElement(users).id,
                comment: faker.lorem.sentence(),
            }))
        );
        if (comments.length > 0) {
            await supabaseAdmin.from('ticket_comments').insert(comments);
        }
    }
    console.log(`✅ Seeded ${tickets.length} helpdesk tickets and comments.`);
}


// Run the seeder
seed().catch(e => {
  console.error("🔴 Script failed with an unhandled error:", e);
  process.exit(1);
});
