

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { faker } from '@faker-js/faker';
import type { UserRole, Job, Applicant, College, Leave, LeaveBalance, Onboarding, PerformanceReview, Kudo, Payslip, CompanyDocument, Objective, KeyResult, ExpenseReport, ExpenseItem, HelpdeskTicket, CompanyPost, PostComment } from '@/lib/types';
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
    'post_comments', 'helpdesk_tickets', 'expense_reports', 'objectives', 'company_documents', 'payslips',
    'weekly_awards', 'kudos', 'company_posts', 'interviews', 'applicant_notes',
    'applicants', 'colleges', 'jobs', 'onboarding_workflows', 'leaves', 'leave_balances'
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
    { email: 'manager@hrplus.com', role: 'manager', fullName: 'Manager Mike', department: 'Engineering' },
    { email: 'team_lead@hrplus.com', role: 'team_lead', fullName: 'Team Lead Tina', department: 'Engineering' },
    { email: 'interviewer@hrplus.com', role: 'interviewer', fullName: 'Interviewer Ingrid', department: 'Engineering' },
    { email: 'employee@hrplus.com', role: 'employee', fullName: 'Employee Eric', department: 'Engineering' },
    { email: 'intern@hrplus.com', role: 'intern', fullName: 'Intern Ian', department: 'Engineering' },
  ];

  console.log('👤 Creating one user for each role with password "password"...');
  const createdUserIds: { [key: string]: string } = {};
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
      createdUserIds[userData.role] = data.user.id;
      console.log(`✅ Successfully created user: ${data.user?.email}`);
    }
  }

  const allUserIds = Object.values(createdUserIds);

  // --- 4. SEED APPLICATION DATA ---

  // Leave Balances
  console.log('🌱 Seeding Leave Balances...');
  const leaveBalances = allUserIds.map(id => ({
      user_id: id,
      sick_leave: 12,
      casual_leave: 12,
      earned_leave: 15,
      unpaid_leave: 0,
  }));
  await supabaseAdmin.from('leave_balances').insert(leaveBalances);

  // Leaves
  console.log('🌱 Seeding Leaves...');
  const leaves: Omit<Leave, 'id' | 'users'>[] = [];
  for (const userId of allUserIds) {
      for(let i=0; i<3; i++) {
        leaves.push({
            user_id: userId,
            leave_type: faker.helpers.arrayElement(['sick', 'casual', 'earned']),
            start_date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
            end_date: faker.date.recent({ days: 5 }).toISOString().split('T')[0],
            reason: faker.lorem.sentence(),
            status: faker.helpers.arrayElement(['approved', 'rejected']),
            approver_id: createdUserIds['manager'],
            created_at: faker.date.past({ years: 1 }).toISOString(),
            total_days: faker.number.int({ min: 1, max: 3 }),
        });
      }
  }
  await supabaseAdmin.from('leaves').insert(leaves);
  

  // Jobs
  console.log('🌱 Seeding Jobs...');
  const jobs: Omit<Job, 'id'>[] = [];
  for (const dept of departments) {
      for (const title of jobTitlesByDept[dept]) {
          jobs.push({
              title,
              department: dept,
              description: faker.lorem.paragraphs(3),
              status: 'Open',
              posted_date: faker.date.past({ years: 1 }).toISOString(),
              applicants: 0,
          });
      }
  }
  const { data: createdJobs } = await supabaseAdmin.from('jobs').insert(jobs).select();

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


  // Applicants
  console.log('🌱 Seeding Applicants...');
  const applicants: Omit<Applicant, 'id' | 'jobs'>[] = [];
  for (let i = 0; i < 150; i++) {
    const job = faker.helpers.arrayElement(createdJobs || []);
    const college = faker.helpers.arrayElement(createdColleges || []);
    const resume_data: ProcessResumeOutput = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        links: [faker.internet.url()],
        skills: faker.helpers.arrayElements(['React', 'Node.js', 'PostgreSQL', 'Communication', 'Teamwork', 'Project Management'], { min: 3, max: 5 }),
        experience: [{ jobTitle: 'Previous Role', company: faker.company.name(), duration: '2020-2022' }],
        education: [{ institution: college.name, degree: 'B.Tech', year: '2020' }],
        fullText: faker.lorem.paragraphs(5),
    };

    applicants.push({
      name: resume_data.fullName,
      email: resume_data.email,
      phone: resume_data.phone,
      job_id: job.id,
      stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected']),
      applied_date: faker.date.past({ years: 1 }).toISOString(),
      avatar: faker.image.avatar(),
      source: faker.helpers.arrayElement(['walk-in', 'college', 'email', 'manual']),
      college_id: college.id,
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
  await supabaseAdmin.from('applicants').insert(applicants);

   // Helpdesk Tickets
   console.log('🌱 Seeding Helpdesk Tickets...');
   const tickets: Omit<HelpdeskTicket, 'id' | 'users' | 'ticket_comments'>[] = [];
   for (const userId of allUserIds) {
    for (let i=0; i<2; i++) {
        tickets.push({
            user_id: userId,
            subject: faker.lorem.sentence(),
            description: faker.lorem.paragraph(),
            category: faker.helpers.arrayElement(['IT', 'HR', 'Finance']),
            status: faker.helpers.arrayElement(['Open', 'In Progress', 'Resolved']),
            priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
            created_at: faker.date.past({ years: 1 }).toISOString(),
            updated_at: faker.date.recent().toISOString(),
        })
    }
   }
   await supabaseAdmin.from('helpdesk_tickets').insert(tickets);


  // Onboarding
  console.log('🌱 Seeding Onboarding...');
  const onboarding: Omit<Onboarding, 'id'>[] = allUserIds.slice(0, 5).map(id => {
      const user = usersToCreate.find(u => createdUserIds[u.role] === id);
      return {
        user_id: id,
        manager_id: createdUserIds['manager'],
        buddy_id: createdUserIds['employee'],
        employee_name: user?.fullName || 'New Hire',
        employee_avatar: faker.image.avatar(),
        job_title: user?.department || 'N/A',
        manager_name: usersToCreate.find(u=>u.role==='manager')?.fullName || 'Manager',
        buddy_name: usersToCreate.find(u=>u.role==='employee')?.fullName || 'Buddy',
        progress: faker.number.int({ min: 10, max: 100 }),
        current_step: faker.helpers.arrayElement(['Documentation', 'Team Intro', 'Training']),
        start_date: faker.date.past({ months: 3 }).toISOString(),
      }
  });
  await supabaseAdmin.from('onboarding_workflows').insert(onboarding);

  // Company Posts
  console.log('🌱 Seeding Company Posts & Comments...');
  const companyPosts: Omit<CompanyPost, 'id' | 'users' | 'post_comments'>[] = [];
  for (let i = 0; i < 10; i++) {
    companyPosts.push({
        user_id: createdUserIds['hr_manager'],
        content: faker.lorem.paragraph(),
        image_url: faker.helpers.arrayElement([faker.image.urlLoremFlickr({ category: 'business' }), null]),
        created_at: faker.date.past({ years: 1 }).toISOString(),
    });
  }
  const { data: createdPosts } = await supabaseAdmin.from('company_posts').insert(companyPosts).select();

  if (createdPosts) {
      const comments: Omit<PostComment, 'id' | 'users'>[] = [];
      for (const post of createdPosts) {
        for (let i = 0; i < faker.number.int({min: 0, max: 8}); i++) {
            comments.push({
                post_id: post.id,
                user_id: faker.helpers.arrayElement(allUserIds),
                comment: faker.lorem.sentence(),
                created_at: faker.date.between({ from: post.created_at, to: new Date() }).toISOString()
            });
        }
      }
      await supabaseAdmin.from('post_comments').insert(comments);
  }


  // Kudos
  console.log('🌱 Seeding Kudos...');
  const kudos: Omit<Kudo, 'id' | 'users_from' | 'users_to'>[] = [];
  for(let i=0; i<30; i++) {
    kudos.push({
        from_user_id: faker.helpers.arrayElement(allUserIds),
        to_user_id: faker.helpers.arrayElement(allUserIds),
        value: faker.helpers.arrayElement(['Team Player', 'Innovation', 'Customer First']),
        message: faker.lorem.sentence(),
        created_at: faker.date.past({ years: 1 }).toISOString(),
    })
  }
  await supabaseAdmin.from('kudos').insert(kudos);
  
  // Company Documents
  console.log('🌱 Seeding Company Documents...');
  const documents: Omit<CompanyDocument, 'id'>[] = [
    { title: 'Employee Handbook', description: 'Company policies and procedures', category: 'HR', last_updated: new Date().toISOString(), download_url: '#' },
    { title: 'Code of Conduct', description: 'Ethical guidelines and standards', category: 'HR', last_updated: new Date().toISOString(), download_url: '#' },
    { title: 'IT Security Policy', description: 'Guidelines for using company IT resources', category: 'IT', last_updated: new Date().toISOString(), download_url: '#' },
  ];
  await supabaseAdmin.from('company_documents').insert(documents);


  console.log('✅ Database seeding process completed.');
}

main().catch(error => {
    console.error('🔴 Seeding failed:', error);
    process.exit(1);
});
