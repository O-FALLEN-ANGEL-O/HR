'use server';

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

  if (adminProfile?.role !== 'admin') {
    throw new Error('You do not have permission to change user roles.');
  }
  
  // Update the target user's role
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    throw new Error(`Could not update user role: ${error.message}`);
  }

  revalidatePath('/admin/roles');
}
