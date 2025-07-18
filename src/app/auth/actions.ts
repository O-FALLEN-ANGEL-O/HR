
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/lib/types';

export async function loginWithRole(role: UserRole) {
  const cookieStore = cookies();
  cookieStore.set('demo_role', role, { path: '/', maxAge: 60 * 60 * 24 }); // Expires in 1 day
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete('demo_role');
  redirect('/');
}
