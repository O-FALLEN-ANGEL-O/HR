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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Applicant } from '@/lib/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Mail,
  MoreHorizontal,
  Keyboard,
  PlusCircle,
  Upload,
  ClipboardCopy,
  User,
  CalendarPlus,
  BrainCircuit,
  Library,
  SpellCheck,
  HeartHandshake,
  FileSearch,
  UserX,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AddApplicantDialog } from '@/components/add-applicant-dialog';
import { Header } from '@/components/header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { rejectApplicant } from '@/app/actions';
import { Loader2 } from 'lucide-react';

type ApplicantListProps = {
  initialApplicants: Applicant[];
};

const stageColors: { [key: string]: string } = {
  Sourced: 'bg-gray-100 text-gray-800',
  Applied: 'bg-blue-100 text-blue-800',
  'Phone Screen': 'bg-indigo-100 text-indigo-800',
  Interview: 'bg-purple-100 text-purple-800',
  Offer: 'bg-yellow-100 text-yellow-800',
  Hired: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

export default function ApplicantList({
  initialApplicants,
}: ApplicantListProps) {
  const [applicants, setApplicants] = React.useState(initialApplicants);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [stageFilter, setStageFilter] = React.useState('all');
  const [sourceFilter, setSourceFilter] = React.useState('all');
  const [isEmailScannerActive, setIsEmailScannerActive] = React.useState(true);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    setApplicants(initialApplicants);
  }, [initialApplicants]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-applicants')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applicants' },
        async (payload) => {
          toast({
            title: 'Applicant Data Updated',
            description: 'The list of applicants has been refreshed.',
          });
          
          const { data } = await supabase.from('applicants').select('*, jobs(title)').order('applied_date', { ascending: false });
          setApplicants(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const filteredApplicants = React.useMemo(() => {
    return applicants
      .filter((applicant) =>
        applicant.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(
        (applicant) =>
          stageFilter === 'all' ? true : applicant.stage === stageFilter
      )
      .filter(
        (applicant) =>
          sourceFilter === 'all' ? true : applicant.source === sourceFilter
      );
  }, [applicants, searchTerm, stageFilter, sourceFilter]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/register`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied!',
      description: 'The walk-in registration link is now on your clipboard.',
    });
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Name", "Email", "Phone", "Job Title", "Stage", "Applied Date", "Source"].join(",") + "\n"
      + filteredApplicants.map(a => [
          `"${a.name}"`,
          a.email,
          a.phone,
          `"${a.jobs?.title || 'N/A'}"`,
          a.stage,
          format(new Date(a.applied_date), 'yyyy-MM-dd'),
          a.source
        ].join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "applicants.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Complete!', description: 'Applicant data has been downloaded.' });
  };
  
  const handleAssignTest = (applicantId: string, testName: string, testPath: string) => {
    const url = `${window.location.origin}/${testPath}?id=${applicantId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: `${testName} Link Copied!`,
      description: 'The link has been copied to your clipboard.',
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Applicants">
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy Walk-in Link
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Upload className="mr-2 h-4 w-4" />
          Export
        </Button>
        <AddApplicantDialog onApplicantAdded={() => {}}>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Applicant
          </Button>
        </AddApplicantDialog>
      </Header>

      <Card>
        <CardHeader>
          <CardTitle>Applicant Management</CardTitle>
          <CardDescription>
            Search, filter, and manage all job applicants. Now with live
            updates.
          </CardDescription>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {Object.keys(stageColors).map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 rounded-lg border p-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <Label htmlFor="email-scanner" className="font-normal text-sm">
                Email Auto-Scanner
              </Label>
              <Switch
                id="email-scanner"
                checked={isEmailScannerActive}
                onCheckedChange={setIsEmailScannerActive}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Applied For</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplicants.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={applicant.avatar || undefined} />
                        <AvatarFallback>
                          {applicant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{applicant.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {applicant.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{applicant.jobs?.title || 'Walk-in'}</TableCell>
                  <TableCell>
                    {isClient ? format(new Date(applicant.applied_date), 'PPP') : ''}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={stageColors[applicant.stage]}
                    >
                      {applicant.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {applicant.source || 'N/A'}
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
                        <DropdownMenuItem onClick={() => router.push(`/hr/applicants/${applicant.id}`)}>
                          <User className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/interviewer/tasks')}>
                           <CalendarPlus className="mr-2 h-4 w-4" />
                           Schedule Interview
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => window.location.href = `mailto:${applicant.email}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                         <RejectCandidateDialog applicantId={applicant.id} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleAssignTest(applicant.id, 'Typing Test', 'typing-test')}
                        >
                          <Keyboard className="mr-2 h-4 w-4" />
                          Assign Typing Test
                        </DropdownMenuItem>
                         <DropdownMenuItem
                          onClick={() => handleAssignTest(applicant.id, 'Aptitude Test', 'aptitude-test')}
                        >
                          <BrainCircuit className="mr-2 h-4 w-4" />
                          Assign Aptitude Test
                        </DropdownMenuItem>
                         <DropdownMenuItem
                          onClick={() => handleAssignTest(applicant.id, 'Comprehensive Test', 'comprehensive-test')}
                        >
                          <Library className="mr-2 h-4 w-4" />
                          Assign Comprehensive Test
                        </DropdownMenuItem>
                         <DropdownMenuItem
                          onClick={() => handleAssignTest(applicant.id, 'English Grammar Test', 'english-grammar-test')}
                        >
                          <SpellCheck className="mr-2 h-4 w-4" />
                          Assign English Grammar Test
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAssignTest(applicant.id, 'Customer Service Test', 'customer-service-test')}
                        >
                          <HeartHandshake className="mr-2 h-4 w-4" />
                          Assign Customer Service Test
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileSearch /> Rejection Reason Log</CardTitle>
                <CardDescription>Review why candidates were not selected to improve processes.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between p-2 rounded-md hover:bg-muted/50">
                        <span>Candidate not qualified</span>
                        <Badge variant="outline">12</Badge>
                    </div>
                     <div className="flex justify-between p-2 rounded-md hover:bg-muted/50">
                        <span>Salary expectation mismatch</span>
                        <Badge variant="outline">8</Badge>
                    </div>
                     <div className="flex justify-between p-2 rounded-md hover:bg-muted/50">
                        <span>Not a good culture fit</span>
                        <Badge variant="outline">5</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User /> Talent Pool CRM</CardTitle>
                <CardDescription>Manage high-potential candidates for future opportunities.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage data-ai-hint="person" src="https://placehold.co/40x40.png" />
                                <AvatarFallback>SN</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">Sarah Nadia</p>
                                <p className="text-xs text-muted-foreground">Past applicant for Sr. Developer</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                    </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage data-ai-hint="person" src="https://placehold.co/40x40.png" />
                                <AvatarFallback>MJ</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">Mike Johnson</p>
                                <p className="text-xs text-muted-foreground">Past applicant for Product Manager</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

const rejectionSchema = z.object({
  rejection_reason: z.string().min(1, { message: 'Please select a reason.' }),
  rejection_notes: z.string().optional(),
});

function RejectCandidateDialog({ applicantId }: { applicantId: string }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof rejectionSchema>>({
    resolver: zodResolver(rejectionSchema),
  });

  const { formState: { isSubmitting }, handleSubmit, control, reset } = form;

  const handleFormSubmit = async (data: z.infer<typeof rejectionSchema>) => {
    try {
      await rejectApplicant(applicantId, data.rejection_reason, data.rejection_notes);
      toast({
        title: 'Candidate Rejected',
        description: 'The candidate has been marked as rejected and the reason has been logged.',
      });
      setOpen(false);
      reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not reject the candidate.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-red-600 hover:bg-accent">
            <UserX className="mr-2 h-4 w-4" />
            Reject Candidate
        </div>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <DialogHeader>
            <DialogTitle>Reject Candidate</DialogTitle>
            <DialogDescription>
                Please select a reason for rejection. This will be logged for internal review.
            </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <Controller
                    name="rejection_reason"
                    control={control}
                    render={({ field, fieldState }) => (
                        <div className="space-y-1">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a rejection reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not-qualified">Not a good fit / Not qualified</SelectItem>
                                    <SelectItem value="salary-mismatch">Salary expectation mismatch</SelectItem>
                                    <SelectItem value="culture-fit">Not a good culture fit</SelectItem>
                                    <SelectItem value="position-filled">Position filled by another candidate</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                        </div>
                    )}
                />
                <Controller
                    name="rejection_notes"
                    control={control}
                    render={({ field }) => (
                         <Textarea placeholder="Add optional notes..." {...field} />
                    )}
                />
            </div>
            <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 animate-spin"/>}
                Confirm Rejection
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
