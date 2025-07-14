
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
import { Loader2, LogIn, Mail } from 'lucide-react';

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
  password: z.string().min(1, 'Password is required.'),
});

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type LoginSchema = z.infer<typeof loginSchema>;
type MagicLinkSchema = z.infer<typeof magicLinkSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [isSubmittingLogin, setIsSubmittingLogin] = React.useState(false);
  const [isSubmittingMagicLink, setIsSubmittingMagicLink] = React.useState(false);

  const loginForm = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const magicLinkForm = useForm<MagicLinkSchema>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  });

  const handleLoginSubmit = async (values: LoginSchema) => {
    setIsSubmittingLogin(true);
    const result = await login(values);

    if (result?.error) {
      toast({
        title: 'Login Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
    
    setIsSubmittingLogin(false);
  };
  
  const handleMagicLinkSubmit = async (values: MagicLinkSchema) => {
    setIsSubmittingMagicLink(true);
    const result = await login(values, true);
    if (result.error) {
       toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
        toast({
            title: 'Magic Link Sent!',
            description: 'Check your email for a link to sign in.',
        });
    }
    setIsSubmittingMagicLink(false);
  }

  const isLoading = isSubmittingLogin || isSubmittingMagicLink;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back!</CardTitle>
        <CardDescription>Sign in to access the HR+ dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...loginForm}>
          <form
            onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
            className="space-y-4"
          >
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isSubmittingLogin ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-2" />
                  Sign In
                </>
              )}
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
          onClick={async () => {
             const result = await loginWithGoogle();
             if(result?.error) {
                toast({
                    title: 'Google Login Failed',
                    description: result.error,
                    variant: 'destructive',
                });
             }
          }}
          disabled={isLoading}
        >
          <GoogleIcon />
          Sign in with Google
        </Button>
        <Form {...magicLinkForm}>
             <form onSubmit={magicLinkForm.handleSubmit(handleMagicLinkSubmit)} className="flex items-end gap-2">
                <FormField
                    control={magicLinkForm.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel>Sign in with Magic Link</FormLabel>
                            <FormControl>
                                <Input placeholder="your.email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <Button type="submit" disabled={isLoading}>
                    {isSubmittingMagicLink ? <Loader2 className="animate-spin" /> : <Mail />}
                    <span className="sr-only">Send Magic Link</span>
                </Button>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
