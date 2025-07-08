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
        (payload) => {
          toast({
            title: 'Applicant Data Updated',
            description: 'The list of applicants has been refreshed.',
          });

          if (payload.eventType === 'INSERT') {
            // The new record from the payload won't have the joined `jobs` data.
            // The UI will fallback to "Walk-in" which is acceptable for a live update.
            // A full refresh by the user will fetch the correct job title.
            setApplicants((prev) => [payload.new as Applicant, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // For updates, we can merge the new data with existing data to preserve the `jobs` info
            setApplicants((prev) =>
              prev.map((applicant) =>
                applicant.id === payload.new.id
                  ? { ...applicant, ...(payload.new as Applicant) }
                  : applicant
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setApplicants((prev) =>
              prev.filter(
                (applicant) => applicant.id !== (payload.old as { id: string }).id
              )
            );
          }
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
                        <AvatarImage src={applicant.avatar} />
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
                        <DropdownMenuItem onClick={() => router.push(`/applicants/${applicant.id}`)}>
                          <User className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/interviews')}>
                           <CalendarPlus className="mr-2 h-4 w-4" />
                           Schedule Interview
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => window.location.href = `mailto:${applicant.email}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
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
    </div>
  );
}
