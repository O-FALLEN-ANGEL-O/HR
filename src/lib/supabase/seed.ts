import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import 'dotenv/config';
import type { Job, Applicant, Metric, Interview, College, Onboarding, PerformanceReview, TimeOffRequest } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing in .env file.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearData() {
  console.log('🗑️  Clearing existing data...');
  const tables = [
    'time_off_requests', 'performance_reviews', 'onboarding_workflows',
    'interviews', 'applicants', 'colleges', 'jobs', 'metrics'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error && error.code !== '42P01') {
      console.error(`Error clearing table ${table}:`, error.message);
    }
  }
  console.log('✅ Data cleared.');
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

  for (const insertion of insertions) {
    const { error } = await supabase.from(insertion.name).insert(insertion.data);
    if (error) {
      console.error(`🔴 Error seeding ${insertion.name}:`, error.message);
    } else {
      console.log(`  - Seeded ${insertion.name}`);
    }
  }
}

async function run() {
  await clearData();
  await seedData();
  console.log('🎉 Database seeding complete!');
}

run().catch(console.error);