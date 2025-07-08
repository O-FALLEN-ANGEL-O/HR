import { createClient, type User } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import path from 'path';
import type { UserRole } from '../types';

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
  
  // Clear auth users first. This will cascade to public.users.
  console.log('🗑️  Clearing auth users...');
  const { data: { users: authUsers }, error: listUsersError } = await supabase.auth.admin.listUsers();
  if (listUsersError) {
    console.error('Error listing auth users:', listUsersError.message);
  } else {
    for (const user of authUsers) {
      if (user.email && !user.email.endsWith('@supabase.com')) { // Avoid deleting the super admin
         await supabase.auth.admin.deleteUser(user.id);
      }
    }
    console.log('✅ Auth users cleared.');
  }

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
          // P0001 is a plpgsql error, which can happen with empty tables.
          if (error.code !== 'P0001' && error.code !== '42P01') { 
              console.error(`Error clearing table ${table}:`, error.message);
          }
      }
  }
  console.log('✅ Data cleared.');
}


async function seedData() {
    console.log('🌱 Seeding data...');

    // Seed Users first, as other data may depend on them.
    console.log('  - Seeding users...');
    const roles: UserRole[] = ['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead', 'recruiter', 'interviewer', 'employee', 'intern', 'guest'];
    const seededUsers: User[] = [];

    for (const role of roles) {
        const email = `${role.replace('_', '.')}` + '@example.com';
        const password = 'password';

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email for simplicity
            user_metadata: { 
                full_name: `${role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} User`,
                avatar_url: faker.image.avatar(),
             }
        });

        if (authError) {
            console.error(`Error creating user ${email}:`, authError.message);
            continue;
        }

        if (authData.user) {
            // The trigger should have created the user in public.users. Now, update their role.
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: role, department: faker.person.jobArea() })
                .eq('id', authData.user.id);

            if (updateError) {
                console.error(`Error setting role for ${email}:`, updateError.message);
            } else {
                console.log(`    - Created ${role} user: ${email} (pw: ${password})`);
                seededUsers.push(authData.user);
            }
        }
    }
    
    if (seededUsers.length === 0) {
        console.error("No users were seeded. Aborting rest of seed.");
        return;
    }


    // Seed Metrics
    const metrics = [
        { title: 'Total Employees', value: seededUsers.filter(u => u.user_metadata.role !== 'intern').length.toString(), change: `+${faker.number.int({ min: 1, max: 15 })}%`, change_type: 'increase' as const },
        { title: 'Attrition Rate', value: `${faker.number.float({ min: 1, max: 10, multipleOf: 0.1 })}%`, change: `-${faker.number.float({ min: 0.1, max: 2, multipleOf: 0.1 })}%`, change_type: 'decrease' as const },
        { title: 'Compliance Score', value: `${faker.number.int({ min: 90, max: 100 })}%`, change: `+${faker.number.int({ min: 1, max: 5 })}%`, change_type: 'increase' as const },
        { title: 'Open Positions', value: faker.number.int({ min: 5, max: 50 }).toString(), change: `-${faker.number.int({ min: 1, max: 5 })}%`, change_type: 'decrease' as const }
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
        posted_date: faker.date.past().toISOString(),
        applicants: faker.number.int({ min: 0, max: 100 }),
    }));
    const { data: seededJobs, error: jobError } = await supabase.from('jobs').insert(jobs).select('id, title');
    if (jobError) console.error("Error seeding jobs:", jobError.message);
    else console.log('  - Seeded jobs');

    // Seed Colleges
    const collegesToSeed = Array.from({ length: 8 }, () => ({
        name: `${faker.location.city()} University`,
        status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended', 'Declined']),
        contact_email: faker.internet.email(),
        last_contacted: faker.date.past().toISOString()
    }));
    const { data: seededColleges, error: collegesError } = await supabase.from('colleges').insert(collegesToSeed).select('id');
    if (collegesError) console.error("Error seeding colleges:", collegesError.message);
    else console.log('  - Seeded colleges');


    // Seed Applicants
    if (seededJobs && seededColleges) {
        const applicants = Array.from({ length: 50 }, () => {
            const applicantName = faker.person.fullName();
            const applicantEmail = faker.internet.email().toLowerCase();
            const selectedJob = faker.helpers.arrayElement(seededJobs);
            const fromCollege = faker.datatype.boolean();
            return {
                name: applicantName,
                email: applicantEmail,
                phone: faker.phone.number(),
                job_id: selectedJob.id,
                college_id: fromCollege ? faker.helpers.arrayElement(seededColleges).id : null,
                stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired']),
                applied_date: faker.date.past().toISOString(),
                avatar: faker.image.avatar(),
                source: fromCollege ? 'college' as const : faker.helpers.arrayElement(['walk-in', 'email', 'manual'] as const),
                aptitude_score: faker.helpers.arrayElement([null, faker.number.int({ min: 40, max: 100 })]),
                comprehensive_score: faker.helpers.arrayElement([null, faker.number.int({ min: 40, max: 100 })]),
                english_grammar_score: faker.helpers.arrayElement([null, faker.number.int({ min: 40, max: 100 })]),
                customer_service_score: faker.helpers.arrayElement([null, faker.number.int({ min: 40, max: 100 })]),
                wpm: faker.helpers.arrayElement([null, faker.number.int({ min: 30, max: 90 })]),
                accuracy: faker.helpers.arrayElement([null, faker.number.int({ min: 85, max: 99 })]),
                ai_match_score: faker.helpers.arrayElement([null, faker.number.int({ min: 50, max: 95 })]),
                ai_justification: faker.helpers.arrayElement([null, faker.lorem.paragraph()]),
                resume_data: {
                    fullName: applicantName,
                    email: applicantEmail,
                    phone: faker.phone.number(),
                    links: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => faker.internet.url()),
                    skills: Array.from({ length: faker.number.int({min: 4, max: 8}) }, () => faker.word.noun()),
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
            const applicantNotes = seededApplicants.slice(0, 10).map(applicant => {
                const author = faker.helpers.arrayElement(seededUsers);
                return {
                    applicant_id: applicant.id,
                    user_id: author.id,
                    author_name: author.user_metadata.full_name,
                    author_avatar: author.user_metadata.avatar_url,
                    note: faker.lorem.sentence(),
                    created_at: faker.date.recent().toISOString()
                }
            });
            const { error: notesError } = await supabase.from('applicant_notes').insert(applicantNotes);
            if (notesError) console.error("Error seeding applicant_notes:", notesError.message);
            else console.log('  - Seeded applicant_notes');
        }

        // Seed Interviews
        if (seededApplicants) {
            const interviews = Array.from({ length: 12 }, () => {
                const applicant = faker.helpers.arrayElement(seededApplicants);
                const interviewer = faker.helpers.arrayElement(seededUsers.filter(u => u.user_metadata?.role === 'interviewer' || u.user_metadata?.role === 'hr_manager'));
                const job = seededJobs.find(j => j.id === applicant.job_id);
                return {
                    applicant_id: applicant.id,
                    interviewer_id: interviewer.id,
                    candidate_name: applicant.name,
                    candidate_avatar: applicant.avatar,
                    job_title: job?.title || faker.person.jobTitle(),
                    interviewer_name: interviewer.user_metadata.full_name,
                    interviewer_avatar: interviewer.user_metadata.avatar_url,
                    date: faker.date.future().toISOString(),
                    time: '10:00 AM',
                    type: faker.helpers.arrayElement(['Video', 'Phone', 'In-person']),
                    status: faker.helpers.arrayElement(['Scheduled', 'Completed', 'Canceled'])
                }
            });
            const { error: interviewsError } = await supabase.from('interviews').insert(interviews);
            if (interviewsError) console.error("Error seeding interviews:", interviewsError.message);
            else console.log('  - Seeded interviews');
        }
    }

    // Seed Onboarding
    const onboardingWorkflows = Array.from({ length: 5 }, () => {
        const employee = faker.helpers.arrayElement(seededUsers.filter(u => u.user_metadata?.role === 'employee'));
        const manager = faker.helpers.arrayElement(seededUsers.filter(u => u.user_metadata?.role === 'hr_manager'));
        const buddy = faker.helpers.arrayElement(seededUsers.filter(u => u.user_metadata?.role === 'employee'));
        return {
            user_id: employee.id,
            manager_id: manager.id,
            buddy_id: buddy.id,
            employee_name: employee.user_metadata.full_name,
            employee_avatar: employee.user_metadata.avatar_url,
            job_title: faker.person.jobTitle(),
            manager_name: manager.user_metadata.full_name,
            buddy_name: buddy.user_metadata.full_name,
            progress: faker.number.int({ min: 10, max: 100 }),
            current_step: faker.helpers.arrayElement(['IT Setup', 'HR Orientation', 'Department Intro']),
            start_date: faker.date.past().toISOString()
        }
    });
    const { error: onboardingError } = await supabase.from('onboarding_workflows').insert(onboardingWorkflows);
    if (onboardingError) console.error("Error seeding onboarding_workflows:", onboardingError.message);
    else console.log('  - Seeded onboarding_workflows');

    // Seed Performance Reviews
    const performanceReviews = Array.from({ length: 10 }, () => {
        const employee = faker.helpers.arrayElement(seededUsers.filter(u => u.user_metadata?.role === 'employee'));
        return {
            user_id: employee.id,
            job_title: faker.person.jobTitle(),
            review_date: faker.date.future().toISOString().split('T')[0], // format as YYYY-MM-DD
            status: faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed'])
        }
    });
    const { error: perfError } = await supabase.from('performance_reviews').insert(performanceReviews);
    if (perfError) console.error("Error seeding performance_reviews:", perfError.message);
    else console.log('  - Seeded performance_reviews');

    // Seed Time Off Requests
    const timeOffRequests = Array.from({ length: 25 }, () => {
        const startDate = faker.date.between({ from: new Date(new Date().setMonth(new Date().getMonth() - 3)), to: new Date(new Date().setMonth(new Date().getMonth() + 1)) });
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + faker.number.int({min: 0, max: 5}));
        const user = faker.helpers.arrayElement(seededUsers.filter(u => u.user_metadata?.role === 'employee'));
        
        return {
            user_id: user.id,
            type: faker.helpers.arrayElement(['Vacation', 'Sick Leave', 'Personal']),
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            status: faker.helpers.arrayElement(['Pending', 'Approved', 'Rejected'])
        };
    });
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
    console.error('🔴 Seeding failed:', error);
});
