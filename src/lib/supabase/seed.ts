
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

// Function to create a user, both in auth and in the public table
async function createAndSeedUser(userData: Partial<UserProfile>): Promise<UserProfile | null> {
    const email = userData.email!;
    const password = 'password123';
    
    // Step 1: Check if the user exists in auth and create if not.
    let { data: { users: existingAuthUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ email });
    let authUser = existingAuthUsers && existingAuthUsers.length > 0 ? existingAuthUsers[0] : null;

    if (!authUser) {
      const { data, error: creationError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: userData.full_name || faker.person.fullName(),
            avatar_url: userData.avatar_url || faker.image.avatar(),
        },
      });

      if (creationError) {
        console.error(`🔴 Error creating auth user ${email}:`, creationError.message);
        return null;
      }
      authUser = data.user;
    }

    if (!authUser) {
        console.error(`🔴 Auth user for ${email} could not be found or created.`);
        return null;
    }
    
    // Step 2: Check if the user profile exists in public.users and create if not.
    let { data: publicProfile, error: profileSelectError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
    
    if (!publicProfile) {
        const { data: newProfile, error: profileInsertError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authUser.id,
                full_name: authUser.user_metadata.full_name,
                email,
                avatar_url: authUser.user_metadata.avatar_url,
                department: userData.department || faker.commerce.department(),
                role: userData.role || 'employee',
                phone: faker.phone.number(),
                profile_setup_complete: true,
            })
            .select()
            .single();

        if (profileInsertError) {
            console.error(`🔴 Error creating public profile for ${email}:`, profileInsertError.message);
            return null;
        }
        publicProfile = newProfile;
    }

    return publicProfile;
}

const seedUsersConfig = [
    { role: 'admin', email: 'john.admin@company.com', full_name: 'John Admin' },
    { role: 'super_hr', email: 'olivia.superhr@company.com', full_name: 'Olivia SuperHR' },
    { role: 'hr_manager', email: 'sarah.hr@company.com', full_name: 'Sarah HR' },
    { role: 'recruiter', email: 'mike.recruiter@company.com', full_name: 'Mike Recruiter' },
    { role: 'manager', email: 'emily.manager@company.com', full_name: 'Emily Manager', department: 'Engineering' },
    { role: 'team_lead', email: 'david.teamlead@company.com', full_name: 'David TeamLead', department: 'Engineering' },
    { role: 'employee', email: 'lisa.employee@company.com', full_name: 'Lisa Employee', department: 'Engineering' },
    { role: 'intern', email: 'tom.intern@company.com', full_name: 'Tom Intern', department: 'Engineering' },
    { role: 'finance', email: 'rachel.finance@company.com', full_name: 'Rachel Finance' },
    { role: 'it_admin', email: 'james.it@company.com', full_name: 'James IT' },
    { role: 'support', email: 'alex.support@company.com', full_name: 'Alex Support' },
    { role: 'interviewer', email: 'noah.interviewer@company.com', full_name: 'Noah Interviewer' },
    { role: 'auditor', email: 'emma.auditor@company.com', full_name: 'Emma Auditor' },
];


// Tables to clean, in order of dependency (dependents first).
// USERS TABLE IS EXCLUDED FROM AUTOMATIC CLEANING.
const tablesToClean = [
    'ticket_comments', 'helpdesk_tickets', 'expense_items', 'expense_reports',
    'company_documents', 'payslips', 'weekly_awards', 'kudos', 'post_comments',
    'company_posts', 'key_results', 'objectives', 'performance_reviews', 'onboarding_workflows',
    'leaves', 'leave_balances', 'interviews', 'applicant_notes', 'applicants', 'colleges', 'jobs'
];

async function seed() {
  console.log('🌱 Starting full database seed process...');
  
  if (!supabaseAdmin) {
    console.error('🔴 Supabase admin client is not initialized. Aborting.');
    return;
  }
  console.log('✅ Supabase admin client initialized.');

  // 1. Clean up existing data from all other tables if FORCE_DB_SEED is set
  if (process.env.FORCE_DB_SEED === 'true') {
    console.log('🧹 FORCE_DB_SEED is true. Cleaning up old data from application tables...');
    for (const table of tablesToClean) {
        const { error: deleteError } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError && !deleteError.message.includes('does not exist')) {
            console.warn(`🟡 Could not clean table ${table}: ${deleteError.message}`);
        }
    }
    console.log('✅ Finished cleaning tables.');
  } else {
    console.log('ℹ️ FORCE_DB_SEED not set. Skipping table cleanup.');
  }

  // 2. Ensure core users exist
  console.log('👤 Ensuring core users exist...');
  const seededUsers: UserProfile[] = [];
  for (const userConfig of seedUsersConfig) {
      const user = await createAndSeedUser(userConfig);
      if (user) {
          seededUsers.push(user);
      }
  }
  console.log(`✅ Finished seeding/verifying ${seededUsers.length} core users.`);
  
  // 3. Fetch all users to work with (including any that already existed)
  const { data: allUsers, error: usersError } = await supabaseAdmin.from('users').select('*');
  if (usersError || !allUsers || allUsers.length === 0) {
    console.error('🔴 Could not fetch users after seeding, or no users found. Aborting rest of seed.', usersError?.message);
    return;
  }
  
  // 4. Seed all other tables
  console.log('🚀 Starting data generation...');
  try {
    const managers = allUsers.filter(u => ['manager', 'team_lead', 'super_hr'].includes(u.role));
    const employees = allUsers.filter(u => ['employee', 'intern'].includes(u.role));
    
    await seedJobs();
    const { data: jobs } = await supabaseAdmin.from('jobs').select('id');
    
    await seedColleges();
    const { data: colleges } = await supabaseAdmin.from('colleges').select('id');

    if (jobs && jobs.length > 0 && colleges && colleges.length > 0) {
      await seedApplicants(jobs, colleges);
      const { data: applicants } = await supabaseAdmin.from('applicants').select('id, name, email');
      if (applicants && applicants.length > 0) {
         await seedApplicantNotes(applicants, allUsers);
         const interviewers = allUsers.filter(u => ['interviewer', 'manager', 'hr_manager', 'recruiter'].includes(u.role));
         if (interviewers.length > 0) {
            await seedInterviews(applicants, interviewers);
         }
      }
    }
    
    await seedLeaveBalancesAndLeave(allUsers, managers);
    await seedOnboarding(employees, managers);
    await seedPerformanceReviews(employees);
    await seedOkrs(allUsers);
    await seedCompanyFeed(allUsers);
    await seedKudos(allUsers);
    await seedWeeklyAward(managers, employees);
    await seedPayslips(employees);
    await seedCompanyDocs();
    await seedExpenses(allUsers);
    await seedHelpdesk(allUsers);

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
    if (!users || users.length === 0) return;
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
    await supabaseAdmin.from('leave_balances').upsert(balances, { onConflict: 'user_id' });
    console.log(`✅ Seeded ${balances.length} leave balances.`);
    
    if (managers.length === 0) {
        console.warn("🟡 No managers found, skipping leave request seeding.");
        return;
    };
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
            category: 'General',
            amount: report.total_amount,
            description: faker.lorem.sentence(),
        }));
        await supabaseAdmin.from('expense_items').insert(items);
        console.log(`✅ Seeded ${reports.length} expense reports and items.`);
    }
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
            console.log(`✅ Seeded ${tickets.length} helpdesk tickets and comments.`);
        }
    }
}


// Run the seeder
seed().catch(e => {
  console.error("🔴 Script failed with an unhandled error:", e);
  process.exit(1);
});
