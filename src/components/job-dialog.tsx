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
import { Textarea } from '@/components/ui/textarea';
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
  title: z.string().min(3, 'Job title must be at least 3 characters.'),
  department: z.string().min(2, 'Department must be at least 2 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  status: z.enum(['Open', 'Closed', 'On hold']),
});

type JobDialogProps = {
  children: React.ReactNode;
  onJobAddedOrUpdated: () => void;
  job?: Job;
};

export function JobDialog({ children, onJobAddedOrUpdated, job }: JobDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const isEditMode = !!job;

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
        title: '',
        department: '',
        description: '',
        status: 'Open',
    },
  });

  React.useEffect(() => {
    if (job && open) {
        form.reset({
            title: job.title,
            department: job.department,
            description: job.description || '',
            status: job.status,
        });
    } else {
        form.reset({
            title: '',
            department: '',
            description: '',
            status: 'Open',
        });
    }
  }, [job, open, form]);

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (formData) => {
    setIsSubmitting(true);
    const supabase = createClient();
    try {
      let error;
      if (isEditMode) {
        ({ error } = await supabase.from('jobs').update(formData).eq('id', job.id));
      } else {
        ({ error } = await supabase.from('jobs').insert([{ ...formData, posted_date: new Date().toISOString(), applicants: 0 }]));
      }
      
      if (error) throw error;
      
      toast({ title: `Job ${isEditMode ? 'Updated' : 'Created'}`, description: `The job posting for ${formData.title} has been saved.` });
      onJobAddedOrUpdated();
      setOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to save job: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Job' : 'Create New Job'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this job posting.' : 'Fill in the details for the new job posting.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="department" render={({ field }) => (
              <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Job Description</FormLabel><FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="On hold">On hold</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Create Job'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
