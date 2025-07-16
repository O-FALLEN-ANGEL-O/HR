
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { faker } from '@faker-js/faker';
import type { UserRole } from '@/lib/types';

// Configure dotenv to load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const departments = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Human Resources', 'Finance'];

async function main() {
  if (process.env.FORCE_DB_SEED !== 'true') {
    console.log('🌱 SKIPPING DB SEED: To run the seed script, set FORCE_DB_SEED=true in your environment.');
    return;
  }
  
  console.log('🌱 Starting database seed process...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('🔴 ERROR: Supabase URL or service key is missing. Make sure they are set in your .env.local file. Skipping seeding.');
    process.exit(0); 
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase admin client initialized.');

  // --- 1. Clean up existing auth users first ---
  console.log('🧹 Deleting existing auth users...');
  const { data: { users: existingUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error('🔴 Error listing users:', listError.message);
  } else if (existingUsers.length > 0) {
    console.log(`Found ${existingUsers.length} auth users to delete...`);
    for (const user of existingUsers) {
      await supabaseAdmin.auth.admin.deleteUser(user.id, true);
    }
    console.log(`✅ Deleted ${existingUsers.length} auth users.`);
  } else {
    console.log('✅ No existing auth users to delete.');
  }

  // --- 2. Clean up public tables ---
  // The order is critical due to foreign key constraints.
  // This order is derived from your schema.sql file.
  console.log('🧹 Cleaning up public table data...');
   const tablesToClean = [
      'generated_documents', 'payroll_entries', 'performance_reviews', 
      'performance_goals', 'attendance_logs', 'leave_applications', 'employee_salary',
      'leave_balances', 'employee_shifts', 'employee_personal_details', 
      'employee_official_details', 'interviews', 'applicant_notes', 
      'applicants', 'payroll_runs', 'performance_cycles', 'employees',
      'colleges', 'jobs', 'users', 'leave_types', 'salary_components'
   ];
  
  for (const table of tablesToClean) {
    const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all
    if (error) console.warn(`🟠 Could not clean table ${table}:`, error.message);
    else console.log(`- Cleaned ${table}`);
  }


  // --- 3. Create users ---
  const usersToCreate: { email: string; role: UserRole; fullName: string, department: string }[] = [
    { email: 'admin@hrplus.com', role: 'admin', fullName: 'Admin User', department: 'Management' },
    { email: 'super_hr@hrplus.com', role: 'super_hr', fullName: 'Super HR Susan', department: 'Human Resources' },
    { email: 'hr_manager@hrplus.com', role: 'hr_manager', fullName: 'HR Manager Harry', department: 'Human Resources' },
    { email: 'recruiter@hrplus.com', role: 'recruiter', fullName: 'Recruiter Rick', department: 'Human Resources' },
    { email: 'finance@hrplus.com', role: 'finance', fullName: 'Finance Fiona', department: 'Finance' },
    { email: 'it_admin@hrplus.com', role: 'it_admin', fullName: 'IT Admin Ira', department: 'IT' },
    { email: 'support@hrplus.com', role: 'support', fullName: 'Support Steve', department: 'IT' },
    { email: 'manager@hrplus.com', role: 'manager', fullName: 'Manager Mike', department: 'Engineering' },
    { email: 'team_lead@hrplus.com', role: 'team_lead', fullName: 'Team Lead Tina', department: 'Engineering' },
    { email: 'interviewer@hrplus.com', role: 'interviewer', fullName: 'Interviewer Ingrid', department: 'Engineering' },
    { email: 'employee@hrplus.com', role: 'employee', fullName: 'Employee Eric', department: 'Engineering' },
    { email: 'intern@hrplus.com', role: 'intern', fullName: 'Intern Ian', department: 'Engineering' },
  ];
  
  for (let i = 0; i < 40; i++) {
    const department = faker.helpers.arrayElement(departments);
    usersToCreate.push({
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['employee', 'interviewer', 'team_lead']),
      fullName: faker.person.fullName(),
      department: department
    })
  }

  console.log(`👤 Creating ${usersToCreate.length} users with password "password"...`);
  const createdUsers: any[] = [];
  for (const userData of usersToCreate) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: 'password',
      email_confirm: true,
    });
  
    if (error) {
      console.error(`🔴 Error creating auth user ${userData.email}: ${error.message}`);
    } else if (data.user) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          email: userData.email,
          full_name: userData.fullName,
          role: userData.role,
          department: userData.department,
          avatar_url: faker.image.avatar(),
          profile_setup_complete: true,
        }).select().single();
        
      if(profileError) {
          console.error(`🔴 Error creating public user profile for ${userData.email}: ${profileError.message}`);
      } else if (profile) {
          createdUsers.push(profile);
      }
    }
  }
  console.log(`✅ Successfully created ${createdUsers.length} users.`);


  // --- 4. SEED APPLICATION DATA ---
  if (createdUsers.length === 0) {
      console.error("🔴 No users were created, cannot seed dependent data. Aborting.");
      return;
  }
  
  console.log('🌱 Seeding data based on the provided schema.sql...');

  // Employees
  console.log('🌱 Seeding Employees...');
  const employeesToInsert = createdUsers.map(user => ({
      id: faker.string.uuid(),
      user_id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      department: user.department,
      role: user.role,
      joining_date: faker.date.past({ years: 2 }),
      status: 'active'
  }));
  const { data: createdEmployees } = await supabaseAdmin.from('employees').insert(employeesToInsert).select();
  console.log(`✅ Inserted ${createdEmployees?.length || 0} employees.`);

  if (!createdEmployees || createdEmployees.length === 0) {
      console.error("🔴 No employees were created, cannot seed dependent data. Aborting.");
      return;
  }

  // Employee Personal & Official Details
  console.log('🌱 Seeding Employee Details...');
  const personalDetails = createdEmployees.map(emp => ({
      employee_id: emp.id,
      gender: faker.person.gender(),
      dob: faker.date.birthdate(),
      blood_group: faker.helpers.arrayElement(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']),
      nationality: 'Indian',
      marital_status: faker.helpers.arrayElement(['Single', 'Married']),
      emergency_contact: faker.phone.number(),
      address: faker.location.streetAddress(true),
  }));
  await supabaseAdmin.from('employee_personal_details').insert(personalDetails);
  console.log(`✅ Inserted ${personalDetails.length} personal details records.`);

  const officialDetails = createdEmployees.map(emp => ({
      employee_id: emp.id,
      pan_number: faker.string.alphanumeric(10).toUpperCase(),
      aadhaar_number: faker.string.numeric(12),
      account_number: faker.finance.accountNumber(),
      ifsc_code: faker.finance.bic(),
      bank_name: faker.company.name() + ' Bank',
  }));
  await supabaseAdmin.from('employee_official_details').insert(officialDetails);
  console.log(`✅ Inserted ${officialDetails.length} official details records.`);


  // Leave Types
  console.log('🌱 Seeding Leave Types...');
  const leaveTypes = [
      { name: 'Sick Leave', max_days_per_year: 12, is_paid: true },
      { name: 'Casual Leave', max_days_per_year: 12, is_paid: true },
      { name: 'Earned Leave', max_days_per_year: 15, is_paid: true, carry_forward: true, carry_forward_limit: 10 },
      { name: 'Unpaid Leave', max_days_per_year: 90, is_paid: false },
  ];
  const { data: createdLeaveTypes } = await supabaseAdmin.from('leave_types').insert(leaveTypes).select();
  console.log(`✅ Inserted ${createdLeaveTypes?.length || 0} leave types.`);

  if (!createdLeaveTypes || createdLeaveTypes.length === 0) {
      console.error("🔴 No leave types created. Aborting further leave seeding.");
      return;
  }
  
  // Leave Balances
  console.log('🌱 Seeding Leave Balances...');
  const leaveBalances = [];
  for (const emp of createdEmployees) {
      for (const lt of createdLeaveTypes) {
          leaveBalances.push({
              employee_id: emp.id,
              leave_type_id: lt.id,
              balance_days: lt.max_days_per_year,
              year: new Date().getFullYear(),
          });
      }
  }
  await supabaseAdmin.from('leave_balances').insert(leaveBalances);
  console.log(`✅ Inserted ${leaveBalances.length} leave balance records.`);

  // Leave Applications
  console.log('🌱 Seeding Leave Applications...');
  const leaveApplications = [];
  for (let i=0; i<200; i++) {
      const employee = faker.helpers.arrayElement(createdEmployees);
      const leaveType = faker.helpers.arrayElement(createdLeaveTypes);
      const startDate = faker.date.past({ years: 1 });
      const endDate = new Date(startDate.getTime() + faker.number.int({ min: 1, max: 5 }) * 24 * 60 * 60 * 1000);
      leaveApplications.push({
          employee_id: employee.id,
          leave_type_id: leaveType.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          reason: faker.lorem.sentence(),
          status: faker.helpers.arrayElement(['approved', 'rejected', 'pending']),
          approved_by: faker.helpers.arrayElement(createdEmployees).id,
      });
  }
  await supabaseAdmin.from('leave_applications').insert(leaveApplications);
  console.log(`✅ Inserted ${leaveApplications.length} leave applications.`);

  // Salary Components
  console.log('🌱 Seeding Salary Components...');
  const salaryComponents = [
      { name: 'Basic Salary', code: 'BASIC', component_type: 'earning', is_taxable: true },
      { name: 'House Rent Allowance', code: 'HRA', component_type: 'earning', is_taxable: true },
      { name: 'Provident Fund', code: 'PF', component_type: 'deduction' },
      { name: 'Professional Tax', code: 'PT', component_type: 'deduction' },
      { name: 'Performance Bonus', code: 'BONUS', component_type: 'earning', is_variable: true, is_taxable: true },
  ];
  const { data: createdSalaryComponents } = await supabaseAdmin.from('salary_components').insert(salaryComponents).select();
  console.log(`✅ Inserted ${createdSalaryComponents?.length || 0} salary components.`);

  // Employee Salary
  if (createdSalaryComponents && createdSalaryComponents.length > 0) {
      console.log('🌱 Seeding Employee Salaries...');
      const employeeSalaries = [];
      for (const emp of createdEmployees) {
          employeeSalaries.push({
              employee_id: emp.id,
              component_id: createdSalaryComponents.find(c => c.code === 'BASIC')?.id,
              amount: faker.finance.amount({ min: 25000, max: 80000 }),
              effective_from: emp.joining_date
          });
           employeeSalaries.push({
              employee_id: emp.id,
              component_id: createdSalaryComponents.find(c => c.code === 'HRA')?.id,
              amount: faker.finance.amount({ min: 10000, max: 30000 }),
              effective_from: emp.joining_date
          });
      }
      await supabaseAdmin.from('employee_salary').insert(employeeSalaries);
      console.log(`✅ Inserted ${employeeSalaries.length} employee salary records.`);
  }

  // Performance Cycles
  console.log('🌱 Seeding Performance Cycles...');
  const performanceCycles = [
      { name: 'Annual Review 2023', start_date: '2023-04-01', end_date: '2024-03-31', status: 'completed' },
      { name: 'H1 2024 Review', start_date: '2024-04-01', end_date: '2024-09-30', status: 'active' }
  ];
  const { data: createdCycles } = await supabaseAdmin.from('performance_cycles').insert(performanceCycles).select();
  console.log(`✅ Inserted ${createdCycles?.length || 0} performance cycles.`);

  // Performance Goals & Reviews
  if (createdCycles && createdCycles.length > 0) {
      console.log('🌱 Seeding Performance Goals & Reviews...');
      const goals = [];
      const reviews = [];
      for(const emp of createdEmployees) {
          goals.push({
              employee_id: emp.id,
              cycle_id: createdCycles[1].id,
              title: faker.lorem.sentence(),
              description: faker.lorem.paragraph(),
              status: 'approved'
          });
          reviews.push({
              employee_id: emp.id,
              reviewer_id: faker.helpers.arrayElement(createdEmployees).id,
              cycle_id: createdCycles[0].id,
              rating: faker.number.float({min: 2.5, max: 5.0, precision: 0.1}),
              feedback: faker.lorem.paragraph(),
              status: 'completed'
          });
      }
      await supabaseAdmin.from('performance_goals').insert(goals);
      console.log(`✅ Inserted ${goals.length} performance goals.`);
      await supabaseAdmin.from('performance_reviews').insert(reviews);
      console.log(`✅ Inserted ${reviews.length} performance reviews.`);
  }

  console.log('✅ Database seeding process completed successfully!');
}

main().catch(error => {
    console.error('🔴 Seeding failed:', error);
    process.exit(1);
});
