
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
      await supabaseAdmin.auth.admin.deleteUser(user.id, true); // true here enables hard delete
    }
    console.log(`✅ Deleted ${existingUsers.length} auth users.`);
  } else {
    console.log('✅ No existing auth users to delete.');
  }

  // --- 2. Clean up public tables ---
  // The public.users table should be cleaned automatically by the trigger when auth.users are deleted.
  // We'll clean the rest.
  console.log('🧹 Cleaning up public table data...');
   const tablesToClean = [
      'ticket_comments', 'helpdesk_tickets', 'expense_items', 'expense_reports', 'company_documents', 'payslips',
      'weekly_awards', 'kudos', 'post_comments', 'company_posts', 'key_results', 'objectives', 'onboarding_workflows',
      'leaves', 'leave_balances', 'interviews', 'applicant_notes', 'applicants', 'colleges', 'jobs'
   ];
  
  for (const table of tablesToClean) {
      const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        if (!error.message.includes('does not exist')) {
          console.warn(`🟠 Could not clean table ${table}:`, error.message);
        }
      } else {
          console.log(`- Cleaned ${table}`);
      }
  }


  // --- 3. Create one user for each role ---
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
      continue; // Skip to next user if this one fails
    } 
    
    if (authData.user) {
        // The trigger should have created the public user. Let's fetch it to be sure.
        const { data: publicUser, error: publicUserError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        
        if (publicUserError || !publicUser) {
            console.error(`🔴 Public user profile for ${userData.email} was not created by trigger: ${publicUserError?.message}`);
        } else {
             // Let's update the avatar and profile completion status
            const { data: updatedUser, error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    avatar_url: faker.image.avatar(),
                    profile_setup_complete: true,
                    phone: faker.phone.number()
                })
                .eq('id', publicUser.id)
                .select()
                .single();

            if (updateError) {
                console.error(`🔴 Error updating public user profile for ${userData.email}: ${updateError.message}`);
            } else {
                createdUsers.push(updatedUser);
            }
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
  for (let i = 0; i < 5; i++) {
    jobsToInsert.push({
      title: faker.person.jobTitle(),
      department: faker.helpers.arrayElement(departments),
      description: faker.lorem.paragraph(),
      status: 'Open',
    });
  }
  const { data: createdJobs, error: jobsError } = await supabaseAdmin.from('jobs').insert(jobsToInsert).select();
  if (jobsError) console.error("🔴 Error seeding jobs:", jobsError.message);
  else console.log(`✅ Inserted ${createdJobs?.length || 0} jobs.`);

  // Applicants
  if (createdJobs && createdJobs.length > 0) {
    console.log('🌱 Seeding Applicants...');
    const applicantsToInsert = [];
    for (let i = 0; i < 10; i++) {
      applicantsToInsert.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        job_id: faker.helpers.arrayElement(createdJobs).id,
        stage: 'Applied',
        source: 'walk-in',
        avatar: faker.image.avatar(),
      });
    }
    const { error: applicantsError } = await supabaseAdmin.from('applicants').insert(applicantsToInsert).select();
    if(applicantsError) console.error("🔴 Error seeding applicants:", applicantsError.message);
    else console.log(`✅ Inserted 10 applicants.`);
  }

  // Leaves & Balances
  console.log('🌱 Seeding Leaves & Balances...');
  const leaveBalances = [];
  const leaves = [];
  for (const user of createdUsers) {
      leaveBalances.push({ user_id: user.id, sick_leave: 12, casual_leave: 12, earned_leave: 15, unpaid_leave: 0 });
      leaves.push({
          user_id: user.id,
          leave_type: 'casual',
          start_date: faker.date.future(),
          end_date: faker.date.future(),
          reason: 'Vacation',
          status: 'pending',
          total_days: 2
      });
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
