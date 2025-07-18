
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const DEMO_EMAILS: Record<UserRole, string> = {
    admin: 'john.admin@company.com',
    super_hr: 'olivia.superhr@company.com',
    hr_manager: 'sarah.hr@company.com',
    recruiter: 'mike.recruiter@company.com',
    manager: 'emily.manager@company.com',
    team_lead: 'david.teamlead@company.com',
    employee: 'lisa.employee@company.com',
    intern: 'tom.intern@company.com',
    interviewer: 'noah.interviewer@company.com',
    finance: 'rachel.finance@company.com',
    it_admin: 'james.it@company.com',
    support: 'alex.support@company.com',
    auditor: 'emma.auditor@company.com',
    guest: 'guest@company.com'
};

export async function loginWithRole(role: UserRole) {
  const email = DEMO_EMAILS[role];
  if (!email) {
      throw new Error(`No demo user found for role: ${role}`);
  }

  // Since the user might not exist, we can't just list them. We need their ID.
  // The most reliable way in a seeded environment is to get them by email.
  const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

  if (userError || !user) {
      console.error(`Could not find user ${email} in auth. Did you run the seed script? Error: ${userError?.message}`);
      throw new Error(`Could not find demo user for role ${role}. Please ensure the database is seeded.`);
  }
  
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // We need to generate a real session on the server side using the admin client
  const { data: sessionData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
  });

  if (linkError || !sessionData) {
      console.error(`Error generating magic link:`, linkError);
      throw new Error('Could not generate session for user.');
  }

  // The session is created by this call, but we handle it via the middleware
  // We just need to make sure we're telling the browser who we are now.
  // The middleware will handle the actual token exchange.
  
  // To make Supabase SSR client aware of the user on the next request,
  // we can manually set the session. This is a bit of a workaround for the demo environment.
  // In a real app, you'd redirect to the magic link.
  const { data: { session }, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password: 'password123'
  });

   if (sessionError || !session) {
       console.error("Session set error:", sessionError);
       throw new Error('Could not create a session for the demo user.');
   }
}

export async function logout() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  redirect('/login');
}
