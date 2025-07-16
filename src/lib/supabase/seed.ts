
// src/lib/supabase/seed.ts
import { createClient as createAdminClient } from './admin';
import { faker } from '@faker-js/faker';
import type { UserProfile, UserRole } from '../types';

const supabaseAdmin = createAdminClient();

const definedUsers: { email: string; fullName: string; role: UserRole; department: string }[] = [
  { email: 'admin@hrplus.com', fullName: 'Admin User', role: 'admin', department: 'Executive' },
  { email: 'super_hr@hrplus.com', fullName: 'Super HR User', role: 'super_hr', department: 'Human Resources' },
  { email: 'hr_manager@hrplus.com', fullName: 'HR Manager', role: 'hr_manager', department: 'Human Resources' },
  { email: 'recruiter@hrplus.com', fullName: 'Recruiter User', role: 'recruiter', department: 'Human Resources' },
  { email: 'finance@hrplus.com', fullName: 'Finance User', role: 'finance', department: 'Finance' },
  { email: 'it_admin@hrplus.com', fullName: 'IT Admin', role: 'it_admin', department: 'IT' },
  { email: 'support@hrplus.com', fullName: 'Support User', role: 'support', department: 'IT' },
  { email: 'manager@hrplus.com', fullName: 'Manager User', role: 'manager', department: 'Engineering' },
  { email: 'team_lead@hrplus.com', fullName: 'Team Lead User', role: 'team_lead', department: 'Engineering' },
  { email: 'interviewer@hrplus.com', fullName: 'Interviewer User', role: 'interviewer', department: 'Engineering' },
  { email: 'employee@hrplus.com', fullName: 'Employee User', role: 'employee', department: 'Engineering' },
  { email: 'intern@hrplus.com', fullName: 'Intern User', role: 'intern', department: 'Engineering' },
];

async function cleanUp() {
    console.log('🧹 Cleaning up public table data...');
    const tables = [
      'ticket_comments', 'helpdesk_tickets', 'expense_items', 'expense_reports',
      'company_documents', 'payslips', 'weekly_awards', 'kudos', 'post_comments',
      'company_posts', 'key_results', 'objectives', 'onboarding_workflows',
      'leaves', 'leave_balances', 'interviews', 'applicant_notes', 'applicants',
      'colleges', 'jobs', 'users'
    ];

    for (const table of tables) {
        const { error } = await supabaseAdmin.from(table).delete().gt('created_at', '1900-01-01');
        if (error) console.warn(`🟠 Could not clean table ${table}: ${error.message}`);
        else console.log(`- Cleaned ${table}`);
    }
}

async function seed() {
  console.log('🌱 Starting database seed process...');

  // --- 1. GET USERS ---
  console.log('👤 Fetching existing users...');
  const { data: users, error: userError } = await supabaseAdmin.from('users').select('*');
  
  if (userError || !users || users.length === 0) {
    console.error('🔴 No users found in the database. Please create users first before running this script.');
    console.log('💡 Tip: You can run a SQL script in the Supabase Editor to add the necessary users.');
    return;
  }
  
  const createdUsers: UserProfile[] = users;
  console.log(`✅ Found ${createdUsers.length} users.`);

  // --- 2. SEED DEPENDENT DATA ---
  const getRandomUser = (role?: UserRole) => {
    const filtered = role ? createdUsers.filter(u => u.role === role) : createdUsers;
    return faker.helpers.arrayElement(filtered.length > 0 ? filtered : createdUsers);
  };
  
  // Seed Jobs
  console.log('Job Seeding...');
  const jobs = Array.from({ length: 15 }, () => ({
    title: faker.person.jobTitle(),
    department: faker.helpers.arrayElement(['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Human Resources']),
    description: faker.lorem.paragraphs(3),
    status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold'] as const),
    posted_date: faker.date.past(),
  }));
  const { data: seededJobs, error: jobsError } = await supabaseAdmin.from('jobs').insert(jobs).select();
  if (jobsError) console.error('🔴 Jobs seeding error:', jobsError.message);
  else console.log(`✅ Seeded ${seededJobs?.length || 0} jobs.`);

  // Seed Colleges
  console.log('College Seeding...');
  const colleges = Array.from({ length: 10 }, () => ({
      name: `${faker.location.city()} University`,
      status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended', 'Declined'] as const),
      contact_email: faker.internet.email(),
      last_contacted: faker.date.past(),
  }));
  const { data: seededColleges, error: collegesError } = await supabaseAdmin.from('colleges').insert(colleges).select();
  if(collegesError) console.error('🔴 Colleges seeding error:', collegesError.message);
  else console.log(`✅ Seeded ${seededColleges?.length || 0} colleges.`);

  // Seed Applicants
  if (seededJobs && seededJobs.length > 0) {
    console.log('Applicant Seeding...');
    const applicants = seededJobs.flatMap(job => 
      Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () => ({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        job_id: job.id,
        stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'] as const),
        applied_date: faker.date.between({ from: job.posted_date, to: new Date() }),
        source: faker.helpers.arrayElement(['walk-in', 'college', 'email', 'manual'] as const),
        avatar: faker.image.avatar(),
        college_id: faker.helpers.maybe(() => faker.helpers.arrayElement(seededColleges).id, { probability: 0.3 })
      }))
    );
    const { data: seededApplicants, error: applicantsError } = await supabaseAdmin.from('applicants').insert(applicants).select();
    if (applicantsError) console.error('🔴 Applicants seeding error:', applicantsError.message);
    else console.log(`✅ Seeded ${seededApplicants?.length || 0} applicants.`);

    // Seed Interviews & Notes for Applicants
    if(seededApplicants && seededApplicants.length > 0) {
        console.log('Interview & Applicant Notes Seeding...');
        const interviews = seededApplicants.filter(a => ['Interview', 'Offer', 'Hired'].includes(a.stage)).map(app => ({
            applicant_id: app.id,
            interviewer_id: getRandomUser('interviewer').id,
            date: faker.date.soon({ refDate: app.applied_date }),
            time: `${faker.number.int({min: 9, max: 17})}:00`,
            type: faker.helpers.arrayElement(['Video', 'Phone', 'In-person'] as const),
            status: 'Scheduled' as const,
            candidate_name: app.name,
            interviewer_name: getRandomUser('interviewer').full_name,
            job_title: seededJobs.find(j => j.id === app.job_id)?.title || 'N/A'
        }));
        const { error: interviewsError } = await supabaseAdmin.from('interviews').insert(interviews);
        if(interviewsError) console.error('🔴 Interviews seeding error:', interviewsError.message);
        else console.log(`✅ Seeded ${interviews.length} interviews.`);
        
        const applicantNotes = seededApplicants.map(app => ({
            applicant_id: app.id,
            user_id: getRandomUser('recruiter').id,
            author_name: getRandomUser('recruiter').full_name,
            author_avatar: getRandomUser('recruiter').avatar_url,
            note: faker.lorem.sentence(),
        }));
        const { error: notesError } = await supabaseAdmin.from('applicant_notes').insert(applicantNotes);
        if(notesError) console.error('🔴 Applicant Notes seeding error:', notesError.message);
        else console.log(`✅ Seeded ${applicantNotes.length} applicant notes.`);
    }
  }
  
  // Seed Company Posts
  console.log('Company Feed Seeding...');
  const hrUser = getRandomUser('hr_manager');
  const posts = Array.from({ length: 8 }, () => ({
    user_id: hrUser.id,
    content: faker.lorem.paragraph(),
    image_url: `https://placehold.co/600x400.png`
  }));
  const { data: seededPosts, error: postsError } = await supabaseAdmin.from('company_posts').insert(posts).select();
  if (postsError) console.error('🔴 Company Posts seeding error:', postsError.message);
  else console.log(`✅ Seeded ${seededPosts?.length || 0} company posts.`);

  // Seed Post Comments
  if(seededPosts && seededPosts.length > 0) {
      const comments = seededPosts.flatMap(post => Array.from({length: faker.number.int({min: 1, max: 5})}, () => ({
          post_id: post.id,
          user_id: getRandomUser().id,
          comment: faker.lorem.sentence()
      })));
      const { error: commentsError } = await supabaseAdmin.from('post_comments').insert(comments);
      if(commentsError) console.error('🔴 Post Comments seeding error:', commentsError.message);
      else console.log(`✅ Seeded ${comments.length} post comments.`);
  }

  // Seed Kudos
  console.log('Kudos Seeding...');
  const kudos = createdUsers.flatMap(userFrom => 
    faker.helpers.arrayElements(createdUsers.filter(u => u.id !== userFrom.id), 2)
    .map(userTo => ({
      from_user_id: userFrom.id,
      to_user_id: userTo.id,
      value: faker.helpers.arrayElement(['Team Player', 'Innovation', 'Customer First', 'Ownership']),
      message: faker.company.catchPhrase()
    }))
  );
  const { error: kudosError } = await supabaseAdmin.from('kudos').insert(kudos);
  if (kudosError) console.error('🔴 Kudos seeding error:', kudosError.message);
  else console.log(`✅ Seeded ${kudos.length} kudos.`);

  // Seed Helpdesk Tickets
  console.log('Helpdesk Seeding...');
  const tickets = Array.from({ length: 20 }, () => ({
    user_id: getRandomUser().id,
    subject: faker.hacker.phrase(),
    description: faker.lorem.paragraph(),
    category: faker.helpers.arrayElement(['IT', 'HR', 'Finance', 'General'] as const),
    status: faker.helpers.arrayElement(['Open', 'In Progress', 'Resolved', 'Closed'] as const),
    priority: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Urgent'] as const),
    resolver_id: faker.helpers.maybe(() => getRandomUser('support').id)
  }));
  const { data: seededTickets, error: ticketsError } = await supabaseAdmin.from('helpdesk_tickets').insert(tickets).select();
  if (ticketsError) console.error('🔴 Helpdesk Tickets seeding error:', ticketsError.message);
  else console.log(`✅ Seeded ${seededTickets?.length || 0} tickets.`);

  // Seed Ticket Comments
  if(seededTickets && seededTickets.length > 0) {
      const ticketComments = seededTickets.flatMap(ticket => Array.from({length: faker.number.int({min: 1, max: 4})}, () => ({
          ticket_id: ticket.id,
          user_id: faker.helpers.arrayElement([ticket.user_id, ticket.resolver_id].filter(Boolean) as string[]),
          comment: faker.lorem.sentence(),
      })));
      const { error: ticketCommentsError } = await supabaseAdmin.from('ticket_comments').insert(ticketComments);
      if(ticketCommentsError) console.error('🔴 Ticket Comments seeding error:', ticketCommentsError.message);
      else console.log(`✅ Seeded ${ticketComments.length} ticket comments.`);
  }

  console.log('🎉 Seed process completed!');
}

async function main() {
    // Check for FORCE_DB_SEED flag
    if (process.env.FORCE_DB_SEED !== 'true') {
        console.log('🚫 Seed script aborted. To run the seed script, use: npm run seed:force');
        return;
    }
    await cleanUp();
    await seed();
}

main().catch(e => {
    console.error("🔴 Seeding failed with an unhandled error:", e);
    process.exit(1);
});
