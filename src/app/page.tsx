
import { redirect } from 'next/navigation';

// This page now acts as the main entry point and immediately redirects every user
// to the main employee dashboard, which serves as the company homepage.
export default async function Home() {
    redirect('/employee/dashboard');
}
