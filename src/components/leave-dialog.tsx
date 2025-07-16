'use client';

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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserProfile, LeaveBalance } from '@/lib/types';
import { applyForLeave } from '@/app/actions';


const FormSchema = z.object({
  leave_type: z.enum(['sick_leave', 'casual_leave', 'earned_leave', 'unpaid_leave']),
  start_date: z.date({ required_error: 'A start date is required.' }),
  end_date: z.date({ required_error: 'An end date is required.' }),
  reason: z.string().min(10, "Reason must be at least 10 characters.").max(200, "Reason is too long."),
}).refine(data => data.end_date >= data.start_date, {
    message: "End date cannot be before start date.",
    path: ["end_date"],
});

type LeaveDialogProps = {
  children: React.ReactNode;
  onLeaveApplied: () => void;
  user: UserProfile | null;
  balance: LeaveBalance | null;
};

export function LeaveDialog({ children, onLeaveApplied, user, balance }: LeaveDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (formData) => {
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to request time off.', variant: 'destructive'});
        return;
    }

    const serverFormData = new FormData();
    serverFormData.append('leave_type', formData.leave_type);
    serverFormData.append('start_date', format(formData.start_date, 'yyyy-MM-dd'));
    serverFormData.append('end_date', format(formData.end_date, 'yyyy-MM-dd'));
    serverFormData.append('reason', formData.reason);

    try {
      await applyForLeave(serverFormData);
      toast({ title: `Leave Requested`, description: `Your request has been submitted for approval.` });
      onLeaveApplied();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to submit request: ${error.message}`, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
          <DialogDescription>
            Select the type and dates for your leave request.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="leave_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Leave Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="casual_leave">Casual Leave ({balance?.casual_leave || 0} left)</SelectItem>
                    <SelectItem value="sick_leave">Sick Leave ({balance?.sick_leave || 0} left)</SelectItem>
                    <SelectItem value="earned_leave">Earned Leave ({balance?.earned_leave || 0} left)</SelectItem>
                    <SelectItem value="unpaid_leave">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover><PopoverTrigger asChild>
                        <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent></Popover>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover><PopoverTrigger asChild>
                        <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (form.getValues('start_date') || new Date())} initialFocus />
                    </PopoverContent></Popover>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <FormControl><Textarea placeholder="Please provide a brief reason for your leave..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
