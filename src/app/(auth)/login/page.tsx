
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
import { Loader2, LogIn, Building2, User, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

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

const AiBotIcon = () => (
    <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-primary-foreground">
        <circle cx="64" cy="64" r="64" fill="url(#paint0_linear_10_2)"/>
        <path d="M78 52C78 48.6863 75.3137 46 72 46H56C52.6863 46 50 48.6863 50 52V68C50 71.3137 52.6863 74 56 74H72C75.3137 74 78 71.3137 78 68V52Z" fill="#F8FAFC"/>
        <path d="M48 90C48 88.8954 48.8954 88 50 88H78C79.1046 88 80 88.8954 80 90V92C80 93.1046 79.1046 94 78 94H50C48.8954 94 48 93.1046 48 92V90Z" fill="#F8FAFC"/>
        <circle cx="59.5" cy="60.5" r="3.5" fill="#15803D"/>
        <circle cx="70.5" cy="60.5" r="3.5" fill="#15803D"/>
        <path d="M60 84C60 82.8954 60.8954 82 62 82H66C67.1046 82 68 82.8954 68 84V84C68 85.1046 67.1046 86 66 86H62C60.8954 86 60 85.1046 60 84V84Z" fill="#15803D"/>
        <path d="M92 41L94.5358 35.4642L100 33L94.5358 30.5358L92 25L89.4642 30.5358L84 33L89.4642 35.4642L92 41Z" fill="#F8FAFC"/>
        <defs>
        <linearGradient id="paint0_linear_10_2" x1="64" y1="0" x2="64" y2="128" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDBA74"/>
        <stop offset="1" stopColor="#F97316"/>
        </linearGradient>
        </defs>
    </svg>
)

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
    const result = await login(values);
    if (result?.error) {
       toast({
        title: 'Login Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
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

  const demoUsers = [
    { role: 'Admin', email: 'john.admin@company.com' },
    { role: 'HR Manager', email: 'sarah.hr@company.com' },
    { role: 'Recruiter', email: 'mike.recruiter@company.com' },
    { role: 'Manager', email: 'emily.manager@company.com' },
    { role: 'Team Lead', email: 'david.teamlead@company.com' },
    { role: 'Employee', email: 'lisa.employee@company.com' },
    { role: 'Intern', email: 'tom.intern@company.com' },
    { role: 'Finance', email: 'rachel.finance@company.com' },
    { role: 'Support', email: 'alex.support@company.com' },
    { role: 'Auditor', email: 'emma.auditor@company.com' },
  ];

  return (
    <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-primary to-emerald-800 p-8 text-white relative">
            <div className="absolute top-8 left-8 flex items-center gap-2">
                 <Building2 className="h-8 w-8" />
                 <span className="text-2xl font-bold">HR+ Pro</span>
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center space-y-4"
            >
                <h1 className="text-4xl font-bold tracking-tight">Meet Your HR AI Agent</h1>
                <p className="text-lg text-primary-foreground/80">Your Everyday Task Companion. Just Ask - we do it all.</p>
                <div className="flex justify-center pt-8">
                    <AiBotIcon />
                </div>
                <h2 className="text-3xl font-bold pt-8">HURRY UP! LOG IN & START NOW</h2>
            </motion.div>
        </div>
        <div className="flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                        <Building2 className="h-10 w-10 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl">Welcome!</CardTitle>
                    <CardDescription>Sign in to access your HR+ Pro dashboard.</CardDescription>
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
                                Sign in with Password
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
            </motion.div>
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-full max-w-md mt-6"
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Demo Accounts</CardTitle>
                        <CardDescription>
                            Use these credentials to explore different roles. The password for all accounts is: <span className="font-bold text-foreground">password</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {demoUsers.map(user => (
                            <div key={user.role} className="flex items-center justify-between rounded-md border p-2">
                                <p className="font-medium">{user.role}</p>
                                <p className="text-muted-foreground">{user.email}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    </div>
  );
}
