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
  // The order is important due to foreign key constraints. Start with tables that have dependencies.
  const tablesToDelete = [
    'applicant_notes',
    'time_off_requests',
    'performance_reviews',
    'onboarding_workflows',
    'interviews',
    'applicants',
    'colleges',
    'jobs',
    'metrics'
  ];

  for (const table of tablesToDelete) {
      let query = supabase.from(table).delete();
      // Use a filter that will always be true to delete all rows.
      // Supabase requires a filter for delete operations unless row-level security is off.
      if (table === 'metrics') {
          query = query.gte('id', 0); // For serial integer IDs
      } else {
          query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // For UUIDs
      }
      
      const { error } = await query;

      if (error) {
          // This specific error can be ignored if the table is already empty.
          if (error.code !== '22P02') { // 22P02 is invalid text representation
              console.error(`Error clearing table ${table}:`, error.message);
          }
      }
  }
  console.log('✅ Data cleared.');
}


async function seedData() {
    console.log('🌱 Seeding data...');

    // Seed Metrics
    const metrics = [
        { title: 'Total Employees', value: faker.number.int({ min: 10, max: 1500 }).toString(), change: `+${faker.number.int({ min: 1, max: 15 })}%`, change_type: 'increase' },
        { title: 'Attrition Rate', value: `${faker.number.float({ min: 1, max: 10, multipleOf: 0.1 })}%`, change: `-${faker.number.float({ min: 0.1, max: 2, multipleOf: 0.1 })}%`, change_type: 'decrease' },
        { title: 'Compliance Score', value: `${faker.number.int({ min: 90, max: 100 })}%`, change: `+${faker.number.int({ min: 1, max: 5 })}%`, change_type: 'increase' },
        { title: 'Open Positions', value: faker.number.int({ min: 5, max: 50 }).toString(), change: `-${faker.number.int({ min: 1, max: 5 })}%`, change_type: 'decrease' }
    ];
    const { error: metricsError } = await supabase.from('metrics').insert(metrics);
    if (metricsError) console.error("Error seeding metrics:", metricsError.message);
    else console.log('  - Seeded metrics');

    // Seed Jobs
    const jobs = Array.from({ length: 15 }, () => ({
        title: faker.person.jobTitle(),
        department: faker.commerce.department(),
        description: faker.lorem.paragraphs(3),
        status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold']),
        applicants: faker.number.int({ min: 5, max: 100 }),
        posted_date: faker.date.past().toISOString(),
    }));
    const { data: seededJobs, error: jobError } = await supabase.from('jobs').insert(jobs).select('id');
    if (jobError) console.error("Error seeding jobs:", jobError.message);
    else console.log('  - Seeded jobs');

    // Seed Applicants
    if (seededJobs) {
        const applicants = Array.from({ length: 20 }, () => {
            const applicantName = faker.person.fullName();
            const applicantEmail = faker.internet.email().toLowerCase();
            return {
                name: applicantName,
                email: applicantEmail,
                phone: faker.phone.number(),
                job_id: faker.helpers.arrayElement(seededJobs).id,
                stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired']),
                applied_date: faker.date.past().toISOString(),
                avatar: faker.image.avatar(),
                source: faker.helpers.arrayElement(['walk-in', 'college', 'email', 'manual']),
                aptitude_score: faker.helpers.arrayElement([null, faker.number.int({ min: 40, max: 100 })]),
                wpm: faker.helpers.arrayElement([null, faker.number.int({ min: 30, max: 90 })]),
                accuracy: faker.helpers.arrayElement([null, faker.number.int({ min: 85, max: 99 })]),
                ai_match_score: faker.helpers.arrayElement([null, faker.number.int({ min: 50, max: 95 })]),
                ai_justification: faker.helpers.arrayElement([null, faker.lorem.paragraph()]),
                resume_data: {
                    fullName: applicantName,
                    email: applicantEmail,
                    phone: faker.phone.number(),
                    skills: Array.from({ length: faker.number.int({min: 4, max: 8}) }, () => faker.person.jobSkill()),
                    experience: Array.from({ length: faker.number.int({min: 1, max: 3}) }, () => ({
                        jobTitle: faker.person.jobTitle(),
                        company: faker.company.name(),
                        duration: `${faker.number.int({min: 1, max: 5})} years`
                    })),
                    education: [{
                        institution: `${faker.location.city()} University`,
                        degree: 'B.S. in Computer Science',
                        year: '2020'
                    }],
                    fullText: faker.lorem.paragraphs(5),
                }
            };
        });
        const { data: seededApplicants, error: applicantError } = await supabase.from('applicants').insert(applicants).select();
        if (applicantError) console.error("Error seeding applicants:", applicantError.message);
        else console.log('  - Seeded applicants');

        // Seed Applicant Notes
        if (seededApplicants) {
            const applicantNotes = seededApplicants.slice(0, 10).map(applicant => ({
                applicant_id: applicant.id,
                author_name: faker.person.fullName(),
                author_avatar: faker.image.avatar(),
                note: faker.lorem.sentence(),
                created_at: faker.date.recent().toISOString()
            }));
            const { error: notesError } = await supabase.from('applicant_notes').insert(applicantNotes);
            if (notesError) console.error("Error seeding applicant_notes:", notesError.message);
            else console.log('  - Seeded applicant_notes');
        }
    }

    // Seed Interviews
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
    const { error: interviewsError } = await supabase.from('interviews').insert(interviews);
    if (interviewsError) console.error("Error seeding interviews:", interviewsError.message);
    else console.log('  - Seeded interviews');

    // Seed Colleges
    const colleges = Array.from({ length: 8 }, () => ({
        name: `${faker.location.city()} University`,
        status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended', 'Declined']),
        resumes_received: faker.number.int({ min: 0, max: 200 }),
        contact_email: faker.internet.email(),
        last_contacted: faker.date.past().toISOString()
    }));
    const { error: collegesError } = await supabase.from('colleges').insert(colleges);
    if (collegesError) console.error("Error seeding colleges:", collegesError.message);
    else console.log('  - Seeded colleges');

    // Seed Onboarding
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
    const { error: onboardingError } = await supabase.from('onboarding_workflows').insert(onboardingWorkflows);
    if (onboardingError) console.error("Error seeding onboarding_workflows:", onboardingError.message);
    else console.log('  - Seeded onboarding_workflows');

    // Seed Performance Reviews
    const performanceReviews = Array.from({ length: 10 }, () => ({
        employee_name: faker.person.fullName(),
        employee_avatar: faker.image.avatar(),
        job_title: faker.person.jobTitle(),
        review_date: faker.date.future().toLocaleDateString('en-US'),
        status: faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed'])
    }));
    const { error: perfError } = await supabase.from('performance_reviews').insert(performanceReviews);
    if (perfError) console.error("Error seeding performance_reviews:", perfError.message);
    else console.log('  - Seeded performance_reviews');

    // Seed Time Off Requests
    const timeOffRequests = Array.from({ length: 8 }, () => ({
        employee_name: faker.person.fullName(),
        employee_avatar: faker.image.avatar(),
        type: faker.helpers.arrayElement(['Vacation', 'Sick Leave', 'Personal']),
        start_date: faker.date.future().toISOString(),
        end_date: faker.date.future().toISOString(),
        status: faker.helpers.arrayElement(['Pending', 'Approved', 'Rejected'])
    }));
    const { error: timeoffError } = await supabase.from('time_off_requests').insert(timeOffRequests);
    if (timeoffError) console.error("Error seeding time_off_requests:", timeoffError.message);
    else console.log('  - Seeded time_off_requests');
}


async function run() {
  await clearData();
  await seedData();
  console.log('🎉 Database seeding complete!');
}

run().catch(error => {
    console.error('🔴 Seeding failed:', error.message);
});
