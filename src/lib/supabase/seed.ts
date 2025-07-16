
// src/lib/supabase/seed.ts
import { createClient } from './admin';
import { faker } from '@faker-js/faker';
import type { UserRole } from '../types';

// IMPORTANT: This password will be used for all created users.
const DEFAULT_PASSWORD = 'password';

const definedUsers: { email: string; fullName: string; role: UserRole; department: string, avatar: string }[] = [
  { email: 'admin@hrplus.com', fullName: 'Admin User', role: 'admin', department: 'Executive', avatar: faker.image.avatar() },
  { email: 'super_hr@hrplus.com', fullName: 'Super HR User', role: 'super_hr', department: 'Human Resources', avatar: faker.image.avatar() },
  { email: 'hr_manager@hrplus.com', fullName: 'HR Manager', role: 'hr_manager', department: 'Human Resources', avatar: faker.image.avatar() },
  { email: 'recruiter@hrplus.com', fullName: 'Recruiter User', role: 'recruiter', department: 'Human Resources', avatar: faker.image.avatar() },
  { email: 'finance@hrplus.com', fullName: 'Finance User', role: 'finance', department: 'Finance', avatar: faker.image.avatar() },
  { email: 'it_admin@hrplus.com', fullName: 'IT Admin', role: 'it_admin', department: 'IT', avatar: faker.image.avatar() },
  { email: 'support@hrplus.com', fullName: 'Support User', role: 'support', department: 'IT', avatar: faker.image.avatar() },
  { email: 'manager@hrplus.com', fullName: 'Manager User', role: 'manager', department: 'Engineering', avatar: faker.image.avatar() },
  { email: 'team_lead@hrplus.com', fullName: 'Team Lead User', role: 'team_lead', department: 'Engineering', avatar: faker.image.avatar() },
  { email: 'interviewer@hrplus.com', fullName: 'Interviewer User', role: 'interviewer', department: 'Engineering', avatar: faker.image.avatar() },
  { email: 'employee@hrplus.com', fullName: 'Employee User', role: 'employee', department: 'Engineering', avatar: faker.image.avatar() },
  { email: 'intern@hrplus.com', fullName: 'Intern User', role: 'intern', department: 'Engineering', avatar: faker.image.avatar() },
];

const departments = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Human Resources', 'Finance', 'IT'];

async function seed() {
  console.log('🌱 Starting database seed process...');
  const supabaseAdmin = createClient();
  console.log('✅ Supabase admin client initialized.');

  // --- 1. CLEANUP ---
  console.log('🧹 Deleting existing auth users...');
  const { data: { users: authUsers }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
  if (listUsersError) {
    console.error('🔴 Error listing auth users:', listUsersError.message);
  } else {
    console.log(`Found ${authUsers.length} users to delete...`);
    const deletePromises = authUsers.map(user => supabaseAdmin.auth.admin.deleteUser(user.id, true));
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${authUsers.length} auth users.`);
  }

  // --- 2. CREATE USERS (Auth and Public) ---
  console.log(`👤 Creating ${definedUsers.length} users with password "${DEFAULT_PASSWORD}"...`);
  const createdUsers = [];

  for (const user of definedUsers) {
    // Create the auth user first
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        role: user.role,
        department: user.department,
        profile_setup_complete: true,
      }
    });

    if (authError) {
      console.error(`🔴 Error creating auth user ${user.email}:`, authError.message);
      continue; // Skip this user and move to the next
    }

    if (authData.user) {
        // Manually insert into public users table
        const { error: publicUserError } = await supabaseAdmin.from('users').insert({
            id: authData.user.id,
            full_name: user.fullName,
            email: user.email,
            avatar_url: user.avatar,
            role: user.role,
            department: user.department,
            profile_setup_complete: true
        });

        if (publicUserError) {
            console.error(`🔴 Error inserting public user profile for ${user.email}:`, publicUserError.message);
            // If public profile fails, delete the auth user to keep things clean
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } else {
            createdUsers.push({
                id: authData.user.id,
                ...user
            });
        }
    }
  }

  if (createdUsers.length === 0) {
    console.error('🔴 No users were created, cannot seed dependent data. Aborting.');
    return;
  }
  
  console.log(`✅ Successfully created ${createdUsers.length} users.`);
  
  // --- 3. SEED DEPENDENT DATA ---
  const getRandomUserId = () => faker.helpers.arrayElement(createdUsers).id;

  // Seed Jobs
  console.log('Job Seeding...');
  const jobs = Array.from({ length: 5 }, () => ({
    title: faker.person.jobTitle(),
    department: faker.helpers.arrayElement(departments),
    description: faker.lorem.paragraphs(3),
    status: 'Open' as const,
    posted_date: faker.date.past(),
    applicants: 0,
  }));
  const { data: seededJobs, error: jobsError } = await supabaseAdmin.from('jobs').insert(jobs).select();
  if (jobsError) console.error('Jobs seeding error:', jobsError);
  else console.log(`✅ Seeded ${seededJobs?.length || 0} jobs.`);

  // Seed Applicants
  if (seededJobs && seededJobs.length > 0) {
    console.log('Applicant Seeding...');
    const applicants = seededJobs.flatMap(job => 
      Array.from({ length: 3 }, () => ({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        job_id: job.id,
        stage: 'Applied' as const,
        applied_date: faker.date.between({ from: job.posted_date, to: new Date() }),
        source: 'walk-in' as const,
        avatar: faker.image.avatar(),
      }))
    );
    const { data: seededApplicants, error: applicantsError } = await supabaseAdmin.from('applicants').insert(applicants).select();
    if (applicantsError) console.error('Applicants seeding error:', applicantsError);
    else console.log(`✅ Seeded ${seededApplicants?.length || 0} applicants.`);
  }

  // Seed Leave Balances and Leaves
  console.log('Leave Seeding...');
  const leaveBalances = createdUsers.map(user => ({
      user_id: user.id,
      sick_leave: 12,
      casual_leave: 12,
      earned_leave: 15,
      unpaid_leave: 0,
  }));
  const { error: leaveBalancesError } = await supabaseAdmin.from('leave_balances').insert(leaveBalances);
  if(leaveBalancesError) console.error('Leave Balances seeding error:', leaveBalancesError);
  else console.log(`✅ Seeded ${leaveBalances.length} leave balances.`);
  
  const leaves = createdUsers.slice(0, 5).map(user => {
      const startDate = faker.date.past();
      return {
          user_id: user.id,
          leave_type: 'casual' as const,
          start_date: startDate,
          end_date: faker.date.soon({ days: 2, refDate: startDate }),
          reason: faker.lorem.sentence(),
          status: 'approved' as const,
          total_days: 2,
          approver_id: createdUsers.find(u => u.role === 'manager')?.id || createdUsers[0].id
      }
  });
  const { error: leavesError } = await supabaseAdmin.from('leaves').insert(leaves);
  if (leavesError) console.error('Leaves seeding error:', leavesError);
  else console.log(`✅ Seeded ${leaves.length} leave records.`);


  // Seed Company Posts
  console.log('Company Feed Seeding...');
  const posts = Array.from({ length: 5 }, () => ({
    user_id: createdUsers.find(u => u.role === 'hr_manager')?.id || createdUsers[0].id,
    content: faker.lorem.paragraph(),
    image_url: `https://placehold.co/600x400.png`
  }));
  const { data: seededPosts, error: postsError } = await supabaseAdmin.from('company_posts').insert(posts).select();
  if (postsError) console.error('Company Posts seeding error:', postsError);
  else console.log(`✅ Seeded ${seededPosts?.length || 0} company posts.`);


  console.log('🎉 Seed process completed!');
}

seed().catch(e => {
    console.error("🔴 Seeding failed with an unhandled error:", e);
    process.exit(1);
});
