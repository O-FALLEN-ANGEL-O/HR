
import { createClient, type User } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import path from 'path';
import type { UserRole } from '../types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });


// The seed script will only run in production environments (like Vercel builds)
// to prevent accidental data wipes during local development, unless forced.
if (process.env.NODE_ENV === 'production' || process.env.FORCE_DB_SEED === 'true') {
  console.log('🌱 Starting database seed process...');
} else {
  console.log('🌱 SKIPPING DB SEED: NODE_ENV is not "production" and FORCE_DB_SEED is not "true".');
  process.exit(0);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('🔴 ERROR: Supabase URL or service key is missing. Skipping seeding.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearData() {
  console.log('🗑️  Clearing existing data...');
  
  const tablesToDelete = [
    'kudos',
    'weekly_awards',
    'company_posts',
    'payslips',
    'company_documents',
    'applicant_notes',
    'leaves',
    'leave_balances',
    'onboarding_workflows',
    'interviews',
    'applicants',
    'colleges',
    'jobs',
    'metrics',
    'performance_reviews'
  ];

  for (const table of tablesToDelete) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error && error.code !== '42P01') { // 42P01: relation does not exist - ignore if table not found
      console.error(`Error clearing table ${table}:`, error.message);
    }
  }

  console.log('🗑️  Clearing auth users...');
  let hasMoreUsers = true;
  let page = 0;
  let totalCleared = 0;
  while(hasMoreUsers) {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 50 });
      if (error) {
        console.error('Error listing auth users:', error.message);
        break;
      }
      if (users.length > 0) {
        const usersToDelete = users.filter(user => user.email && !user.email.endsWith('@supabase.com'));
        if (usersToDelete.length > 0) {
            const userDeletionPromises = usersToDelete.map(user => supabase.auth.admin.deleteUser(user.id, true));
            await Promise.all(userDeletionPromises);
            totalCleared += usersToDelete.length;
        }
      } else {
        hasMoreUsers = false;
      }
      page++;
  }
  console.log(`✅ ${totalCleared} Auth users cleared.`);

  console.log('✅ Data cleared.');
}

async function seedData() {
    console.log('🌱 Seeding data...');

    console.log('  - Seeding users...');
    const roles: UserRole[] = ['admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'employee', 'intern', 'guest', 'manager', 'team_lead'];
    const departments = ['Engineering', 'Product', 'Design', 'Sales', 'HR', 'Marketing'];
    const seededUsers: (User & { user_metadata: { role: UserRole, full_name: string, avatar_url: string, department: string }})[] = [];
    const password = 'Password123!';

    for (const role of roles) {
        const fullName = `${role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} User`;
        const email = `${role.replace(/_/g, '.')}@example.com`;
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { 
                full_name: fullName,
                avatar_url: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
                role: role,
                department: faker.helpers.arrayElement(departments)
             }
        });

        if (authError) {
            console.error(`Error creating user ${email}:`, authError.message);
            continue;
        }
        if (authData.user) {
            console.log(`    - Created ${role} user: ${email} (pw: ${password})`);
            seededUsers.push(authData.user as any);
        }
    }
    
    for (let i = 0; i < 25; i++) {
        const fullName = faker.person.fullName();
        const email = faker.internet.email({ firstName: fullName.split(' ')[0], lastName: fullName.split(' ')[1] }).toLowerCase();
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { 
                full_name: fullName,
                avatar_url: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
                role: 'employee',
                department: faker.helpers.arrayElement(departments)
            }
        });
        if (authError) {
            console.error(`Error creating employee user ${email}:`, authError.message);
        } else if (authData.user) {
            seededUsers.push(authData.user as any);
        }
    }

    console.log(`  - Total users successfully created: ${seededUsers.length}`);

    const metrics = [
        { title: 'Total Employees', value: seededUsers.filter(u => u.user_metadata.role !== 'intern').length.toString(), change: `+${faker.number.int({ min: 1, max: 15 })}%`, change_type: 'increase' as const },
        { title: 'Attrition Rate', value: `${faker.number.float({ min: 1, max: 10, multipleOf: 0.1 })}%`, change: `-${faker.number.float({ min: 0.1, max: 2, multipleOf: 0.1 })}%`, change_type: 'decrease' as const },
        { title: 'Open Positions', value: faker.number.int({ min: 5, max: 20 }).toString(), change: `-${faker.number.int({ min: 1, max: 5 })}%`, change_type: 'decrease' as const },
        { title: 'Applicants/Week', value: faker.number.int({ min: 20, max: 100 }).toString(), change: `+${faker.number.int({ min: 1, max: 5 })}%`, change_type: 'increase' as const }
    ];
    await supabase.from('metrics').insert(metrics);
    console.log('  - Seeded metrics');

    const jobs = Array.from({ length: 15 }, () => ({
        title: faker.person.jobTitle(),
        department: faker.helpers.arrayElement(departments),
        description: faker.lorem.paragraphs(3),
        status: faker.helpers.arrayElement(['Open', 'Closed', 'On hold']),
        posted_date: faker.date.past().toISOString(),
        applicants: faker.number.int({ min: 0, max: 100 }),
    }));
    const { data: seededJobs } = await supabase.from('jobs').insert(jobs).select('id, title');
    console.log('  - Seeded jobs');

    const collegesToSeed = Array.from({ length: 8 }, () => ({
        name: `${faker.location.city()} University`,
        status: faker.helpers.arrayElement(['Invited', 'Confirmed', 'Attended', 'Declined']),
        contact_email: faker.internet.email(),
        last_contacted: faker.date.past().toISOString()
    }));
    const { data: seededColleges } = await supabase.from('colleges').insert(collegesToSeed).select('id');
    console.log('  - Seeded colleges');

    const applicants = (seededJobs && seededColleges) ? Array.from({ length: 50 }, () => ({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number(),
        job_id: faker.helpers.arrayElement(seededJobs).id,
        college_id: faker.datatype.boolean() ? faker.helpers.arrayElement(seededColleges).id : null,
        stage: faker.helpers.arrayElement(['Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired']),
        applied_date: faker.date.past().toISOString(),
        avatar: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
        source: 'walk-in' as const,
        wpm: faker.number.int({ min: 40, max: 100 }),
        accuracy: faker.number.int({ min: 90, max: 100 }),
        aptitude_score: faker.number.int({ min: 70, max: 100 }),
        comprehensive_score: faker.number.int({ min: 70, max: 100 }),
        english_grammar_score: faker.number.int({ min: 70, max: 100 }),
        customer_service_score: faker.number.int({ min: 70, max: 100 }),
    })) : [];
    const { data: seededApplicants } = await supabase.from('applicants').insert(applicants).select();
    console.log('  - Seeded applicants');
    
    if (seededApplicants && seededUsers.length > 0) {
        const applicantNotes = seededApplicants.slice(0, 20).map(applicant => ({
            applicant_id: applicant.id,
            user_id: faker.helpers.arrayElement(seededUsers).id,
            author_name: faker.helpers.arrayElement(seededUsers).user_metadata.full_name,
            author_avatar: faker.helpers.arrayElement(seededUsers).user_metadata.avatar_url,
            note: faker.lorem.sentence(),
        }));
        await supabase.from('applicant_notes').insert(applicantNotes);
        console.log('  - Seeded applicant_notes');
    }
    
    const interviewers = seededUsers.filter(u => ['interviewer', 'hr_manager', 'recruiter'].includes(u.user_metadata.role));
    if (seededApplicants && interviewers.length > 0 && seededJobs) {
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
        await supabase.from('interviews').insert(interviews);
        console.log('  - Seeded interviews');
    }
    
    const employeesForOnboarding = seededUsers.filter(u => u.user_metadata.role === 'employee');
    const managers = seededUsers.filter(u => u.user_metadata.role === 'manager' || u.user_metadata.role === 'admin' || u.user_metadata.role === 'super_hr');
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
        await supabase.from('onboarding_workflows').insert(onboardingWorkflows);
        console.log('  - Seeded onboarding_workflows');
    }

    const employeeUsers = seededUsers.filter(u => u.user_metadata.role !== 'guest');
    if (employeeUsers.length > 0) {
        const leaveBalances = employeeUsers.map(u => ({
            user_id: u.id,
            sick_leave: 12,
            casual_leave: 10,
            earned_leave: 15,
            unpaid_leave: 0
        }));
        await supabase.from('leave_balances').insert(leaveBalances);
        console.log('  - Seeded leave balances');

        const managersForApproval = seededUsers.filter(u => ['admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'].includes(u.user_metadata.role));

        if (managersForApproval.length > 0) {
            const leaves = Array.from({length: 150}, () => {
                const user = faker.helpers.arrayElement(employeeUsers);
                const approver = faker.helpers.arrayElement(managersForApproval);
                const startDate = faker.date.between({ from: new Date(new Date().setMonth(new Date().getMonth() - 3)), to: new Date(new Date().setMonth(new Date().getMonth() + 1)) });
                const totalDays = faker.number.int({min: 1, max: 5})
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + totalDays - 1);
                return {
                    user_id: user.id,
                    leave_type: faker.helpers.arrayElement(['sick', 'casual', 'earned', 'unpaid']),
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    total_days: totalDays,
                    reason: faker.lorem.sentence(),
                    status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
                    approver_id: approver.id
                }
            });
            await supabase.from('leaves').insert(leaves);
            console.log('  - Seeded leaves');
        }
    }
    
    const hrUsers = seededUsers.filter(u => ['admin', 'super_hr', 'hr_manager'].includes(u.user_metadata.role));
    if (hrUsers.length > 0) {
        const companyPosts = Array.from({length: 8}, () => ({
            author_id: faker.helpers.arrayElement(hrUsers).id,
            content: faker.lorem.paragraph(),
            image_url: faker.datatype.boolean() ? `https://placehold.co/600x400.png` : undefined,
        }));
        await supabase.from('company_posts').insert(companyPosts);
        console.log('  - Seeded company posts');
    }

    const allEmployees = seededUsers.filter(u => ['employee', 'manager', 'team_lead', 'recruiter', 'hr_manager'].includes(u.user_metadata.role));
    if (allEmployees.length > 1 && hrUsers.length > 0) {
        const kudos = Array.from({length: 25}, () => {
            const fromUser = faker.helpers.arrayElement(allEmployees);
            const toUser = faker.helpers.arrayElement(allEmployees.filter(u => u.id !== fromUser.id));
            return {
                from_user_id: fromUser.id,
                to_user_id: toUser.id,
                message: faker.lorem.sentence(),
                value: faker.helpers.arrayElement(['Team Player', 'Innovation', 'Customer First', 'Ownership']),
            }
        });
        await supabase.from('kudos').insert(kudos);
        console.log('  - Seeded kudos');

        const employeeOfTheWeek = faker.helpers.arrayElement(allEmployees);
        const awardedBy = faker.helpers.arrayElement(hrUsers);
        if (employeeOfTheWeek && awardedBy) {
            const weeklyAward = {
                user_id: employeeOfTheWeek.id,
                awarded_by_user_id: awardedBy.id,
                reason: faker.lorem.sentences(2),
                week_of: new Date().toISOString()
            };
            await supabase.from('weekly_awards').insert(weeklyAward);
            console.log('  - Seeded weekly award');
        }
    }
    
    if (employeeUsers.length > 0) {
        const payslips = employeeUsers.flatMap(employee => {
            return Array.from({length: 6}, (_, i) => {
                const date = faker.date.past({refDate: new Date(new Date().setMonth(new Date().getMonth() - i))});
                const gross = faker.number.int({min: 4000, max: 8000});
                return {
                    user_id: employee.id,
                    month: date.toLocaleString('default', { month: 'long' }),
                    year: date.getFullYear(),
                    gross_salary: gross,
                    net_salary: gross * faker.number.float({min: 0.75, max: 0.85}),
                    download_url: '#'
                }
            })
        });
        await supabase.from('payslips').insert(payslips);
        console.log('  - Seeded payslips');
    }
    
    const documents = [
        { title: 'Employee Handbook 2024', category: 'HR Policies', description: 'The official guide to company policies, procedures, and culture.', last_updated: faker.date.recent().toISOString(), download_url: '#' },
        { title: 'Work From Home Policy', category: 'HR Policies', description: 'Guidelines and best practices for remote work.', last_updated: faker.date.recent().toISOString(), download_url: '#' },
        { title: 'IT Security Guidelines', category: 'IT Policies', description: 'Procedures for maintaining the security of company data and systems.', last_updated: faker.date.recent().toISOString(), download_url: '#' },
        { title: 'Code of Conduct', category: 'HR Policies', description: 'Our commitment to a respectful and inclusive workplace.', last_updated: faker.date.recent().toISOString(), download_url: '#' },
    ];
    await supabase.from('company_documents').insert(documents);
    console.log('  - Seeded company documents');

    // Seed Performance Reviews
    if (employeeUsers.length > 0) {
        const reviews = employeeUsers.map(user => ({
            user_id: user.id,
            job_title: faker.person.jobTitle(),
            review_date: faker.date.past(),
            status: faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed']),
        }));
        await supabase.from('performance_reviews').insert(reviews);
        console.log('  - Seeded performance reviews');
    }
}


async function run() {
  await clearData();
  await seedData();
  console.log('🎉 Database seeding complete!');
}

run().catch(error => {
    console.error('🔴 Seeding failed:', error);
    process.exit(1);
});
