
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

// This page should no longer be accessible in the new demo flow.
// It will automatically redirect to the dashboard.
export default function LoginPage() {
  const router = useRouter();
  
  React.useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
