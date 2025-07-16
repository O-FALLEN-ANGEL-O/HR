
'use server';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import type { UserProfile, Job, ApplicantStage, College, Leave, Interview } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is missing from environment variables.');
}

// This is the admin client, created once and reused.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Main seeding function
async function seed() {
  console.log('🌱 Starting full database seed process...');

  if (!supabaseAdmin) {
    console.error('🔴 Supabase admin client is not initialized. Aborting.');
    return;
  }
  console.log('✅ Supabase admin client initialized.');

  // 1. Fetch existing users to use for relationships
  console.log('👤 Fetching existing users...');
  const { data: users, error: userError } = await supabaseAdmin
    .from('users')
    .select('*');

  if (userError || !users || users.length === 0) {
    console.error('🔴 Could not fetch users, or no users found. Please ensure users are created before running the full seed. Aborting.', userError);
    return;
  }
  console.log(`✅ Found ${users.length} users to work with.`);

  // 2. Clean up existing data in all other tables
  console.log('🧹 Cleaning up old data...');
  const tablesToClean = [
      'ticket_comments', 'helpdesk_tickets', 'expense_items', 'expense_reports',
      'company_documents', 'payslips', 'weekly_awards', 'kudos', 'post_comments',
      'company_posts', 'key_results', 'objectives', 'performance_reviews', 'onboarding_workflows',
      'leaves', 'leave_balances', 'interviews', 'applicant_notes', 'applicants', 'colleges', 'jobs'
  ];

  for (const table of tablesToClean) {
    const { error: deleteError } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // A condition to delete all rows
    if (deleteError) {
      console.warn(`🟡 Could not clean table ${table}: ${deleteError.message}`);
    }
  }
  console.log('✅ Finished cleaning tables.');

  // 3. Seed all tables
  console.log('🚀 Starting data generation...');
  try {
    const managers = users.filter(u => ['manager', 'team_lead', 'super_hr'].includes(u.role));
    const employees = users.filter(u => ['employee', 'intern'].includes(u.role));
    
    await seedJobs();
    const { data: jobs } = await supabaseAdmin.from('jobs').select('id');
    
    await seedColleges();
    const { data: colleges } = await supabaseAdmin.from('colleges').select('id');

    if (jobs && colleges) {
      await seedApplicants(jobs, colleges);
      const { data: applicants } = await supabaseAdmin.from('applicants').select('id, name, email');
      if (applicants) {
         await seedApplicantNotes(applicants, users);
         await seedInterviews(applicants, users.filter(u => u.role === 'interviewer' || u.role === 'manager'));
      }
    }
    
    await seedLeaveBalancesAndLeave(users, managers);
    await seedOnboarding(employees, managers);
    await seedPerformanceReviews(employees);
    await seedOkrs(users);
    await seedCompanyFeed(users);
    await seedKudos(users);
    await seedWeeklyAward(managers, employees);
    await seedPayslips(employees);
    await seedCompanyDocs();
    await seedExpenses(users);
    await seedHelpdesk(users);

    console.log('\n🎉 Full database seed process complete!');
  } catch (e: any) {
    console.error('🔴 A critical error occurred during seeding:', e.message);
    console.error(e.stack);
  }
}

// Seeder Functions
async function seedJobs() {
  const jobCount = 15;
  const jobs = [];
  for (let i = 0; i < jobCount; i++) {
    jobs.push({
      title: faker.person.jobTitle(),
      department: faker.person.jobArea(),
      description: faker.lorem.paragraphs(3),
      status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold']),
      posted_date: faker.date.past({ years: 1 }),
      applicants: faker.number.int({ min: 5, max: 100 }),
    });
  }
  await supabaseAdmin.from('jobs').insert(jobs);
  console.log(`✅ Seeded ${jobCount} jobs.`);
}

async function seedColleges() {
    const collegeCount = 10;
    const colleges = [];
    for (let i = 0; i < collegeCount; i++) {
        colleges.push({
            name: `${faker.location.city()} University`,
            status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended', 'Declined']),
            resumes_received: faker.number.int({ min: 20, max: 200 }),
            contact_email: faker.internet.email(),
            last_contacted: faker.date.recent({ days: 30 })
        });
    }
    await supabaseAdmin.from('colleges').insert(colleges);
    console.log(`✅ Seeded ${collegeCount} colleges.`);
}

async function seedApplicants(jobs: {id: string}[], colleges: {id: string}[]) {
    const applicantCount = 50;
    const applicants = [];
    const stages: ApplicantStage[] = ['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'];
    for (let i = 0; i < applicantCount; i++) {
        const name = faker.person.fullName();
        applicants.push({
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
        });
    }
    await supabaseAdmin.from('applicants').insert(applicants);
    console.log(`✅ Seeded ${applicantCount} applicants.`);
}

async function seedApplicantNotes(applicants: {id: string}[], users: UserProfile[]) {
    const notes = [];
    for (const applicant of applicants) {
        const noteCount = faker.number.int({ min: 0, max: 4 });
        for(let i=0; i<noteCount; i++) {
            const author = faker.helpers.arrayElement(users);
            notes.push({
                applicant_id: applicant.id,
                user_id: author.id,
                author_name: author.full_name,
                author_avatar: author.avatar_url,
                note: faker.hacker.phrase(),
            });
        }
    }
    await supabaseAdmin.from('applicant_notes').insert(notes);
    console.log(`✅ Seeded ${notes.length} applicant notes.`);
}

async function seedInterviews(applicants: {id: string, name: string}[], interviewers: UserProfile[]) {
    const interviews = [];
    for(const applicant of applicants) {
        const interviewer = faker.helpers.arrayElement(interviewers);
        interviews.push({
            applicant_id: applicant.id,
            interviewer_id: interviewer.id,
            date: faker.date.future({ years: 0.1 }),
            time: `${faker.number.int({min: 9, max: 17})}:00`,
            type: faker.helpers.arrayElement(['Video', 'Phone', 'In-person']),
            status: 'Scheduled',
            candidate_name: applicant.name,
            interviewer_name: interviewer.full_name,
            job_title: faker.person.jobTitle(),
        });
    }
    await supabaseAdmin.from('interviews').insert(interviews);
    console.log(`✅ Seeded ${interviews.length} interviews.`);
}

async function seedLeaveBalancesAndLeave(users: UserProfile[], managers: UserProfile[]) {
    const balances = users.map(user => ({
        user_id: user.id,
        sick_leave: 12,
        casual_leave: 15,
        earned_leave: 10,
        unpaid_leave: faker.number.int({ min: 0, max: 5 }),
    }));
    await supabaseAdmin.from('leave_balances').insert(balances);
    console.log(`✅ Seeded ${balances.length} leave balances.`);
    
    const leaves = [];
    for(const user of users) {
        const leaveCount = faker.number.int({ min: 1, max: 5 });
        for(let i=0; i<leaveCount; i++) {
            const startDate = faker.date.past({ years: 1 });
            const endDate = new Date(startDate.getTime() + faker.number.int({ min: 1, max: 5 }) * 24 * 60 * 60 * 1000);
            leaves.push({
                user_id: user.id,
                leave_type: faker.helpers.arrayElement(['sick', 'casual', 'earned']),
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                reason: faker.lorem.sentence(),
                status: faker.helpers.arrayElement(['approved', 'rejected', 'pending']),
                approver_id: faker.helpers.arrayElement(managers).id,
                total_days: (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1,
            })
        }
    }
    await supabaseAdmin.from('leaves').insert(leaves);
    console.log(`✅ Seeded ${leaves.length} leave records.`);
}

async function seedOnboarding(employees: UserProfile[], managers: UserProfile[]) {
    const workflows = [];
    for (const employee of employees.slice(0, 5)) { // Onboard first 5
        workflows.push({
            user_id: employee.id,
            manager_id: faker.helpers.arrayElement(managers).id,
            buddy_id: faker.helpers.arrayElement(employees.filter(e => e.id !== employee.id)).id,
            employee_name: employee.full_name,
            job_title: faker.person.jobTitle(),
            manager_name: faker.person.fullName(),
            buddy_name: faker.person.fullName(),
            progress: faker.number.int({ min: 10, max: 100 }),
            current_step: faker.helpers.arrayElement(['IT Setup', 'Documentation', 'Team Intro']),
            start_date: faker.date.recent({ days: 20 }),
        });
    }
    await supabaseAdmin.from('onboarding_workflows').insert(workflows);
    console.log(`✅ Seeded ${workflows.length} onboarding workflows.`);
}

async function seedPerformanceReviews(employees: UserProfile[]) {
    const reviews = [];
    for (const employee of employees) {
        reviews.push({
            user_id: employee.id,
            review_date: faker.date.past({ years: 1 }),
            status: faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed']),
            job_title: employee.department
        })
    }
    await supabaseAdmin.from('performance_reviews').insert(reviews);
    console.log(`✅ Seeded ${reviews.length} performance reviews.`);
}

async function seedOkrs(users: UserProfile[]) {
    const objectives = [];
    for (let i = 0; i < 5; i++) {
        objectives.push({
            owner_id: faker.helpers.arrayElement(users).id,
            title: faker.company.catchPhrase(),
            quarter: `Q${faker.number.int({min: 1, max: 4})} ${new Date().getFullYear()}`,
        });
    }
    const { data: insertedObjectives } = await supabaseAdmin.from('objectives').insert(objectives).select();

    if (insertedObjectives) {
        const keyResults = [];
        for (const obj of insertedObjectives) {
            for (let i = 0; i < 3; i++) {
                keyResults.push({
                    objective_id: obj.id,
                    description: faker.lorem.sentence(),
                    progress: faker.number.int({ min: 0, max: 100 }),
                    status: faker.helpers.arrayElement(['on_track', 'at_risk', 'off_track']),
                });
            }
        }
        await supabaseAdmin.from('key_results').insert(keyResults);
    }
    console.log(`✅ Seeded ${objectives.length} OKRs.`);
}

async function seedCompanyFeed(users: UserProfile[]) {
    const posts = [];
    for (let i = 0; i < 10; i++) {
        posts.push({
            user_id: faker.helpers.arrayElement(users).id,
            content: faker.lorem.paragraph(),
            image_url: faker.datatype.boolean() ? faker.image.urlLoremFlickr({ category: 'business' }) : null,
        });
    }
    const { data: insertedPosts } = await supabaseAdmin.from('company_posts').insert(posts).select();

    if (insertedPosts) {
        const comments = [];
        for (const post of insertedPosts) {
            for (let i = 0; i < faker.number.int({ min: 0, max: 8}); i++) {
                comments.push({
                    post_id: post.id,
                    user_id: faker.helpers.arrayElement(users).id,
                    comment: faker.lorem.sentence(),
                });
            }
        }
        await supabaseAdmin.from('post_comments').insert(comments);
    }
    console.log(`✅ Seeded ${posts.length} company posts and comments.`);
}

async function seedKudos(users: UserProfile[]) {
    const kudos = [];
    for (let i=0; i<20; i++) {
        const fromUser = faker.helpers.arrayElement(users);
        const toUser = faker.helpers.arrayElement(users.filter(u => u.id !== fromUser.id));
        kudos.push({
            from_user_id: fromUser.id,
            to_user_id: toUser.id,
            value: faker.helpers.arrayElement(['Team Player', 'Innovation', 'Customer First', 'Ownership']),
            message: faker.lorem.sentence(),
        });
    }
    await supabaseAdmin.from('kudos').insert(kudos);
    console.log(`✅ Seeded ${kudos.length} kudos.`);
}

async function seedWeeklyAward(managers: UserProfile[], employees: UserProfile[]) {
    if (managers.length > 0 && employees.length > 0) {
        const award = {
            awarded_user_id: faker.helpers.arrayElement(employees).id,
            awarded_by_user_id: faker.helpers.arrayElement(managers).id,
            reason: 'For outstanding performance and dedication this week.',
            week_of: new Date().toISOString().split('T')[0],
        };
        await supabaseAdmin.from('weekly_awards').insert(award);
        console.log(`✅ Seeded 1 weekly award.`);
    }
}

async function seedPayslips(employees: UserProfile[]) {
    const payslips = [];
    for(const emp of employees) {
        for(let i=0; i<3; i++) {
            const gross = faker.number.int({ min: 50000, max: 150000 });
            payslips.push({
                user_id: emp.id,
                month: faker.date.month(),
                year: new Date().getFullYear(),
                gross_salary: gross,
                net_salary: gross * 0.8,
                download_url: '#',
            });
        }
    }
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
    const reports = [];
    for(const user of users) {
        reports.push({
            user_id: user.id,
            title: `Expenses for ${faker.commerce.department()}`,
            total_amount: faker.finance.amount(),
            status: faker.helpers.arrayElement(['draft', 'submitted', 'approved', 'rejected', 'reimbursed']),
            submitted_at: faker.date.recent({ days: 40 }),
        });
    }
    const { data: insertedReports } = await supabaseAdmin.from('expense_reports').insert(reports).select();
    
    if (insertedReports) {
        const items = [];
        for (const report of insertedReports) {
            items.push({
                expense_report_id: report.id,
                date: faker.date.recent({ days: 5 }),
                category: faker.helpers.arrayElement(['Travel', 'Meals', 'Software']),
                amount: report.total_amount,
                description: faker.lorem.sentence(),
            });
        }
        await supabaseAdmin.from('expense_items').insert(items);
    }
    console.log(`✅ Seeded ${reports.length} expense reports.`);
}

async function seedHelpdesk(users: UserProfile[]) {
    const tickets = [];
    const supportStaff = users.filter(u => ['it_admin', 'support'].includes(u.role));
    for (let i=0; i<15; i++) {
        tickets.push({
            user_id: faker.helpers.arrayElement(users).id,
            subject: faker.hacker.phrase(),
            description: faker.lorem.paragraph(),
            category: faker.helpers.arrayElement(['IT', 'HR', 'Finance', 'General']),
            status: faker.helpers.arrayElement(['Open', 'In Progress', 'Resolved', 'Closed']),
            priority: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Urgent']),
            resolver_id: supportStaff.length > 0 ? faker.helpers.arrayElement(supportStaff).id : null,
        });
    }
    const { data: insertedTickets } = await supabaseAdmin.from('helpdesk_tickets').insert(tickets).select();

    if (insertedTickets) {
        const comments = [];
        for (const ticket of insertedTickets) {
            for (let i = 0; i < faker.number.int({ min: 0, max: 5}); i++) {
                comments.push({
                    ticket_id: ticket.id,
                    user_id: faker.helpers.arrayElement(users).id,
                    comment: faker.lorem.sentence(),
                });
            }
        }
        await supabaseAdmin.from('ticket_comments').insert(comments);
    }
    console.log(`✅ Seeded ${tickets.length} helpdesk tickets.`);
}


// Run the seeder
seed().catch(e => {
  console.error("🔴 Script failed with an unhandled error:", e);
  process.exit(1);
});
