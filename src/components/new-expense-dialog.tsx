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
import { Loader2 } from 'lucide-react';
import { addExpenseReport } from '@/app/actions';
import { Textarea } from './ui/textarea';

const FormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  total_amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  description: z.string().optional(),
});

type NewExpenseDialogProps = {
  children: React.ReactNode;
  onReportAdded: () => void;
};

export function NewExpenseDialog({ children, onReportAdded }: NewExpenseDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { title: '', total_amount: 0, description: '' },
  });
  
  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (formData) => {
    const serverFormData = new FormData();
    serverFormData.append('title', formData.title);
    serverFormData.append('total_amount', String(formData.total_amount));
    if (formData.description) {
        serverFormData.append('description', formData.description);
    }
    
    try {
      await addExpenseReport(serverFormData);
      toast({ title: 'Expense Report Submitted', description: 'Your report has been submitted for approval.' });
      onReportAdded();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to submit report: ${error.message}`, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Expense Report</DialogTitle>
          <DialogDescription>
            Enter the details for your expense report.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Report Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="total_amount" render={({ field }) => (
              <FormItem><FormLabel>Total Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for Approval
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
