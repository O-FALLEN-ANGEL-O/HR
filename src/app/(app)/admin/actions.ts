'use server';

import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { UserRole } from '@/lib/types';

export async function updateUserRole(userId: string, newRole: UserRole) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // First, verify the current user is an admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to perform this action.');
  }

  const { data: adminProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'super_hr') {
    throw new Error('You do not have permission to change user roles.');
  }

  // Use the admin client to update auth user metadata
  const supabaseAdmin = createAdminClient();
  const { data: { user: targetUser }, error: userError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { user_metadata: { role: newRole } }
  );

  if (userError) {
    console.error('Error updating auth user:', userError);
    throw new Error(`Could not update user's auth record: ${userError.message}`);
  }
  
  // Also update the public 'users' table for consistency
  const { error: publicProfileError } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (publicProfileError) {
    console.error('Error updating public user profile:', publicProfileError);
    // Optionally, you might want to roll back the auth update here
    throw new Error(`Could not update user's public profile: ${publicProfileError.message}`);
  }

  revalidatePath('/admin/roles');
}
