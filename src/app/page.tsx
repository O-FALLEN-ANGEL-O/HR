
import { redirect } from 'next/navigation';

// This page now acts as the main entry point and immediately redirects to the login page
// which will then handle role selection and redirection.
export default async function Home() {
  redirect('/login');
}
