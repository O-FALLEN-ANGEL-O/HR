

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { faker } from '@faker-js/faker';
import type { UserRole } from '@/lib/types';

// Configure dotenv to load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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

  // --- 1. Clean up existing auth users for a fresh seed ---
  console.log('🧹 Deleting existing auth users...');
  const { data: { users: existingUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error('🔴 Error listing users:', listError.message);
  } else if (existingUsers.length > 0) {
    console.log(`Found ${existingUsers.length} users to delete...`);
    // Process deletions sequentially to avoid timeouts
    for (const user of existingUsers) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id, true); // true to hard-delete
      if (deleteError) {
        console.error(`🔴 Failed to delete user ${user.id}: ${deleteError.message}`);
      }
    }
    console.log(`✅ Deleted ${existingUsers.length} auth users.`);
  } else {
    console.log('✅ No existing users to delete.');
  }

  // --- 2. Create one simple user for each role ---
  const usersToCreate: { email: string; role: UserRole; fullName: string, department: string }[] = [
    { email: 'admin@hrplus.com', role: 'admin', fullName: 'Admin User', department: 'Management' },
    { email: 'super_hr@hrplus.com', role: 'super_hr', fullName: 'Super HR Susan', department: 'Human Resources' },
    { email: 'hr_manager@hrplus.com', role: 'hr_manager', fullName: 'HR Manager Harry', department: 'Human Resources' },
    { email: 'manager@hrplus.com', role: 'manager', fullName: 'Manager Mike', department: 'Engineering' },
    { email: 'team_lead@hrplus.com', role: 'team_lead', fullName: 'Team Lead Tina', department: 'Engineering' },
    { email: 'recruiter@hrplus.com', role: 'recruiter', fullName: 'Recruiter Rick', department: 'Human Resources' },
    { email: 'interviewer@hrplus.com', role: 'interviewer', fullName: 'Interviewer Ingrid', department: 'Engineering' },
    { email: 'employee@hrplus.com', role: 'employee', fullName: 'Employee Eric', department: 'Engineering' },
    { email: 'intern@hrplus.com', role: 'intern', fullName: 'Intern Ian', department: 'Engineering' },
  ];

  console.log('👤 Creating one user for each role with password "password"...');
  for (const userData of usersToCreate) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: 'password', // Set a default password
      email_confirm: true,  // Mark email as confirmed to allow password login
      user_metadata: {
        full_name: userData.fullName,
        role: userData.role,
        department: userData.department,
        avatar_url: faker.image.avatar(),
        profile_setup_complete: true, // Mark profile as complete for seeded users
      },
    });

    if (error) {
      console.error(`🔴 Error creating user ${userData.email}: ${error.message}`);
    } else {
      console.log(`✅ Successfully created user: ${data.user?.email}`);
    }
  }

  console.log('✅ Database seeding process completed.');
}

main().catch(error => {
    console.error('🔴 Seeding failed:', error);
    process.exit(1);
});
