
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { loginWithRole } from '@/app/auth/actions';
import { Loader2, LogIn, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserRole } from '@/lib/types';

const roleSchema = z.object({
  role: z.string().min(1, 'Please select a role.'),
});

type RoleSchema = z.infer<typeof roleSchema>;

const roleOptions: UserRole[] = [
  'admin',
  'super_hr',
  'hr_manager',
  'recruiter',
  'interviewer',
  'manager',
  'team_lead',
  'employee',
  'intern',
  'guest',
  'finance',
  'it_admin',
  'support',
  'auditor',
];

export default function LoginPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RoleSchema>({
    resolver: zodResolver(roleSchema),
    defaultValues: { role: 'admin' },
  });

  const handleRoleSubmit = async (values: RoleSchema) => {
    setIsSubmitting(true);
    const result = await loginWithRole(values.role as UserRole);
    if (result?.error) {
       toast({
        title: 'Login Failed',
        description: result.error,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
    // On success, the action handles the redirect, so we don't need to do anything here.
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">HR+ Demo Login</CardTitle>
            <CardDescription>Select a role to explore the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRoleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role to impersonate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role} className="capitalize">
                              {role.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <LogIn className="mr-2" />
                  )}
                  Login as Selected Role
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
