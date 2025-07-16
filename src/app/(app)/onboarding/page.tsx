
import { Header } from '@/components/header';
import { OnboardingForm } from './form';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/supabase/user';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
    const cookieStore = cookies();
    const user = await getUser(cookieStore);

    if (!user) {
        return redirect('/login');
    }
    
    // This should not happen if middleware is correct, but as a safeguard:
    if (user.profile_setup_complete) {
        return redirect('/');
    }

    return (
        <div className="flex flex-1 flex-col">
            <Header title="Complete Your Onboarding" />
            <main className="flex-1 p-4 md:p-6">
              <div className="mx-auto w-full max-w-4xl">
                   <OnboardingForm user={user} />
              </div>
            </main>
        </div>
    );
}
