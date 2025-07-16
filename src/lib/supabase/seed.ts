
'use server';

import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseServiceRoleKey } from './config';

// This is the admin client, created once and reused.
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!);


async function seed() {
  console.log('🌱 Starting database user seed process...');

  if (!supabaseAdmin) {
    console.error('🔴 Supabase admin client is not initialized. Aborting.');
    return;
  }
  console.log('✅ Supabase admin client initialized.');

  // 1. Clean up existing auth users
  console.log('🧹 Deleting existing auth users...');
  const { data: { users: existingAuthUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('🔴 Error listing auth users:', listError.message);
  } else if (existingAuthUsers.length > 0) {
    const usersToDelete = existingAuthUsers.filter(u => u.email?.endsWith('@company.com'));
    console.log(`Found ${usersToDelete.length} auth users to delete...`);
    for (const user of usersToDelete) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
    console.log(`✅ Deleted ${usersToDelete.length} auth users.`);
  } else {
    console.log('No existing auth users to delete.');
  }

  // The `public.users` table should be automatically cleaned by the cascade delete trigger.
  const { error: truncateError } = await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (truncateError) {
      console.warn(`Could not truncate public.users table: ${truncateError.message}. This might be okay if cascade delete worked.`);
  } else {
      console.log('✅ Cleaned public.users table.');
  }

  const usersToCreate = [
    { email: 'john.admin@company.com', role: 'admin', full_name: 'John Admin', department: 'Executive' },
    { email: 'olivia.superhr@company.com', role: 'super_hr', full_name: 'Olivia SuperHR', department: 'Human Resources' },
    { email: 'sarah.hr@company.com', role: 'hr_manager', full_name: 'Sarah HR', department: 'Human Resources' },
    { email: 'mike.recruiter@company.com', role: 'recruiter', full_name: 'Mike Recruiter', department: 'Human Resources' },
    { email: 'emily.manager@company.com', role: 'manager', full_name: 'Emily Manager', department: 'Engineering' },
    { email: 'david.teamlead@company.com', role: 'team_lead', full_name: 'David TeamLead', department: 'Engineering' },
    { email: 'lisa.employee@company.com', role: 'employee', full_name: 'Lisa Employee', department: 'Engineering' },
    { email: 'tom.intern@company.com', role: 'intern', full_name: 'Tom Intern', department: 'Engineering' },
    { email: 'rachel.finance@company.com', role: 'finance', full_name: 'Rachel Finance', department: 'Finance' },
    { email: 'james.it@company.com', role: 'it_admin', full_name: 'James IT', department: 'IT' },
    { email: 'alex.support@company.com', role: 'support', full_name: 'Alex Support', department: 'IT' },
    { email: 'emma.auditor@company.com', role: 'auditor', full_name: 'Emma Auditor', department: 'Finance' },
    { email: 'noah.interviewer@company.com', role: 'interviewer', full_name: 'Noah Interviewer', department: 'Product' },
  ];

  console.log(`👤 Creating ${usersToCreate.length} users with password "password123"...`);
  let createdCount = 0;
  
  for (const userData of usersToCreate) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: 'password123',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role,
        department: userData.department,
      },
    });

    if (authError) {
      console.error(`🔴 Error creating auth user ${userData.email}: ${authError.message}`);
    } else if (authData.user) {
        console.log(`- Created auth user: ${authData.user.email}`);
        
        // Manually insert into the public.users table
        const { error: insertPublicError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                full_name: userData.full_name,
                email: userData.email,
                role: userData.role,
                department: userData.department,
                profile_setup_complete: true,
                avatar_url: `https://i.pravatar.cc/150?u=${userData.email}`
            });

        if (insertPublicError) {
             console.error(`🔴 Error inserting public profile for ${userData.email}: ${insertPublicError.message}`);
             // Rollback: If this fails, delete the auth user we just created to avoid orphans
             await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } else {
            createdCount++;
        }
    }
  }

  if (createdCount === usersToCreate.length) {
    console.log(`\n✅ Successfully created and synced ${createdCount} users.`);
  } else {
    console.error(`\n🔴 Seed process partially failed. Only ${createdCount}/${usersToCreate.length} users were created successfully.`);
  }

  console.log('\n🎉 User seed process complete!');
}

seed().catch(e => {
  console.error("🔴 Script failed with an unhandled error:", e);
  process.exit(1);
});
