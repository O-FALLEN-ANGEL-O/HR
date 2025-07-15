
'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
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
import { Loader2, KeyRound, Phone, CheckCircle } from 'lucide-react';
import { completeProfile } from '@/app/auth/actions';

const profileSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type ProfileSchema = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: { phone: '', password: '' },
  });

  React.useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
      } else {
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);
  
  const handleProfileSubmit: SubmitHandler<ProfileSchema> = async (values) => {
    setIsSubmitting(true);
    
    const result = await completeProfile(values);

    if (result?.error) {
      toast({
        title: 'Update Failed',
        description: result.error,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
    // On success, the server action will handle the redirect.
    // If we reach here, it means there was an error that didn't throw.
  }

  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
         <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <CheckCircle className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        <CardDescription>
          Welcome! To secure your account, please set a new password and add your phone number.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-center bg-muted p-2 rounded-md">
            You are logged in as: <span className="font-semibold">{userEmail}</span>
        </div>
        <Form {...form}>
             <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><Phone/> Phone Number</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 555-123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><KeyRound/> New Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Choose a strong password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                    Save and Continue
                </Button>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
