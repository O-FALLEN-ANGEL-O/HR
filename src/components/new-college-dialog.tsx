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
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { addCollege } from '@/app/actions';

const FormSchema = z.object({
  name: z.string().min(3, 'College name must be at least 3 characters.'),
  contact_email: z.string().email('Please enter a valid email address.'),
});

type NewCollegeDialogProps = {
  children: React.ReactNode;
  onCollegeAdded: () => void;
};

export function NewCollegeDialog({ children, onCollegeAdded }: NewCollegeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', contact_email: '' },
  });
  
  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (formData) => {
    const serverFormData = new FormData();
    serverFormData.append('name', formData.name);
    serverFormData.append('contact_email', formData.contact_email);
    
    try {
      await addCollege(serverFormData);
      toast({ title: 'College Invited', description: `${formData.name} has been added to the drive list.` });
      onCollegeAdded();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to add college: ${error.message}`, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New College</DialogTitle>
          <DialogDescription>
            Enter the details for the new college to invite them for a recruitment drive.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>College Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="contact_email" render={({ field }) => (
              <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
