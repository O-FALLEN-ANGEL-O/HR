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
import { Loader2 } from 'lucide-react';
import { startOnboardingWorkflow } from '@/app/actions';
import type { UserProfile } from '@/lib/types';


const FormSchema = z.object({
  user_id: z.string().min(1, 'Please select an employee.'),
  manager_id: z.string().min(1, 'Please select a manager.'),
  buddy_id: z.string().optional(),
});

type StartOnboardingDialogProps = {
  children: React.ReactNode;
  onWorkflowAdded: () => void;
  users: UserProfile[];
};

export function StartOnboardingDialog({ children, onWorkflowAdded, users }: StartOnboardingDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (formData) => {
    const serverFormData = new FormData();
    serverFormData.append('user_id', formData.user_id);
    serverFormData.append('manager_id', formData.manager_id);
    if (formData.buddy_id) {
        serverFormData.append('buddy_id', formData.buddy_id);
    }
    
    try {
      await startOnboardingWorkflow(serverFormData);
      toast({ title: 'Onboarding Started', description: 'A new onboarding workflow has been created.' });
      onWorkflowAdded();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to start onboarding: ${error.message}`, variant: 'destructive' });
    }
  };

  const managers = users.filter(u => u.role === 'manager' || u.role === 'team_lead' || u.role === 'hr_manager' || u.role === 'super_hr');
  const employees = users.filter(u => u.role === 'employee' || u.role === 'intern');


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Onboarding Workflow</DialogTitle>
          <DialogDescription>
            Select the new employee and assign their manager and buddy.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="user_id" render={({ field }) => (
                <FormItem>
                    <FormLabel>New Employee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {employees.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="manager_id" render={({ field }) => (
                <FormItem>
                    <FormLabel>Manager</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger></FormControl>
                    <SelectContent>
                         {managers.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="buddy_id" render={({ field }) => (
                <FormItem>
                    <FormLabel>Buddy (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a buddy" /></SelectTrigger></FormControl>
                    <SelectContent>
                         {employees.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
              </FormItem>
            )}/>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Workflow
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
