
import { redirect } from 'next/navigation';

// This page now acts as the main entry point and immediately redirects to the admin dashboard.
export default async function Home() {
  redirect('/admin/dashboard');
}
