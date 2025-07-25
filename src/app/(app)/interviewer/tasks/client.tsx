'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Interview } from '@/lib/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MoreHorizontal, Phone, Users, Video, Edit, MessageSquare, Trash2, Check, Loader2, Mic, MessagesSquare, Send } from 'lucide-react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addApplicantNote, updateInterviewStatus } from '@/app/actions';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';


type InterviewListProps = {
  initialInterviews: Interview[];
};

const statusColors: { [key: string]: string } = {
    Scheduled: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    Canceled: 'bg-red-100 text-red-800',
  };
  
const typeIcons: { [key: string]: React.ReactNode } = {
    Video: <Video className="h-4 w-4" />,
    Phone: <Phone className="h-4 w-4" />,
    'In-person': <Users className="h-4 w-4" />,
};

export default function InterviewList({ initialInterviews }: InterviewListProps) {
  const [interviews, setInterviews] = React.useState(initialInterviews);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchInterviews = React.useCallback(async () => {
    const supabase = createClient();
    // This logic should be adapted based on the user's role if this component were to be reused.
    const { data } = await supabase.from('interviews').select('*').order('date', { ascending: false });
    setInterviews((data as Interview[]) || []);
  }, []);

   React.useEffect(() => {
    setInterviews(initialInterviews);
  }, [initialInterviews]);

   React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-interviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interviews' },
        (payload) => {
          toast({
            title: 'Interview Data Updated',
            description: 'The list of interviews has been updated.',
          });
          fetchInterviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, fetchInterviews]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Tabs defaultValue="upcoming" className="w-full">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="upcoming">
            <InterviewTable interviews={interviews.filter(i => i.status === 'Scheduled')} isClient={isClient} />
          </TabsContent>
          <TabsContent value="completed">
            <InterviewTable interviews={interviews.filter(i => i.status === 'Completed' || i.status === 'Canceled')} isClient={isClient} />
          </TabsContent>
          <TabsContent value="all">
            <InterviewTable interviews={interviews} isClient={isClient} />
          </TabsContent>
        </Tabs>
      </div>
       <div className="md:col-span-1">
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessagesSquare/> Panel Chat</CardTitle>
                <CardDescription>Private chat for panelists on the same interview round.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                      <div className="text-center text-xs text-muted-foreground p-2">Today</div>
                      <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 border">
                              <AvatarImage data-ai-hint="person" src="https://placehold.co/40x40.png" />
                              <AvatarFallback>HM</AvatarFallback>
                          </Avatar>
                          <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                              <p className="font-semibold text-xs mb-1">Hiring Manager</p>
                              <p className="text-sm">Candidate seems strong technically, but let's probe on team collaboration skills.</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-3 justify-end">
                           <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%]">
                              <p className="font-semibold text-xs mb-1">You</p>
                              <p className="text-sm">Agreed. I'll focus my questions on that area. Thanks for the heads up.</p>
                          </div>
                          <Avatar className="h-8 w-8 border">
                              <AvatarImage data-ai-hint="person" src="https://placehold.co/40x40.png" />
                              <AvatarFallback>ME</AvatarFallback>
                          </Avatar>
                      </div>
                  </div>
                </ScrollArea>
                <div className="mt-4 flex items-center gap-2">
                    <Input placeholder="Type your message..." />
                    <Button><Send /></Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InterviewTable({ interviews, isClient }: { interviews: Interview[], isClient: boolean }) {
    const router = useRouter();

    if (interviews.length === 0) {
        return <div className="text-center text-muted-foreground p-8">No interviews to display.</div>
    }
    
    const handleCancelInterview = async (interviewId: string) => {
        try {
            await updateInterviewStatus(interviewId, 'Canceled');
        } catch (error: any) {
            console.error(error);
        }
    }
    
    return (
        <Card>
            <CardContent className="p-0">
                <ScrollArea className="w-full">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Interviewer</TableHead>
                            <TableHead>Date &amp; Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {interviews.map((interview) => (
                            <TableRow key={interview.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={interview.candidate_avatar || undefined} />
                                    <AvatarFallback>
                                    {interview.candidate_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{interview.candidate_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                    for {interview.job_title}
                                    </div>
                                </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={interview.interviewer_avatar || undefined} />
                                    <AvatarFallback>
                                    {interview.interviewer_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <span>{interview.interviewer_name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{isClient ? format(new Date(interview.date), 'PPP') : null}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4 ml-0.5" />
                                    <span className="ml-0.5">{interview.time}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                {typeIcons[interview.type]}
                                <span>{interview.type}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className={statusColors[interview.status]}>
                                {interview.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/hr/applicants/${interview.applicant_id}`)}>
                                        <Users className="mr-2" /> View Applicant
                                    </DropdownMenuItem>
                                    {interview.status === 'Scheduled' && (
                                        <>
                                        <FeedbackDialog interviewId={interview.id} applicantId={interview.applicant_id} />
                                        <DropdownMenuItem onClick={() => handleCancelInterview(interview.id)} className="text-red-500">
                                            <Trash2 className="mr-2" /> Cancel Interview
                                        </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function FeedbackDialog({ interviewId, applicantId }: { interviewId: string, applicantId: string}) {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const formRef = React.useRef<HTMLFormElement>(null);

    const handleFormSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        formData.append('applicant_id', applicantId);
        try {
            await addApplicantNote(formData);
            await updateInterviewStatus(interviewId, 'Completed');
            toast({ title: "Feedback Submitted", description: "The interview has been marked as complete." });
            setOpen(false);
        } catch(error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    <MessageSquare className="mr-2 h-4 w-4" /> Submit Feedback
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Interview Feedback</DialogTitle>
                    <DialogDescription>
                        Provide your feedback on the candidate. This will be added as a note to their profile and the interview will be marked as complete.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleFormSubmit} ref={formRef}>
                    <Textarea name="note" placeholder="Enter your feedback here... Your notes will be auto-saved." className="min-h-[120px]" required />
                    <DialogFooter className="mt-4 flex justify-between w-full">
                        <Button variant="outline" type="button" disabled>
                            <Mic className="mr-2" /> Record Voice Note (soon)
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Check className="mr-2"/>} Submit &amp; Complete
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
