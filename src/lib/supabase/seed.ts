import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file at the root of the project
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing in .env file. Make sure to create a .env file with your project credentials.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearData() {
  console.log('🗑️  Clearing existing data...');
  const tables = [
    'time_off_requests', 'performance_reviews', 'onboarding_workflows',
    'interviews', 'applicants', 'colleges', 'jobs', 'metrics'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
       // A .delete() on a table with a SERIAL primary key can cause a non-fatal error
       // if the UUID is invalid. We can safely ignore it for the 'metrics' table.
      if (table !== 'metrics' || !error.message.includes('invalid input syntax for type uuid')) {
        console.error(`Error clearing table ${table}:`, error.message);
      }
    }
  }
  console.log('✅ Data cleared.');
}

async function seedData() {
  console.log('🌱 Seeding data...');

  const metrics = Array.from({ length: 4 }, (_, i) => {
      const titles = ['Total Employees', 'Attrition Rate', 'Compliance Score', 'Open Positions'];
      const isIncrease = faker.datatype.boolean();
      return {
        title: titles[i],
        value: i === 1 || i === 2 ? `${faker.number.float({ min: 1, max: 99, multipleOf: 0.1 })}%` : faker.number.int({ min: 10, max: 1500 }).toString(),
        change: `${isIncrease ? '+' : '-'}${faker.number.int({ min: 1, max: 15 })}%`,
        change_type: isIncrease ? 'increase' : 'decrease'
      }
  });

  const jobs = Array.from({ length: 15 }, () => ({
    title: faker.person.jobTitle(),
    department: faker.commerce.department(),
    status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold']),
    applicants: faker.number.int({ min: 5, max: 100 }),
    posted_date: faker.date.past().toISOString(),
  }));

  const applicants = Array.from({ length: 20 }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    job_title: faker.person.jobTitle(),
    stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired']),
    applied_date: faker.date.past().toISOString(),
    avatar: faker.image.avatar(),
    source: faker.helpers.arrayElement(['walk-in', 'college', 'email']),
    aptitude_score: faker.helpers.arrayElement([null, faker.number.int({ min: 40, max: 100 })]),
    wpm: faker.helpers.arrayElement([null, faker.number.int({ min: 30, max: 90 })]),
    accuracy: faker.helpers.arrayElement([null, faker.number.int({ min: 85, max: 99 })]),
  }));
  
  const interviews = Array.from({ length: 12 }, () => ({
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

  const colleges = Array.from({ length: 8 }, () => ({
    name: `${faker.location.city()} University`,
    status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended', 'Declined']),
    resumes_received: faker.number.int({ min: 0, max: 200 }),
    contact_email: faker.internet.email(),
    last_contacted: faker.date.past().toISOString()
  }));

  const onboardingWorkflows = Array.from({ length: 5 }, () => ({
    employee_name: faker.person.fullName(),
    employee_avatar: faker.image.avatar(),
    job_title: faker.person.jobTitle(),
    manager_name: faker.person.fullName(),
    buddy_name: faker.person.fullName(),
    progress: faker.number.int({ min: 10, max: 100 }),
    current_step: faker.helpers.arrayElement(['IT Setup', 'HR Orientation', 'Department Intro']),
    start_date: faker.date.past().toISOString()
  }));

  const performanceReviews = Array.from({ length: 10 }, () => ({
    employee_name: faker.person.fullName(),
    employee_avatar: faker.image.avatar(),
    job_title: faker.person.jobTitle(),
    review_date: faker.date.future().toLocaleDateString('en-US'),
    status: faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed'])
  }));

  const timeOffRequests = Array.from({ length: 8 }, () => ({
    employee_name: faker.person.fullName(),
    employee_avatar: faker.image.avatar(),
    type: faker.helpers.arrayElement(['Vacation', 'Sick Leave', 'Personal']),
    start_date: faker.date.future().toISOString(),
    end_date: faker.date.future().toISOString(),
    status: faker.helpers.arrayElement(['Pending', 'Approved', 'Rejected'])
  }));

  const insertions = [
    { name: 'metrics', data: metrics },
    { name: 'jobs', data: jobs },
    { name: 'applicants', data: applicants },
    { name: 'interviews', data: interviews },
    { name: 'colleges', data: colleges },
    { name: 'onboarding_workflows', data: onboardingWorkflows },
    { name: 'performance_reviews', data: performanceReviews },
    { name: 'time_off_requests', data: timeOffRequests },
  ];

  const promises = insertions.map(async (insertion) => {
    const { error } = await supabase.from(insertion.name).insert(insertion.data);
    if (error) {
      console.error(`🔴 Error seeding ${insertion.name}:`, error.message);
    } else {
      console.log(`  - Seeded ${insertion.name}`);
    }
  });
  
  await Promise.all(promises);
}

async function run() {
  await clearData();
  await seedData();
  console.log('🎉 Database seeding complete!');
}

run().catch(console.error);