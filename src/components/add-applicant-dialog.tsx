import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { createClient } from '@/lib/supabase/client';
import type { Job } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const FormSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Phone number seems too short.'),
  job_title: z.string().min(1, 'Please select a position.'),
});

type AddApplicantDialogProps = {
  children: React.ReactNode;
  onApplicantAdded: () => void;
};

export function AddApplicantDialog({ children, onApplicantAdded }: AddApplicantDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [openJobs, setOpenJobs] = React.useState<Pick<Job, 'id' | 'title'>[]>([]);
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', email: '', phone: '', job_title: '' },
  });
  
  React.useEffect(() => {
    if (open) {
      const fetchJobs = async () => {
        const { data, error } = await supabase.from('jobs').select('id, title').eq('status', 'Open');
        if (error) {
          toast({ title: 'Error', description: 'Could not load job positions.', variant: 'destructive' });
        } else {
          setOpenJobs(data || []);
        }
      };
      fetchJobs();
    }
  }, [open, supabase, toast]);

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (formData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('applicants').insert([
        {
          ...formData,
          stage: 'Applied',
          source: 'manual',
          applied_date: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      toast({ title: 'Applicant Added', description: `${formData.name} has been added.` });
      onApplicantAdded();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to add applicant: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Applicant</DialogTitle>
          <DialogDescription>
            Enter the details of the new applicant manually. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="job_title" render={({ field }) => (
              <FormItem>
                <FormLabel>Position Applying For</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a position" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {openJobs.map((job) => (
                      <SelectItem key={job.id} value={job.title}>{job.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Applicant
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
