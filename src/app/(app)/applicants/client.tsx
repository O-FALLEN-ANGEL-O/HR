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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Applicant } from '@/lib/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, MoreHorizontal, ClipboardCheck } from 'lucide-react';
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

export default function ApplicantList({ initialApplicants }: ApplicantListProps) {
  const [applicants, setApplicants] = React.useState(initialApplicants);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [stageFilter, setStageFilter] = React.useState('all');
  const [sourceFilter, setSourceFilter] = React.useState('all');
  const [isEmailScannerActive, setIsEmailScannerActive] = React.useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime-applicants')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'applicants' },
        (payload) => {
          setApplicants((prev) => [payload.new as Applicant, ...prev]);
          toast({
            title: 'New Applicant',
            description: `${(payload.new as Applicant).name} just applied via ${payload.new.source}.`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, toast]);


  const filteredApplicants = React.useMemo(() => {
    return applicants
      .filter((applicant) =>
        applicant.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((applicant) =>
        stageFilter === 'all' ? true : applicant.stage === stageFilter
      )
      .filter((applicant) =>
        sourceFilter === 'all' ? true : applicant.source === sourceFilter
      );
  }, [applicants, searchTerm, stageFilter, sourceFilter]);

  const handleAssignTypingTest = (applicantId: string) => {
    const url = `${window.location.origin}/typing-test?id=${applicantId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Typing Test Link Copied!',
      description: 'The link has been copied to your clipboard.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applicant Management</CardTitle>
        <CardDescription>
          Search, filter, and manage all job applicants. Now with live updates.
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
                <TableCell>{applicant.jobTitle || 'Walk-in'}</TableCell>
                <TableCell>
                  {format(new Date(applicant.appliedDate), 'PPP')}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={stageColors[applicant.stage]}>
                    {applicant.stage}
                  </Badge>
                </TableCell>
                <TableCell>
                   <Badge variant="outline" className="capitalize">{applicant.source || 'N/A'}</Badge>
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
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Schedule Interview</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAssignTypingTest(applicant.id)}>
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Assign Typing Test
                      </DropdownMenuItem>
                      <DropdownMenuItem>Send Email</DropdownMenuItem>
                      <DropdownMenuItem>Download Resume</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
