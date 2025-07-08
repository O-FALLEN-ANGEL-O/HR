import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import 'dotenv/config';
import type { Job, Applicant, Metric, Interview, College, Onboarding, PerformanceReview, TimeOffRequest } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearDatabase() {
  console.log('🗑️ Clearing existing data...');
  const { data: tables, error } = await supabase
    .from('pg_catalog.pg_tables')
    .select('tablename')
    .ilike('schemaname', 'public');

  if (error) {
    console.error('Error fetching tables:', error);
    return;
  }

  const tableNames = (tables ?? []).map(t => t.tablename).filter(t => !t.startsWith('pg_') && !t.startsWith('sql_'));

  for (const tableName of tableNames) {
    console.log(`  - Dropping table: ${tableName}`);
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: `DROP TABLE IF EXISTS public."${tableName}" CASCADE;`,
    });
    if (dropError) console.error(`Error dropping table ${tableName}:`, dropError);
  }
}

async function createTables() {
  console.log('🏗️ Creating tables...');
  const tableSchemas = [
    `CREATE TABLE public.metrics (id SERIAL PRIMARY KEY, title TEXT, value TEXT, change TEXT, change_type TEXT);`,
    `CREATE TABLE public.jobs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT, department TEXT, status TEXT, applicants INT, posted_date TIMESTAMPTZ);`,
    `CREATE TABLE public.applicants (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT, email TEXT, phone TEXT, job_title TEXT, stage TEXT, applied_date TIMESTAMPTZ, avatar TEXT, source TEXT, wpm INT, accuracy INT, college_id TEXT);`,
    `CREATE TABLE public.interviews (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, candidate_name TEXT, candidate_avatar TEXT, job_title TEXT, interviewer_name TEXT, interviewer_avatar TEXT, date TIMESTAMPTZ, time TEXT, type TEXT, status TEXT);`,
    `CREATE TABLE public.colleges (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT, status TEXT, resumes_received INT, contact_email TEXT, last_contacted TIMESTAMPTZ);`,
    `CREATE TABLE public.onboarding_workflows (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, employee_name TEXT, employee_avatar TEXT, job_title TEXT, manager_name TEXT, buddy_name TEXT, progress INT, current_step TEXT, start_date TIMESTAMPTZ);`,
    `CREATE TABLE public.performance_reviews (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, employee_name TEXT, employee_avatar TEXT, job_title TEXT, review_date TEXT, status TEXT);`,
    `CREATE TABLE public.time_off_requests (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, employee_name TEXT, employee_avatar TEXT, type TEXT, start_date TIMESTAMPTZ, end_date TIMESTAMPTZ, status TEXT);`
  ];

  for (const sql of tableSchemas) {
    const { error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
        console.error(`Error creating table with SQL: ${sql}`, error);
        throw error;
    }
  }

  const policies = [
    `ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY "Public access for metrics" ON public.metrics FOR ALL USING (true) WITH CHECK (true);`,
    `ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY "Public access for jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);`,
    `ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY "Public access for applicants" ON public.applicants FOR ALL USING (true) WITH CHECK (true);`,
    `ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY "Public access for interviews" ON public.interviews FOR ALL USING (true) WITH CHECK (true);`,
    `ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY "Public access for colleges" ON public.colleges FOR ALL USING (true) WITH CHECK (true);`,
    `ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY "Public access for onboarding" ON public.onboarding_workflows FOR ALL USING (true) WITH CHECK (true);`,
    `ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY "Public access for performance" ON public.performance_reviews FOR ALL USING (true) WITH CHECK (true);`,
    `ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY "Public access for timeoff" ON public.time_off_requests FOR ALL USING (true) WITH CHECK (true);`,
  ]

  for (const sql of policies) {
     const { error } = await supabase.rpc('execute_sql', { sql });
     if (error) {
         console.error(`Error applying policy with SQL: ${sql}`, error);
         throw error;
     }
  }

  console.log('✅ Tables and policies created.');
}

async function seedData() {
  console.log('🌱 Seeding data...');

  const metrics: Omit<Metric, 'id'>[] = [
    { title: 'Total Employees', value: faker.number.int({ min: 1000, max: 1500 }).toString(), change: `+${faker.number.int({ min: 5, max: 15 })}%`, changeType: 'increase' },
    { title: 'Attrition Rate', value: `${faker.number.float({ min: 1, max: 5, precision: 0.1 })}%`, change: `-${faker.number.float({ min: 0.1, max: 1, precision: 0.1 })}%`, changeType: 'decrease' },
    { title: 'Compliance Score', value: `${faker.number.float({ min: 95, max: 99, precision: 0.1 })}%`, change: `+${faker.number.float({ min: 0.1, max: 1, precision: 0.1 })}%`, changeType: 'increase' },
    { title: 'Open Positions', value: faker.number.int({ min: 10, max: 30 }).toString(), change: `+${faker.number.int({ min: 1, max: 5 })}`, changeType: 'increase' },
  ];

  const jobs: Omit<Job, 'id'>[] = Array.from({ length: 15 }, () => ({
    title: faker.person.jobTitle(),
    department: faker.commerce.department(),
    status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold']),
    applicants: faker.number.int({ min: 5, max: 100 }),
    postedDate: faker.date.past().toISOString(),
  }));

  const applicants: Omit<Applicant, 'id'>[] = Array.from({ length: 20 }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    jobTitle: faker.person.jobTitle(),
    stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired']),
    appliedDate: faker.date.past().toISOString(),
    avatar: faker.image.avatar(),
    source: faker.helpers.arrayElement(['walk-in', 'college', 'email']),
  }));
  
  const interviews: Omit<Interview, 'id'>[] = Array.from({ length: 12 }, () => ({
    candidateName: faker.person.fullName(),
    candidateAvatar: faker.image.avatar(),
    jobTitle: faker.person.jobTitle(),
    interviewerName: faker.person.fullName(),
    interviewerAvatar: faker.image.avatar(),
    date: faker.date.future().toISOString(),
    time: '10:00 AM',
    type: faker.helpers.arrayElement(['Video', 'Phone', 'In-person']),
    status: faker.helpers.arrayElement(['Scheduled', 'Completed', 'Canceled'])
  }));

  const colleges: Omit<College, 'id'>[] = Array.from({ length: 8 }, () => ({
    name: `${faker.location.city()} University`,
    status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended', 'Declined']),
    resumesReceived: faker.number.int({ min: 0, max: 200 }),
    contactEmail: faker.internet.email(),
    lastContacted: faker.date.past().toISOString()
  }));

  const onboardingWorkflows: Omit<Onboarding, 'id'>[] = Array.from({ length: 5 }, () => ({
    employeeName: faker.person.fullName(),
    employeeAvatar: faker.image.avatar(),
    jobTitle: faker.person.jobTitle(),
    managerName: faker.person.fullName(),
    buddyName: faker.person.fullName(),
    progress: faker.number.int({ min: 10, max: 100 }),
    currentStep: faker.helpers.arrayElement(['IT Setup', 'HR Orientation', 'Department Intro']),
    startDate: faker.date.past().toISOString()
  }));

  const performanceReviews: Omit<PerformanceReview, 'id'>[] = Array.from({ length: 10 }, () => ({
    employeeName: faker.person.fullName(),
    employeeAvatar: faker.image.avatar(),
    jobTitle: faker.person.jobTitle(),
    reviewDate: faker.date.future().toLocaleDateString('en-US'),
    status: faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed'])
  }));

  const timeOffRequests: Omit<TimeOffRequest, 'id'>[] = Array.from({ length: 8 }, () => ({
    employeeName: faker.person.fullName(),
    employeeAvatar: faker.image.avatar(),
    type: faker.helpers.arrayElement(['Vacation', 'Sick Leave', 'Personal']),
    startDate: faker.date.future().toISOString(),
    endDate: faker.date.future().toISOString(),
    status: faker.helpers.arrayElement(['Pending', 'Approved', 'Rejected'])
  }));

  const { error } = await Promise.all([
    supabase.from('metrics').insert(metrics),
    supabase.from('jobs').insert(jobs),
    supabase.from('applicants').insert(applicants),
    supabase.from('interviews').insert(interviews),
    supabase.from('colleges').insert(colleges),
    supabase.from('onboarding_workflows').insert(onboardingWorkflows),
    supabase.from('performance_reviews').insert(performanceReviews),
    supabase.from('time_off_requests').insert(timeOffRequests),
  ]);

  if (error) {
    console.error('Error seeding data:', error);
  } else {
    console.log('✅ Data seeded successfully.');
  }
}

async function run() {
  await clearDatabase();
  await createTables();
  await seedData();
  console.log('🎉 Database setup complete!');
}

run().catch(console.error);

    