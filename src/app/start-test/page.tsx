
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowRight } from 'lucide-react';

const FormSchema = z.object({
  applicationId: z.coerce.number({ invalid_type_error: 'Please enter a valid number.'}).min(1, 'Application ID is required.'),
});

export default function StartTestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    try {
      const { data: applicant, error } = await supabase
        .from('applicants')
        .select('id')
        .eq('application_id', data.applicationId)
        .single();
      
      if (error || !applicant) {
        toast({ title: 'Not Found', description: 'Could not find an application with that ID. Please check the number and try again.', variant: 'destructive' });
        return;
      }

      router.push(`/portal/${applicant.id}`);

    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive'});
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Begin Your Assessment</CardTitle>
        <CardDescription>
          Please enter the Application ID you received after registering to proceed to your test portal.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="applicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application ID</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 1001" {...field} onChange={event => field.onChange(event.target.value === '' ? '' : +event.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2" />}
              Go to My Portal
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
