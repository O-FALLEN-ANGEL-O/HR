
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

  const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers({ email });

  if (userError || users.length === 0) {
      console.error(`Could not find user ${email} in auth. Did you run the seed script?`);
      throw new Error(`Could not find demo user for role ${role}. Please ensure the database is seeded.`);
  }

  const user = users[0];
  
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // This will create a session for the user and set the auth cookie
  const { error: sessionError } = await supabase.auth.setSession({
      access_token: 'dummy_access_token_for_ssr', // This will be replaced by the middleware
      refresh_token: 'dummy_refresh_token_for_ssr',
  });
   if (sessionError) {
       console.error("Session set error:", sessionError);
   }

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
  cookies().set('demo_role', role, { path: '/' });
}

export async function logout() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  cookieStore.delete('demo_role');
  redirect('/login');
}
