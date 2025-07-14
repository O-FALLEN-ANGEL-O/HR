import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { College } from '@/lib/types';
import CollegeDriveClient from './client';

export default async function CollegeDrivePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('colleges')
    .select('*, applicants(count)')
    .order('last_contacted', { ascending: false });

  if (error) {
    console.error('Error fetching colleges:', error);
  }

  const colleges: College[] = (data || []).map(c => ({
    ...c,
    resumes_received: c.applicants[0]?.count || 0,
  }));

  return <CollegeDriveClient initialColleges={colleges} />;
}
