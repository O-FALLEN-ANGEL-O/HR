
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type UserRole } from '@/lib/types';
import { loginWithRole } from '@/app/auth/actions';

const roles: { name: UserRole, description: string }[] = [
    { name: 'admin', description: 'System Administrator' },
    { name: 'super_hr', description: 'Global HR Head' },
    { name: 'hr_manager', description: 'HR Manager' },
    { name: 'recruiter', description: 'Talent Acquisition' },
    { name: 'manager', description: 'Engineering Manager' },
    { name: 'team_lead', description: 'Team Leader' },
    { name: 'employee', description: 'Software Engineer' },
    { name: 'intern', description: 'Engineering Intern' },
];

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (role: UserRole) => {
    await loginWithRole(role);
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Welcome to HR+ Demo</CardTitle>
          <CardDescription>
            This is a simulated login. Please select a role to view the corresponding dashboard and features.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <Button
              key={role.name}
              variant="outline"
              className="h-auto w-full justify-start p-4 text-left"
              onClick={() => handleLogin(role.name)}
            >
              <div className="flex flex-col">
                <span className="font-bold capitalize">{role.name.replace('_', ' ')}</span>
                <span className="text-xs text-muted-foreground">{role.description}</span>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
