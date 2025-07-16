
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

async function seed() {
  console.log('🌱 Starting database user seed process...');

  if (!supabaseAdmin) {
    console.error('🔴 Supabase admin client is not initialized. Aborting.');
    return;
  }
  console.log('✅ Supabase admin client initialized.');

  // 1. Clean up existing auth users
  console.log('🧹 Deleting existing auth users...');
  const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('🔴 Error listing auth users:', listError.message);
  } else if (authUsers.length > 0) {
    console.log(`Found ${authUsers.length} auth users to delete...`);
    for (const user of authUsers) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
    console.log(`✅ Deleted ${authUsers.length} auth users.`);
  } else {
    console.log('No existing auth users to delete.');
  }

  // Note: The public.users table will be cleaned automatically by the cascade delete
  // when an auth user is deleted.

  const usersToCreate = [
    { email: 'john.admin@company.com', role: 'admin', full_name: 'John Admin' },
    { email: 'sarah.hr@company.com', role: 'hr_manager', full_name: 'Sarah HR' },
    { email: 'mike.recruiter@company.com', role: 'recruiter', full_name: 'Mike Recruiter' },
    { email: 'emily.manager@company.com', role: 'manager', full_name: 'Emily Manager', department: 'Engineering' },
    { email: 'david.teamlead@company.com', role: 'team_lead', full_name: 'David TeamLead', department: 'Engineering' },
    { email: 'lisa.employee@company.com', role: 'employee', full_name: 'Lisa Employee', department: 'Engineering' },
    { email: 'tom.intern@company.com', role: 'intern', full_name: 'Tom Intern', department: 'Engineering' },
    { email: 'rachel.finance@company.com', role: 'finance', full_name: 'Rachel Finance' },
    { email: 'alex.support@company.com', role: 'support', full_name: 'Alex Support' },
    { email: 'emma.auditor@company.com', role: 'auditor', full_name: 'Emma Auditor' },
    { email: 'noah.interviewer@company.com', role: 'interviewer', full_name: 'Noah Interviewer', department: 'Product' },
    { email: 'olivia.superhr@company.com', role: 'super_hr', full_name: 'Olivia SuperHR' },
    { email: 'james.it@company.com', role: 'it_admin', full_name: 'James IT' },
  ];

  console.log(`👤 Creating ${usersToCreate.length} users with password "password123"...`);
  let createdCount = 0;

  for (const userData of usersToCreate) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role,
        department: userData.department || 'General',
      },
    });

    if (authError) {
      console.error(`🔴 Error creating auth user ${userData.email}: ${authError.message}`);
    } else if (authData.user) {
      // The public.users table should be populated by the trigger.
      // We are only verifying the auth user was created.
      console.log(`- Created auth user: ${authData.user.email}`);
      createdCount++;
    }
  }

  if (createdCount > 0) {
    console.log(`\n✅ Successfully created ${createdCount} users.`);
    console.log('You can now log in with any of the demo accounts using the password: password123');
  } else {
    console.error('\n🔴 Seed process failed. No users were created.');
  }

   console.log('\n🎉 User seed process complete!');
}

seed().catch(e => {
  console.error("🔴 Script failed with an unhandled error:", e);
  process.exit(1);
});
