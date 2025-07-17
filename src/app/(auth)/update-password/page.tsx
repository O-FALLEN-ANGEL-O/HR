
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, KeyRound } from 'lucide-react';

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordSchema = z.infer<typeof passwordSchema>;

export default function UpdatePasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PasswordSchema>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  
  const handlePasswordSubmit = async (values: PasswordSchema) => {
    setIsSubmitting(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    
    if (error) {
       toast({
        title: 'Password Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
        toast({
            title: 'Password Updated!',
            description: 'You will now be redirected to login.',
        });
        router.push('/login');
    }
    setIsSubmitting(false);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Set Your New Password</CardTitle>
        <CardDescription>Choose a strong password to secure your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
             <form onSubmit={form.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <KeyRound className="mr-2" />}
                    Set Password and Sign In
                </Button>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
