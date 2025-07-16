
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
  const { data: { users: existingAuthUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('🔴 Error listing auth users:', listError.message);
  } else if (existingAuthUsers.length > 0) {
    console.log(`Found ${existingAuthUsers.length} auth users to delete...`);
    for (const user of existingAuthUsers) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
    console.log(`✅ Deleted ${existingAuthUsers.length} auth users.`);
  } else {
    console.log('No existing auth users to delete.');
  }

  // The `public.users` table should be automatically cleaned by the cascade delete trigger.
  // Truncating the public.users table just in case.
  const { error: truncateError } = await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (truncateError) {
      console.warn(`Could not truncate public.users table: ${truncateError.message}. This might be okay if cascade delete worked.`);
  } else {
      console.log('✅ Cleaned public.users table.');
  }


  const usersToCreate = [
    { email: 'john.admin@company.com', role: 'admin', full_name: 'John Admin', department: 'Executive' },
    { email: 'sarah.hr@company.com', role: 'hr_manager', full_name: 'Sarah HR', department: 'Human Resources' },
    { email: 'mike.recruiter@company.com', role: 'recruiter', full_name: 'Mike Recruiter', department: 'Human Resources' },
    { email: 'emily.manager@company.com', role: 'manager', full_name: 'Emily Manager', department: 'Engineering' },
    { email: 'david.teamlead@company.com', role: 'team_lead', full_name: 'David TeamLead', department: 'Engineering' },
    { email: 'lisa.employee@company.com', role: 'employee', full_name: 'Lisa Employee', department: 'Engineering' },
    { email: 'tom.intern@company.com', role: 'intern', full_name: 'Tom Intern', department: 'Engineering' },
    { email: 'rachel.finance@company.com', role: 'finance', full_name: 'Rachel Finance', department: 'Finance' },
    { email: 'alex.support@company.com', role: 'support', full_name: 'Alex Support', department: 'IT' },
    { email: 'emma.auditor@company.com', role: 'auditor', full_name: 'Emma Auditor', department: 'Finance' },
    { email: 'noah.interviewer@company.com', role: 'interviewer', full_name: 'Noah Interviewer', department: 'Product' },
    { email: 'olivia.superhr@company.com', role: 'super_hr', full_name: 'Olivia SuperHR', department: 'Human Resources' },
    { email: 'james.it@company.com', role: 'it_admin', full_name: 'James IT', department: 'IT' },
  ];

  console.log(`👤 Creating ${usersToCreate.length} users with password "password"...`);
  let createdCount = 0;
  const publicUsersToInsert = [];

  for (const userData of usersToCreate) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: 'password', // Set the password here
      email_confirm: true,
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
        publicUsersToInsert.push({
            id: authData.user.id,
            full_name: userData.full_name,
            email: userData.email,
            role: userData.role,
            department: userData.department,
            profile_setup_complete: true,
            avatar_url: `https://i.pravatar.cc/150?u=${userData.email}`
        });
        createdCount++;
    }
  }

  if (createdCount > 0) {
    console.log(`\n✅ Successfully created ${createdCount} auth users.`);
    console.log(`✍️ Inserting ${publicUsersToInsert.length} profiles into public.users table...`);
    
    // The public.users table is now populated by a trigger, so we check if it was already created.
    // If not, we insert it manually. This is a robust way to handle both cases.
    for (const publicUser of publicUsersToInsert) {
        const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('id', publicUser.id).single();
        if (!existingUser) {
            const { error: insertPublicError } = await supabaseAdmin
                .from('users')
                .insert(publicUser);
            if (insertPublicError) {
                 console.error(`🔴 Error inserting public profile for ${publicUser.email}: ${insertPublicError.message}`);
            }
        }
    }
    
    console.log('✅ Public user profiles verified/inserted.');
  } else {
    console.error('\n🔴 Seed process failed. No auth users were created.');
  }

  console.log('\n🎉 User seed process complete!');
}

seed().catch(e => {
  console.error("🔴 Script failed with an unhandled error:", e);
  process.exit(1);
});
