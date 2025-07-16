
// src/lib/supabase/seed.ts

import { createClient as createAdminClient } from './admin';
import { faker } from '@faker-js/faker';
import type { UserRole } from '../types';

// Configuration
const USER_COUNT = 40; // Total random users to create (in addition to role-specific ones)
const JOBS_COUNT = 15;
const COLLEGES_COUNT = 10;
const APPLICANTS_PER_JOB = 10;
const POSTS_COUNT = 15;
const DOCUMENTS_COUNT = 8;
const HELPDESK_TICKETS_COUNT = 25;

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
  const supabaseAdmin = createAdminClient();
  console.log('✅ Supabase admin client initialized.');

  // --- 1. CLEANUP ---
  console.log('🧹 Deleting existing auth users...');
  const { data: { users: authUsers }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
  if (listUsersError) {
    console.error('🔴 Error listing auth users:', listUsersError.message);
  } else {
    console.log(`Found ${authUsers.length} users to delete...`);
    const deletePromises = authUsers.map(user => supabaseAdmin.auth.admin.deleteUser(user.id, true)); // hard delete
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${authUsers.length} auth users.`);
  }

  // --- 2. CREATE USERS ---
  const totalUsersToCreate = definedUsers.length + USER_COUNT;
  console.log(`👤 Creating ${totalUsersToCreate} users with password "${DEFAULT_PASSWORD}"...`);
  
  const createdUsers: { id: string; full_name: string; email: string; avatar_url: string; role: UserRole; department: string; profile_setup_complete: boolean }[] = [];

  for (const user of definedUsers) {
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        avatar_url: user.avatar,
        role: user.role,
        department: user.department,
        profile_setup_complete: true,
      }
    });
    if (error) {
      console.error(`🔴 Error creating auth user ${user.email}:`, error.message);
    } else if (authData.user) {
        createdUsers.push({
            id: authData.user.id,
            full_name: user.fullName,
            email: user.email,
            avatar_url: user.avatar,
            role: user.role,
            department: user.department,
            profile_setup_complete: true,
        });
    }
  }

  for (let i = 0; i < USER_COUNT; i++) {
    const fullName = faker.person.fullName();
    const email = faker.internet.email({ firstName: fullName.split(' ')[0], lastName: fullName.split(' ')[1] });
    const department = faker.helpers.arrayElement(departments);
    const role = department === 'Human Resources' ? 'hr_manager' : 'employee';
    const avatar = faker.image.avatar();

    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName, avatar_url: avatar, role, department, profile_setup_complete: true }
    });
     if (error) {
      console.error(`🔴 Error creating auth user ${email}:`, error.message);
    } else if (authData.user) {
       createdUsers.push({
            id: authData.user.id,
            full_name: fullName,
            email: email,
            avatar_url: avatar,
            role: role as UserRole,
            department: department,
            profile_setup_complete: true,
        });
    }
  }

  if (createdUsers.length === 0) {
    console.error('🔴 No users were created, cannot seed dependent data. Aborting.');
    return;
  }
  
  console.log(`✅ Successfully created ${createdUsers.length} auth users.`);

  // Manually insert into public.users, letting the trigger handle the initial insert from auth
  const { error: usersInsertError } = await supabaseAdmin
    .from('users')
    .upsert(createdUsers, { onConflict: 'id' });

  if (usersInsertError) {
    console.error('🔴 Error inserting into public.users:', usersInsertError.message);
    return;
  }
  console.log(`✅ Upserted ${createdUsers.length} records into public.users.`);


  // --- 3. SEED DEPENDENT DATA ---
  const getUserIdByRole = (role: UserRole) => createdUsers.find(u => u.role === role)?.id;
  const getRandomUser = () => faker.helpers.arrayElement(createdUsers);

  // Seed Jobs
  console.log('Job Seeding...');
  const jobs = Array.from({ length: JOBS_COUNT }, () => ({
    title: faker.person.jobTitle(),
    department: faker.helpers.arrayElement(departments),
    description: faker.lorem.paragraphs(3),
    status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold']),
    posted_date: faker.date.past(),
    applicants: 0,
  }));
  const { data: seededJobs, error: jobsError } = await supabaseAdmin.from('jobs').insert(jobs).select();
  if (jobsError) console.error('Jobs seeding error:', jobsError);
  else console.log(`✅ Seeded ${seededJobs.length} jobs.`);

  // Seed Colleges
  console.log('College Seeding...');
  const colleges = Array.from({ length: COLLEGES_COUNT }, () => ({
    name: `${faker.location.city()} University`,
    status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended', 'Declined']),
    contact_email: faker.internet.email(),
    last_contacted: faker.date.past(),
  }));
  const { data: seededColleges, error: collegesError } = await supabaseAdmin.from('colleges').insert(colleges).select();
  if (collegesError) console.error('Colleges seeding error:', collegesError);
  else console.log(`✅ Seeded ${seededColleges.length} colleges.`);

  // Seed Applicants
  console.log('Applicant Seeding...');
  if (seededJobs && seededJobs.length > 0) {
    const applicants = seededJobs.flatMap(job => 
      Array.from({ length: APPLICANTS_PER_JOB }, () => ({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        job_id: job.id,
        stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired']),
        applied_date: faker.date.between({ from: job.posted_date, to: new Date() }),
        source: faker.helpers.arrayElement(['walk-in', 'college', 'email', 'manual']),
        avatar: faker.image.avatar(),
        wpm: faker.number.int({ min: 40, max: 120 }),
        accuracy: faker.number.int({ min: 85, max: 99 }),
        aptitude_score: faker.number.int({ min: 60, max: 100 }),
        comprehensive_score: faker.number.int({ min: 60, max: 100 }),
        english_grammar_score: faker.number.int({ min: 60, max: 100 }),
        customer_service_score: faker.number.int({ min: 60, max: 100 }),
      }))
    );
    const { data: seededApplicants, error: applicantsError } = await supabaseAdmin.from('applicants').insert(applicants).select();
    if (applicantsError) console.error('Applicants seeding error:', applicantsError);
    else console.log(`✅ Seeded ${seededApplicants.length} applicants.`);

    // Seed Interviews
    console.log('Interview Seeding...');
    if (seededApplicants && seededApplicants.length > 0) {
      const interviews = seededApplicants.filter(a => a.stage === 'Interview' || a.stage === 'Offer').map(applicant => ({
        applicant_id: applicant.id,
        interviewer_id: getUserIdByRole('interviewer') || getRandomUser().id,
        date: faker.date.future(),
        time: `${faker.number.int({ min: 9, max: 17 })}:${faker.helpers.arrayElement(['00', '30'])}`,
        type: faker.helpers.arrayElement(['Video', 'Phone', 'In-person']),
        status: 'Scheduled',
        candidate_name: applicant.name,
        interviewer_name: createdUsers.find(u => u.id === (getUserIdByRole('interviewer') || getRandomUser().id))?.full_name || 'Interviewer',
        job_title: seededJobs.find(j => j.id === applicant.job_id)?.title || 'N/A'
      }));
       const { data: seededInterviews, error: interviewsError } = await supabaseAdmin.from('interviews').insert(interviews).select();
       if(interviewsError) console.error('Interviews seeding error:', interviewsError);
       else console.log(`✅ Seeded ${seededInterviews.length} interviews.`);
    }
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
  
  const leaves = createdUsers.slice(0, 10).map(user => {
      const startDate = faker.date.past();
      return {
          user_id: user.id,
          leave_type: faker.helpers.arrayElement(['sick', 'casual', 'earned']),
          start_date: startDate,
          end_date: faker.date.soon({ days: 2, refDate: startDate }),
          reason: faker.lorem.sentence(),
          status: faker.helpers.arrayElement(['approved', 'rejected', 'pending']),
          total_days: 2,
          approver_id: getUserIdByRole('manager')
      }
  });
  const { error: leavesError } = await supabaseAdmin.from('leaves').insert(leaves);
  if (leavesError) console.error('Leaves seeding error:', leavesError);
  else console.log(`✅ Seeded ${leaves.length} leave records.`);

  // Seed Company Posts
  console.log('Company Feed Seeding...');
  const posts = Array.from({ length: POSTS_COUNT }, () => ({
    user_id: getUserIdByRole('hr_manager') || getRandomUser().id,
    content: faker.lorem.paragraph(),
    image_url: faker.datatype.boolean(0.3) ? `https://placehold.co/600x400.png` : null,
  }));
  const { data: seededPosts, error: postsError } = await supabaseAdmin.from('company_posts').insert(posts).select();
  if (postsError) console.error('Company Posts seeding error:', postsError);
  else console.log(`✅ Seeded ${seededPosts.length} company posts.`);

  // Seed Post Comments
  if(seededPosts) {
      const comments = seededPosts.slice(0, 5).flatMap(post => 
        Array.from({length: faker.number.int({min: 1, max: 5})}, () => ({
            post_id: post.id,
            user_id: getRandomUser().id,
            comment: faker.lorem.sentence()
        }))
      );
      const { error: commentsError } = await supabaseAdmin.from('post_comments').insert(comments);
      if(commentsError) console.error('Post Comments seeding error:', commentsError);
      else console.log(`✅ Seeded ${comments.length} comments.`);
  }
  
  // Seed Kudos
  console.log('Kudos Seeding...');
  const kudos = Array.from({ length: 30 }, () => ({
      from_user_id: getRandomUser().id,
      to_user_id: getRandomUser().id,
      value: faker.helpers.arrayElement(['Team Player', 'Innovation', 'Customer First', 'Ownership']),
      message: faker.company.catchPhrase()
  }));
   const { error: kudosError } = await supabaseAdmin.from('kudos').insert(kudos);
   if(kudosError) console.error('Kudos seeding error:', kudosError);
   else console.log(`✅ Seeded ${kudos.length} kudos.`);
  
  // Seed Payslips
  console.log('Payslip Seeding...');
  const payslips = createdUsers.slice(0, 20).flatMap(user => 
    Array.from({length: 3}, (_, i) => ({
        user_id: user.id,
        month: faker.date.month(),
        year: 2024,
        gross_salary: faker.finance.amount({min: 40000, max: 120000, dec: 0 }),
        net_salary: faker.finance.amount({min: 30000, max: 90000, dec: 0 }),
        download_url: faker.internet.url()
    }))
  );
  const { error: payslipsError } = await supabaseAdmin.from('payslips').insert(payslips);
  if(payslipsError) console.error('Payslips seeding error:', payslipsError);
  else console.log(`✅ Seeded ${payslips.length} payslips.`);
  
  // Seed Company Documents
  console.log('Document Seeding...');
  const documents = Array.from({ length: DOCUMENTS_COUNT }, () => ({
    title: faker.company.buzzNoun() + " Policy",
    description: faker.lorem.sentence(),
    category: faker.helpers.arrayElement(['HR', 'IT', 'Finance', 'General']),
    last_updated: faker.date.past(),
    download_url: faker.internet.url()
  }));
  const { error: docsError } = await supabaseAdmin.from('company_documents').insert(documents);
  if(docsError) console.error('Company Documents seeding error:', docsError);
  else console.log(`✅ Seeded ${documents.length} documents.`);

  // Seed Helpdesk Tickets
  console.log('Helpdesk Seeding...');
  const tickets = Array.from({ length: HELPDESK_TICKETS_COUNT }, () => ({
    user_id: getRandomUser().id,
    subject: faker.hacker.phrase(),
    description: faker.lorem.paragraph(),
    category: faker.helpers.arrayElement(['IT', 'HR', 'Finance', 'General']),
    status: faker.helpers.arrayElement(['Open', 'In Progress', 'Resolved', 'Closed']),
    priority: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Urgent']),
    resolver_id: faker.datatype.boolean(0.7) ? (getUserIdByRole('support') || getRandomUser().id) : null
  }));
  const { data: seededTickets, error: ticketsError } = await supabaseAdmin.from('helpdesk_tickets').insert(tickets).select();
  if(ticketsError) console.error('Helpdesk Tickets seeding error:', ticketsError);
  else console.log(`✅ Seeded ${seededTickets.length} tickets.`);

  // Seed Ticket Comments
  if (seededTickets) {
      const ticketComments = seededTickets.slice(0, 10).flatMap(ticket => 
        Array.from({length: faker.number.int({min: 1, max: 4})}, () => ({
            ticket_id: ticket.id,
            user_id: faker.helpers.arrayElement([ticket.user_id, ticket.resolver_id].filter(Boolean) as string[]),
            comment: faker.lorem.sentence()
        }))
      );
      const { error: ticketCommentsError } = await supabaseAdmin.from('ticket_comments').insert(ticketComments);
      if (ticketCommentsError) console.error('Ticket Comments seeding error:', ticketCommentsError);
      else console.log(`✅ Seeded ${ticketComments.length} ticket comments.`);
  }
  
  console.log('🎉 Seed process completed!');
}

seed().catch(console.error);
