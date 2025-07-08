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

  for (const { tablename } of tables ?? []) {
    if (tablename.startsWith('pg_') || tablename.startsWith('sql_')) continue;
    console.log(`  - Dropping table: ${tablename}`);
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: `DROP TABLE IF EXISTS public."${tablename}" CASCADE;`,
    });
    if (dropError) console.error(`Error dropping table ${tablename}:`, dropError);
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

  // Metrics
  const metrics: Omit<Metric, 'id'>[] = [
    { title: 'Total Employees', value: faker.number.int({ min: 1000, max: 1500 }).toString(), change: `+${faker.number.int({ min: 5, max: 15 })}%`, changeType: 'increase' },
    { title: 'Attrition Rate', value: `${faker.number.float({ min: 1, max: 5, precision: 0.1 })}%`, change: `-${faker.number.float({ min: 0.1, max: 1, precision: 0.1 })}%`, changeType: 'decrease' },
    { title: 'Compliance Score', value: `${faker.number.float({ min: 95, max: 99, precision: 0.1 })}%`, change: `+${faker.number.float({ min: 0.1, max: 1, precision: 0.1 })}%`, changeType: 'increase' },
    { title: 'Open Positions', value: faker.number.int({ min: 10, max: 30 }).toString(), change: `+${faker.number.int({ min: 1, max: 5 })}`, changeType: 'increase' },
  ];
  await supabase.from('metrics').insert(metrics);

  // Jobs
  const jobs: Omit<Job, 'id'>[] = Array.from({ length: 10 }, () => ({
    title: faker.person.jobTitle(),
    department: faker.commerce.department(),
    status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold']),
    applicants: faker.number.int({ min: 5, max: 100 }),
    posted_date: faker.date.past().toISOString(),
  }));
  await supabase.from('jobs').insert(jobs);

  // Applicants
  const applicants: Omit<Applicant, 'id'>[] = Array.from({ length: 20 }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    job_title: faker.person.jobTitle(),
    stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired']),
    applied_date: faker.date.past().toISOString(),
    avatar: faker.image.avatar(),
    source: faker.helpers.arrayElement(['walk-in', 'college', 'email']),
  }));
  await supabase.from('applicants').insert(applicants);
  
  // A few more for the other tables to make the UI look good
  const interviews = Array.from({ length: 5 }, () => ({
    candidate_name: faker.person.fullName(),
    candidate_avatar: faker.image.avatar(),
    job_title: faker.person.jobTitle(),
    interviewer_name: faker.person.fullName(),
    interviewer_avatar: faker.image.avatar(),
    date: faker.date.future().toISOString(),
    time: '10:00 AM',
    type: faker.helpers.arrayElement(['Video', 'Phone', 'In-person']),
    status: faker.helpers.arrayElement(['Scheduled', 'Completed', 'Canceled'])
  }));
  await supabase.from('interviews').insert(interviews);

  const colleges = Array.from({ length: 4 }, () => ({
    name: `${faker.location.city()} University`,
    status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended', 'Declined']),
    resumes_received: faker.number.int({ min: 0, max: 200 }),
    contact_email: faker.internet.email(),
    last_contacted: faker.date.past().toISOString()
  }));
  await supabase.from('colleges').insert(colleges);


  console.log('✅ Data seeded.');
}

async function run() {
  await clearDatabase();
  await createTables();
  await seedData();
  console.log('🎉 Database setup complete!');
}

run().catch(console.error);
