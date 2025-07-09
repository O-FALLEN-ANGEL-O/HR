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
  
  // Handle pagination to delete all users
  let allUsers: User[] = [];
  let page = 0;
  const PAGE_SIZE = 50;

  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      console.error('Error listing auth users:', error.message);
      break;
    }
    
    allUsers = allUsers.concat(users);

    if (users.length < PAGE_SIZE) {
      break; // Last page
    }
    page++;
  }

  const userDeletionPromises = allUsers
    .filter(user => user.email && !user.email.endsWith('@supabase.com'))
    .map(user => supabase.auth.admin.deleteUser(user.id, true)); // true for hard delete

  await Promise.all(userDeletionPromises);
  console.log(`✅ ${userDeletionPromises.length} Auth users cleared.`);


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
    const roles: UserRole[] = ['admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'employee', 'intern', 'guest'];
    const seededUsers: User[] = [];
    const password = 'Password123!';

    // Create role-specific users
    for (const role of roles) {
        const email = `${role.replace('_', '.')}` + '@example.com';
        const fullName = `${role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} User`;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { 
                full_name: fullName,
                avatar_url: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
                role: role
             }
        });

        if (authError) {
            console.error(`Error creating user ${email}:`, authError.message);
            continue;
        }
        if (authData.user) {
            console.log(`    - Created ${role} user: ${email} (pw: ${password})`);
            seededUsers.push(authData.user);
        }
    }
    
    // Create multiple generic employee users
    for (let i = 0; i < 15; i++) {
        const fullName = faker.person.fullName();
        const email = faker.internet.email({ firstName: fullName.split(' ')[0], lastName: fullName.split(' ')[1] }).toLowerCase();
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { 
                full_name: fullName,
                avatar_url: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
                role: 'employee'
            }
        });
        if (authError) {
            console.error(`Error creating employee user ${email}:`, authError.message);
        }
        if(authData.user) {
            seededUsers.push(authData.user);
        }
    }

    console.log(`  - Total users successfully created: ${seededUsers.length}`);

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

    const applicants = (seededJobs && seededColleges) ? Array.from({ length: 50 }, () => {
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
            avatar: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
            source: fromCollege ? 'college' as const : faker.helpers.arrayElement(['walk-in', 'email', 'manual'] as const),
            ai_match_score: faker.helpers.arrayElement([null, faker.number.int({ min: 50, max: 95 })]),
            ai_justification: faker.helpers.arrayElement([null, faker.lorem.paragraph()]),
        };
    }) : [];
    const { data: seededApplicants, error: applicantError } = await supabase.from('applicants').insert(applicants).select();
    if (applicantError) console.error("Error seeding applicants:", applicantError.message);
    else if (applicants.length > 0) console.log('  - Seeded applicants');

    // Seed Applicant Notes
    if (seededApplicants && seededApplicants.length > 0 && seededUsers.length > 0) {
        const applicantNotes = seededApplicants.slice(0, 20).map(applicant => {
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
    const interviewers = seededUsers.filter(u => ['interviewer', 'hr_manager', 'recruiter'].includes(u.user_metadata.role));
    if (seededApplicants && seededApplicants.length > 0 && interviewers.length > 0 && seededJobs) {
        const interviews = Array.from({ length: 20 }, () => {
            const applicant = faker.helpers.arrayElement(seededApplicants);
            const interviewer = faker.helpers.arrayElement(interviewers);
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
    } else {
        console.log('  - Skipped seeding interviews due to missing applicants or interviewers.');
    }
    
    // Seed Onboarding
    const employeesForOnboarding = seededUsers.filter(u => u.user_metadata.role === 'employee');
    const managers = seededUsers.filter(u => u.user_metadata.role === 'hr_manager');
    if (employeesForOnboarding.length > 5 && managers.length > 0) {
        const onboardingWorkflows = employeesForOnboarding.slice(0, 5).map(employee => {
            const manager = faker.helpers.arrayElement(managers);
            const buddy = faker.helpers.arrayElement(employeesForOnboarding.filter(e => e.id !== employee.id));
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
    } else {
        console.log('  - Skipped seeding onboarding_workflows due to insufficient users.');
    }

    // Seed Time Off Requests
    const employeesForTimeOff = seededUsers.filter(u => ['employee', 'hr_manager', 'recruiter'].includes(u.user_metadata.role));
    if (employeesForTimeOff.length > 0) {
        const timeOffRequests = Array.from({ length: 25 }, () => {
            const startDate = faker.date.between({ from: new Date(new Date().setMonth(new Date().getMonth() - 3)), to: new Date(new Date().setMonth(new Date().getMonth() + 1)) });
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + faker.number.int({min: 0, max: 5}));
            const user = faker.helpers.arrayElement(employeesForTimeOff);
            
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
}


async function run() {
  await clearData();
  await seedData();
  console.log('🎉 Database seeding complete!');
}

run().catch(error => {
    console.error('🔴 Seeding failed:', error);
});
