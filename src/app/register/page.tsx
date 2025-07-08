'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { processResume } from '@/ai/flows/process-resume';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const FormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Phone number seems too short.'),
  resume: z.any().refine((files) => files?.length >= 1, 'Resume is required.'),
});

export default function RegisterPage() {
  const [isParsing, setIsParsing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
    },
  });

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    toast({ title: 'Processing Resume', description: 'AI is extracting information...' });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const resumeDataUri = reader.result as string;
        const result = await processResume({ resumeDataUri });
        
        form.setValue('fullName', result.fullName, { shouldValidate: true });
        form.setValue('email', result.email, { shouldValidate: true });
        form.setValue('phone', result.phone, { shouldValidate: true });

        toast({ title: 'Success!', description: 'Resume processed. Please verify the details.' });
      };
      reader.onerror = () => {
          throw new Error("Could not read file");
      }
    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to process resume. Please enter details manually.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    setIsSubmitting(true);
    try {
      // In a real app, you would handle file upload to Supabase storage first.
      const { data: newApplicant, error } = await supabase
        .from('applicants')
        .insert([
          {
            name: data.fullName,
            email: data.email,
            phone: data.phone,
            stage: 'Applied',
            source: 'walk-in',
            appliedDate: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Registration Successful!', description: 'Your profile has been created.' });
      router.push(`/portal/${newApplicant.id}`);

    } catch (error) {
      console.error('Error creating applicant:', error);
      toast({
        title: 'Submission Failed',
        description: 'Could not create your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Applicant Registration</CardTitle>
          <CardDescription>
            Welcome! Upload your resume to get started, or fill out the form manually.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
               <FormField
                control={form.control}
                name="resume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume (PDF or Image)</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input 
                                type="file" 
                                id="resume"
                                accept=".pdf,image/*"
                                className="w-full h-12 pl-12 pr-4"
                                // The field properties are managed by react-hook-form, 
                                // but we need to handle file selection for our AI processing logic
                                onChange={(e) => {
                                    field.onChange(e.target.files);
                                    handleResumeUpload(e);
                                }}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                {isParsing ? <Loader2 className="h-5 w-5 animate-spin"/> : <UploadCloud className="h-5 w-5" />}
                            </div>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. jane.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
               <Button type="submit" className="w-full" disabled={isParsing || isSubmitting}>
                {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                )}
                Submit Registration
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
