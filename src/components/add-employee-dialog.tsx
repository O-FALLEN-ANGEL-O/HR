
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy } from 'lucide-react';
import { addEmployee } from '@/app/actions';
import type { UserRole } from '@/lib/types';

const FormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  department: z.string().min(2, 'Department is required.'),
  role: z.string().min(1, 'Role is required.'),
});

type AddEmployeeDialogProps = {
  children: React.ReactNode;
  onEmployeeAdded: () => void;
};

const roleOptions: UserRole[] = [
  'admin',
  'super_hr',
  'hr_manager',
  'recruiter',
  'interviewer',
  'manager',
  'team_lead',
  'employee',
  'intern',
  'guest',
];


export function AddEmployeeDialog({ children, onEmployeeAdded }: AddEmployeeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [setupInfo, setSetupInfo] = React.useState<{ link: string, name: string} | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      department: '',
      role: 'employee',
    },
  });
  
  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (formData) => {
    const serverFormData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      serverFormData.append(key, value);
    });

    try {
      const result = await addEmployee(serverFormData);
      if (result?.setupLink && result?.userName) {
        setSetupInfo({ link: result.setupLink, name: result.userName });
        onEmployeeAdded();
        form.reset();
      } else {
        throw new Error('Could not get setup link from the server.');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to add employee: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleCopyLink = () => {
    if (setupInfo) {
      navigator.clipboard.writeText(setupInfo.link);
      toast({ title: 'Link Copied!', description: 'The password setup link is on your clipboard.'});
    }
  }

  const handleClose = () => {
    setOpen(false);
    setSetupInfo(null);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            handleClose();
        } else {
            setOpen(true);
        }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{setupInfo ? `Setup Link for ${setupInfo.name}`: 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {setupInfo 
              ? `Share this secure link with the new employee for them to set up their password.`
              : `Enter the details to create a new user profile. A password setup link will be generated.`
            }
          </DialogDescription>
        </DialogHeader>

        {setupInfo ? (
            <div className="space-y-4 py-4">
                <Alert>
                    <AlertTitle>Password Setup Link</AlertTitle>
                    <AlertDescription>This is a one-time use link.</AlertDescription>
                    <div className="relative mt-2">
                         <Input readOnly value={setupInfo.link} className="pr-10" />
                         <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleCopyLink}>
                            <Copy className="h-4 w-4" />
                         </Button>
                    </div>
                </Alert>
                 <Button onClick={handleClose} className="w-full">Done</Button>
            </div>
        ) : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        {roleOptions.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, ' ')}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}/>
                <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Employee
                </Button>
                </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
