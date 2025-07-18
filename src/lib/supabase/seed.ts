
'use server';

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import type { UserProfile, ApplicantStage, UserRole } from '../types';

// Use the public URL, but the service role key for admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Could not find NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables. Please ensure they are set in your .env.local file.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);


const CORE_USERS_DATA = [
    { email: 'john.admin@company.com', fullName: 'John Admin', role: 'admin', department: 'Executive' },
    { email: 'olivia.superhr@company.com', fullName: 'Olivia SuperHR', role: 'super_hr', department: 'HR' },
    { email: 'sarah.hr@company.com', fullName: 'Sarah HR', role: 'hr_manager', department: 'HR' },
    { email: 'mike.recruiter@company.com', fullName: 'Mike Recruiter', role: 'recruiter', department: 'HR' },
    { email: 'emily.manager@company.com', fullName: 'Emily Manager', role: 'manager', department: 'Engineering' },
    { email: 'david.teamlead@company.com', fullName: 'David TeamLead', role: 'team_lead', department: 'Engineering' },
    { email: 'lisa.employee@company.com', fullName: 'Lisa Employee', role: 'employee', department: 'Engineering' },
    { email: 'tom.intern@company.com', fullName: 'Tom Intern', role: 'intern', department: 'Engineering' },
    { email: 'rachel.finance@company.com', fullName: 'Rachel Finance', role: 'finance', department: 'Finance' },
    { email: 'james.it@company.com', fullName: 'James IT', role: 'it_admin', department: 'IT' },
    { email: 'alex.support@company.com', fullName: 'Alex Support', role: 'support', department: 'IT' },
    { email: 'noah.interviewer@company.com', fullName: 'Noah Interviewer', role: 'interviewer', department: 'Engineering' },
    { email: 'emma.auditor@company.com', fullName: 'Emma Auditor', role: 'auditor', department: 'Finance' },
];

async function createAndSeedUser({ email, fullName, role, department }: typeof CORE_USERS_DATA[0]): Promise<UserProfile | null> {
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'password123', // Set a default password
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            role: role,
            department: department,
            avatar_url: faker.image.avatar(),
        },
    });

    if (authError) {
        if (authError.message.includes('already been registered')) {
            console.warn(`🟡 User ${email} already exists in auth. Skipping creation.`);
        } else {
            console.error(`🔴 Error creating auth user ${email}: ${authError.message}`);
            return null;
        }
    }
    
    // Now get the user ID, either from the newly created user or by fetching the existing one
    const { data: { users: userList }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ email });

    if (listError || !userList || userList.length === 0) {
        console.error(`🔴 Could not find user ${email} in auth after creation/check. Error: ${listError?.message}`);
        return null;
    }
    
    const user = userList[0];

    if (!user) {
        console.error(`🔴 Could not find user ${email} in auth after creation/check.`);
        return null;
    }

    // 2. Upsert the public user profile. This will create it if it doesn't exist, or update it if it does.
    // This is safer than just inserting.
    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
            id: user.id,
            full_name: fullName,
            email: email,
            role: role,
            department: department,
            avatar_url: user.user_metadata.avatar_url,
            profile_setup_complete: true,
        })
        .select()
        .single();
    
    if (profileError) {
        console.error(`🔴 Error creating profile for ${email}: ${profileError.message}`);
        return null;
    }

    return profileData as UserProfile;
}


// Tables to clean, in order of dependency (dependents first).
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

  // Check for the FORCE_DB_SEED environment variable
  if (process.env.FORCE_DB_SEED === 'true') {
      console.log('🧹 FORCE_DB_SEED is true. Cleaning up old data from application tables...');
      for (const table of tablesToClean) {
        const { error: deleteError } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all
        if (deleteError) {
            if (!deleteError.message.includes('does not exist')) {
                console.warn(`🟡 Could not clean table ${table}: ${deleteError.message}`);
            }
        }
      }
      console.log('✅ Finished cleaning tables.');
  } else {
      console.log('ℹ️ FORCE_DB_SEED not set. Skipping table cleanup.');
  }
  
  // 1. Seed or verify all core users
  console.log('👤 Ensuring core users exist...');
  const users: UserProfile[] = [];
  for (const userData of CORE_USERS_DATA) {
      const user = await createAndSeedUser(userData);
      if (user) {
          users.push(user);
      }
  }
  console.log(`✅ Finished seeding/verifying ${users.length} core users.`);

  if (users.length === 0) {
      console.error('🔴 Could not fetch users after seeding, or no users found. Aborting rest of seed.');
      return;
  }

  // 2. Seed all other tables
  console.log('🚀 Starting data generation...');
  try {
    const managers = users.filter(u => u.role === 'manager' || u.role === 'team_lead' || u.role === 'super_hr');
    const employees = users.filter(u => u.role === 'employee' || u.role === 'intern');
    
    const jobs = await seedJobs();
    const colleges = await seedColleges();
    const applicants = await seedApplicants(jobs, colleges);
    
    await seedApplicantNotes(applicants, users);
    await seedInterviews(applicants, users.filter(u => u.role === 'interviewer' || u.role === 'manager'));
    
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
  const { data, error } = await supabaseAdmin.from('jobs').insert(jobs).select();
  if (error) throw new Error(`Failed to seed jobs: ${error.message}`);
  console.log(`✅ Seeded ${data.length} jobs.`);
  return data;
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
    const { data, error } = await supabaseAdmin.from('colleges').insert(colleges).select();
    if (error) throw new Error(`Failed to seed colleges: ${error.message}`);
    console.log(`✅ Seeded ${data.length} colleges.`);
    return data;
}

async function seedApplicants(jobs: {id: string}[], colleges: {id: string}[]) {
    if (!jobs?.length || !colleges?.length) {
        console.warn('🟡 Skipping applicant seeding because no jobs or colleges were provided.');
        return [];
    }
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
    const { data, error } = await supabaseAdmin.from('applicants').insert(applicants).select('id, name, email');
    if (error) throw new Error(`Failed to seed applicants: ${error.message}`);
    console.log(`✅ Seeded ${data.length} applicants.`);
    return data;
}

async function seedApplicantNotes(applicants: {id: string}[], users: UserProfile[]) {
    if (!users?.length || !applicants?.length) return;
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
    if (!applicants?.length || !interviewers?.length) return;
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
            candidate_avatar: faker.image.avatar(),
            interviewer_name: interviewer.full_name,
            interviewer_avatar: interviewer.avatar_url,
            job_title: faker.person.jobTitle(),
        };
    });
    await supabaseAdmin.from('interviews').insert(interviews);
    console.log(`✅ Seeded ${interviews.length} interviews.`);
}

async function seedLeaveBalancesAndLeave(users: UserProfile[], managers: UserProfile[]) {
    if (!users?.length) return;
    const balances = users.map(user => ({
        user_id: user.id,
        sick_leave: 12,
        casual_leave: 15,
        earned_leave: 10,
        unpaid_leave: faker.number.int({ min: 0, max: 5 }),
    }));
    await supabaseAdmin.from('leave_balances').insert(balances);
    console.log(`✅ Seeded ${balances.length} leave balances.`);
    
    if (!managers?.length) {
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
    if (!employees?.length || !managers?.length) return;
    const workflows = employees.slice(0, 5).map(employee => {
        const buddy = faker.helpers.arrayElement(employees.filter(e => e.id !== employee.id));
        return {
            user_id: employee.id,
            manager_id: faker.helpers.arrayElement(managers).id,
            buddy_id: buddy ? buddy.id : null,
            employee_name: employee.full_name,
            employee_avatar: employee.avatar_url,
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
    if (!employees?.length) return;
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
    if (!users?.length) return;
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
     if (!users?.length) return;
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
     if (!employees?.length) return;
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
     if (!users?.length) return;
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
        console.log(`✅ Seeded ${reports.length} expense reports and items.`);
    }
}

async function seedHelpdesk(users: UserProfile[]) {
    if (!users?.length) return;
    const supportStaff = users.filter(u => u.role === 'it_admin' || u.role === 'support');
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
