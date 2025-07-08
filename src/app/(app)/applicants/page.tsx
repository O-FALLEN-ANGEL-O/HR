'use client';

import * as React from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { applicants } from '@/lib/data';
import { PlusCircle, Upload, ClipboardCopy } from 'lucide-react';
import ApplicantList from './client';
import { useToast } from '@/hooks/use-toast';

export default function ApplicantsPage() {
  const data = applicants;
  const { toast } = useToast();

  const handleCopyLink = () => {
    const url = `${window.location.origin}/register`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied!',
      description: 'The walk-in registration link is now on your clipboard.',
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Applicants">
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy Walk-in Link
        </Button>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Applicant
        </Button>
      </Header>
      <ApplicantList initialApplicants={data} />
    </div>
  );
}
