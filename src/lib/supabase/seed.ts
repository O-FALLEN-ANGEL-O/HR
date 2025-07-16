
'use server';

// A simple seed script to create users with different roles.
// This script is intended to be run from the command line.

import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseServiceRoleKey } from '@/lib/supabase/config';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or service role key is not defined.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole_key);

async function seed() {
  console.log('🌱 Starting database seed process...');
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

  const usersToCreate = [
    { email: 'john.admin@company.com', role: 'admin', full_name: 'John Admin' },
    { email: 'sarah.hr@company.com', role: 'hr_manager', full_name: 'Sarah HR' },
    { email: 'mike.recruiter@company.com', role: 'recruiter', full_name: 'Mike Recruiter' },
    { email: 'emily.manager@company.com', role: 'manager', full_name: 'Emily Manager' },
    { email: 'david.teamlead@company.com', role: 'team_lead', full_name: 'David TeamLead' },
    { email: 'lisa.employee@company.com', role: 'employee', full_name: 'Lisa Employee' },
    { email: 'tom.intern@company.com', role: 'intern', full_name: 'Tom Intern' },
    { email: 'rachel.finance@company.com', role: 'finance', full_name: 'Rachel Finance' },
    { email: 'alex.support@company.com', role: 'support', full_name: 'Alex Support' },
    { email: 'emma.auditor@company.com', role: 'auditor', full_name: 'Emma Auditor' },
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
      },
    });

    if (authError) {
      console.error(`🔴 Error creating auth user ${userData.email}: ${authError.message}`);
    } else if (authData.user) {
      // The public.users table should be populated by the trigger.
      // We can verify or update if needed, but the trigger is the primary mechanism.
      console.log(`- Created auth user: ${authData.user.email}`);
      createdCount++;
    }
  }

  console.log(`✅ Successfully created ${createdCount} users.`);
  
  if (createdCount > 0) {
    console.log('\n🎉 Seed process complete!');
    console.log('You can now log in with any of the demo accounts using the password: password123');
  } else {
    console.error('\n🔴 Seed process failed. No users were created.');
  }
}

seed().catch(e => {
  console.error("🔴 Script failed with an unhandled error:", e);
  process.exit(1);
});

    