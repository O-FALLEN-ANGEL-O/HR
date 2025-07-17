'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Send } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { HelpdeskTicket, UserProfile } from '@/lib/types';
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
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { createHelpdeskTicket, addTicketComment } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusColors: { [key: string]: string } = {
  Open: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-800',
};

const priorityColors: { [key: string]: string } = {
  Low: 'border-gray-300',
  Medium: 'border-yellow-400',
  High: 'border-orange-500',
  Urgent: 'border-red-600',
};

export default function HelpdeskClient({ initialTickets, currentUser }: { initialTickets: HelpdeskTicket[], currentUser: UserProfile | null }) {
  const [tickets, setTickets] = React.useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = React.useState<HelpdeskTicket | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();

  const refetchTickets = React.useCallback(async () => {
    const supabase = createClient();
    let query = supabase.from('helpdesk_tickets').select('*, users(full_name, avatar_url), ticket_comments(*, users(full_name, avatar_url))');
    if (currentUser && !['admin', 'super_hr', 'hr_manager', 'it_admin', 'support'].includes(currentUser.role)) {
        query = query.eq('user_id', currentUser.id);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        toast({ title: 'Error', description: 'Could not refetch tickets.'});
    } else {
        setTickets(data || []);
        if (selectedTicket) {
            setSelectedTicket(data.find(t => t.id === selectedTicket.id) || null);
        }
    }
  }, [currentUser, selectedTicket, toast]);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-helpdesk')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'helpdesk_tickets' }, () => {
          toast({ title: "Tickets updated", description: "The list of tickets has been refreshed." });
          refetchTickets()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_comments' }, () => {
          toast({ title: "New comment added", description: "A ticket has been updated with a new comment."});
          refetchTickets()
      })
      .subscribe();
    return () => { supabase.removeChannel(channel) };
  }, [refetchTickets, toast]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>My Tickets</CardTitle>
              <CardDescription>Track the status of your support tickets.</CardDescription>
            </div>
            <NewTicketDialog onTicketCreated={refetchTickets} />
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full h-[60vh]">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.map((ticket) => (
                    <TableRow key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                        <TableCell><Badge variant="outline">{ticket.category}</Badge></TableCell>
                        <TableCell><Badge variant="secondary" className={`capitalize ${statusColors[ticket.status]}`}>{ticket.status}</Badge></TableCell>
                        <TableCell>{isClient ? formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true }) : ''}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-1">
        {selectedTicket ? <TicketDetails ticket={selectedTicket} currentUser={currentUser} /> : <NoTicketSelected />}
      </div>
    </div>
  );
}

function NoTicketSelected() {
    return (
         <Card className="sticky top-20">
            <CardContent className="h-full flex flex-col items-center justify-center text-center p-10">
                <MoreHorizontal className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a ticket to see its details.</p>
            </CardContent>
        </Card>
    )
}

function TicketDetails({ ticket, currentUser }: { ticket: HelpdeskTicket, currentUser: UserProfile | null }) {
    const [comment, setComment] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setIsSubmitting(true);
        try {
            await addTicketComment(ticket.id, comment);
            setComment('');
        } catch (error: any) {
             toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
            <CardHeader>
                <CardTitle>{ticket.subject}</CardTitle>
                <CardDescription>
                    Opened by {ticket.users?.full_name} &bull; {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </CardDescription>
                 <div className="flex justify-between items-center text-sm pt-2">
                    <Badge variant="secondary" className={statusColors[ticket.status]}>{ticket.status}</Badge>
                    <Badge variant="outline" className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                 </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
                <p className="text-sm border bg-muted/30 p-3 rounded-md">{ticket.description}</p>
                 <div className="space-y-4">
                    {ticket.ticket_comments.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(c => (
                        <div key={c.id} className={`flex items-start gap-3 ${c.user_id === currentUser?.id ? 'justify-end' : ''}`}>
                             {c.user_id !== currentUser?.id && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={c.users?.avatar_url || undefined} />
                                    <AvatarFallback>{c.users?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={`p-3 rounded-lg max-w-[85%] ${c.user_id === currentUser?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="font-semibold text-xs mb-1">{c.users?.full_name}</p>
                                <p className="text-sm">{c.comment}</p>
                                <p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                            </div>
                            {c.user_id === currentUser?.id && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={currentUser?.avatar_url || undefined} />
                                    <AvatarFallback>{currentUser?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                 </div>
            </CardContent>
            <CardFooter>
                 <form onSubmit={handleAddComment} className="flex w-full items-center gap-2">
                    <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..."/>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}


function NewTicketDialog({ onTicketCreated }: { onTicketCreated: () => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const formSchema = z.object({
    subject: z.string().min(10, 'Subject must be at least 10 characters.'),
    description: z.string().min(20, 'Description must be at least 20 characters.'),
    category: z.enum(['IT', 'HR', 'Finance', 'General']),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        subject: '',
        description: '',
        category: 'General',
        priority: 'Medium'
    }
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (data) => {
    try {
      await createHelpdeskTicket(data);
      toast({ title: 'Ticket Created', description: 'Your support ticket has been submitted.' });
      onTicketCreated();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PlusCircle className="mr-2"/> New Ticket</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Support Ticket</DialogTitle>
          <DialogDescription>
            Fill in the details below. A support agent will get back to you shortly.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="IT">IT Support</SelectItem><SelectItem value="HR">HR Query</SelectItem><SelectItem value="Finance">Finance Query</SelectItem><SelectItem value="General">General</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Urgent">Urgent</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )}/>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="animate-spin mr-2"/>}
                    Submit Ticket
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
