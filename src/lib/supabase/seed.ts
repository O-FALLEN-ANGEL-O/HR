
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { faker } from '@faker-js/faker';

// Configure dotenv to load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const departments = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Human Resources', 'Finance', 'IT'];

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

  // --- 1. Clean up existing auth users first ---
  console.log('🧹 Deleting existing auth users...');
  const { data: { users: existingUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error('🔴 Error listing users:', listError.message);
  } else if (existingUsers.length > 0) {
    console.log(`Found ${existingUsers.length} auth users to delete...`);
    for (const user of existingUsers) {
      await supabaseAdmin.auth.admin.deleteUser(user.id, true);
    }
    console.log(`✅ Deleted ${existingUsers.length} auth users.`);
  } else {
    console.log('✅ No existing auth users to delete.');
  }

  // --- 2. Clean up public tables ---
  console.log('🧹 Cleaning up public table data...');
   const tablesToClean = [
      'ticket_comments', 'helpdesk_tickets', 'expense_items', 'expense_reports', 'company_documents', 'payslips',
      'weekly_awards', 'kudos', 'post_comments', 'company_posts', 'key_results', 'objectives', 'onboarding_workflows',
      'leaves', 'leave_balances', 'interviews', 'applicant_notes', 'applicants', 'colleges', 'jobs', 'users'
   ];
  
  for (const table of tablesToClean) {
      const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        if (error.message.includes('relation "public.performance_reviews" does not exist')) {
            console.warn(`🟠 Skipping non-existent table: ${table}`);
        } else {
            console.warn(`🟠 Could not clean table ${table}:`, error.message);
        }
      } else {
          console.log(`- Cleaned ${table}`);
      }
  }


  // --- 3. Create users and employees ---
  const usersToCreate: { email: string; role: string; fullName: string, department: string }[] = [
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
  
  for (let i = 0; i < 40; i++) {
    const department = faker.helpers.arrayElement(departments);
    usersToCreate.push({
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['employee', 'interviewer', 'team_lead', 'manager']),
      fullName: faker.person.fullName(),
      department: department
    })
  }

  console.log(`👤 Creating ${usersToCreate.length} users with password "password"...`);
  const createdUsers: any[] = [];
  
  for (const userData of usersToCreate) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: 'password',
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName,
        role: userData.role,
        department: userData.department,
      },
    });
  
    if (authError) {
      console.error(`🔴 Error creating auth user ${userData.email}: ${authError.message}`);
    } else if (authData.user) {
        // Manually insert into public.users, which should trigger after auth user creation
        // This makes sure the public user exists if the trigger somehow fails or is disabled
        const { data: publicUser, error: publicUserError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                email: userData.email,
                full_name: userData.fullName,
                role: userData.role,
                department: userData.department,
                avatar_url: faker.image.avatar(),
                profile_setup_complete: true,
                phone: faker.phone.number()
            })
            .select()
            .single();
        
        if (publicUserError) {
            console.error(`🔴 Error creating public user profile for ${userData.email}: ${publicUserError.message}`);
        } else {
            createdUsers.push(publicUser);
        }
    }
  }
  console.log(`✅ Successfully created ${createdUsers.length} users.`);


  // --- 4. SEED APPLICATION DATA ---
  if (createdUsers.length === 0) {
      console.error("🔴 No users were created, cannot seed dependent data. Aborting.");
      return;
  }
  
  console.log('🌱 Seeding application data...');

  // Jobs
  console.log('🌱 Seeding Jobs...');
  const jobsToInsert = [];
  for (let i = 0; i < 15; i++) {
    jobsToInsert.push({
      title: faker.person.jobTitle(),
      department: faker.helpers.arrayElement(departments),
      description: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold']),
    });
  }
  const { data: createdJobs } = await supabaseAdmin.from('jobs').insert(jobsToInsert).select();
  console.log(`✅ Inserted ${createdJobs?.length || 0} jobs.`);

  // Applicants
  if (createdJobs && createdJobs.length > 0) {
    console.log('🌱 Seeding Applicants...');
    const applicantsToInsert = [];
    for (let i = 0; i < 50; i++) {
      applicantsToInsert.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        job_id: faker.helpers.arrayElement(createdJobs).id,
        stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected']),
        source: faker.helpers.arrayElement(['walk-in', 'college', 'email', 'manual']),
        avatar: faker.image.avatar(),
        wpm: faker.number.int({ min: 30, max: 90 }),
        accuracy: faker.number.int({ min: 80, max: 99 }),
        aptitude_score: faker.number.int({ min: 50, max: 95 }),
        comprehensive_score: faker.number.int({ min: 50, max: 95 }),
        english_grammar_score: faker.number.int({ min: 50, max: 95 }),
        customer_service_score: faker.number.int({ min: 50, max: 95 }),
      });
    }
    const { data: createdApplicants } = await supabaseAdmin.from('applicants').insert(applicantsToInsert).select();
    console.log(`✅ Inserted ${createdApplicants?.length || 0} applicants.`);

    // Applicant Notes & Interviews
    if (createdApplicants && createdApplicants.length > 0) {
        console.log('🌱 Seeding Applicant Notes & Interviews...');
        const notes = [];
        const interviews = [];
        for (const applicant of createdApplicants) {
            if (faker.datatype.boolean()) {
                notes.push({
                    applicant_id: applicant.id,
                    user_id: faker.helpers.arrayElement(createdUsers).id,
                    author_name: faker.helpers.arrayElement(createdUsers).full_name,
                    author_avatar: faker.image.avatar(),
                    note: faker.lorem.sentence()
                });
            }
            if (faker.datatype.boolean()) {
                const interviewer = faker.helpers.arrayElement(createdUsers);
                interviews.push({
                    applicant_id: applicant.id,
                    interviewer_id: interviewer.id,
                    date: faker.date.future(),
                    time: `${faker.number.int({min: 9, max: 17})}:00`,
                    type: faker.helpers.arrayElement(['Video', 'Phone', 'In-person']),
                    status: faker.helpers.arrayElement(['Scheduled', 'Completed', 'Canceled']),
                    candidate_name: applicant.name,
                    interviewer_name: interviewer.full_name,
                    job_title: faker.helpers.arrayElement(createdJobs).title
                });
            }
        }
        await supabaseAdmin.from('applicant_notes').insert(notes);
        await supabaseAdmin.from('interviews').insert(interviews);
        console.log(`✅ Inserted ${notes.length} notes and ${interviews.length} interviews.`);
    }
  }

  // Leaves & Balances
  console.log('🌱 Seeding Leaves & Balances...');
  const leaveBalances = [];
  const leaves = [];
  for (const user of createdUsers) {
      leaveBalances.push({ user_id: user.id, sick_leave: 12, casual_leave: 12, earned_leave: 15, unpaid_leave: 0 });
      for (let i = 0; i < 3; i++) {
        const startDate = faker.date.past();
        leaves.push({
            user_id: user.id,
            leave_type: faker.helpers.arrayElement(['sick', 'casual', 'earned']),
            start_date: startDate,
            end_date: new Date(startDate.getTime() + faker.number.int({min: 1, max: 4}) * 86400000),
            reason: faker.lorem.sentence(),
            status: faker.helpers.arrayElement(['approved', 'rejected', 'pending']),
            total_days: faker.number.int({min: 1, max: 5})
        });
      }
  }
  await supabaseAdmin.from('leave_balances').insert(leaveBalances);
  await supabaseAdmin.from('leaves').insert(leaves);
  console.log(`✅ Inserted ${leaveBalances.length} leave balances and ${leaves.length} leave records.`);

  console.log('✅ Database seeding process completed successfully!');
}

main().catch(error => {
    console.error('🔴 Seeding failed:', error);
    process.exit(1);
});
