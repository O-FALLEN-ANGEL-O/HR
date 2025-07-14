
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { login, loginWithGoogle } from '@/app/auth/actions';
import { Loader2, Mail, LogIn } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M21.35 11.1H12.18V13.83H18.67C18.36 17.64 15.19 19.27 12.19 19.27C8.36 19.27 5.03 16.25 5.03 12.55C5.03 8.85 8.36 5.83 12.19 5.83C13.96 5.83 15.6 6.57 16.8 7.82L19.03 5.59C17.11 3.92 14.93 3 12.19 3C6.54 3 2.02 7.58 2.02 12.55C2.02 17.52 6.54 22.1 12.19 22.1C17.45 22.1 21.57 18.25 21.57 12.92C21.57 12.23 21.48 11.66 21.35 11.1Z"
    />
  </svg>
);

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password cannot be empty.'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = React.useState(false);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  
  const handlePasswordSubmit = async (values: LoginSchema) => {
    setIsSubmittingPassword(true);
    const result = await login(values, false);
    if (result?.error) {
       toast({
        title: 'Login Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
    // On success, the action redirects, so no 'else' block is needed.
    setIsSubmittingPassword(false);
  }

  const handleGoogleLogin = async () => {
    setIsSubmittingGoogle(true);
    const result = await loginWithGoogle();
    if(result?.error) {
       toast({
           title: 'Google Login Failed',
           description: result.error,
           variant: 'destructive',
       });
       setIsSubmittingGoogle(false);
    }
  }

  const isLoading = isSubmittingPassword || isSubmittingGoogle;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome!</CardTitle>
        <CardDescription>Sign in to access the HR+ dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
             <form onSubmit={form.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="your.email@example.com" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <Button type="submit" disabled={isLoading} className="w-full">
                    {isSubmittingPassword ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2" />}
                    Sign In
                </Button>
            </form>
        </Form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isSubmittingGoogle ? <Loader2 className="animate-spin mr-2" /> : <GoogleIcon />}
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}
