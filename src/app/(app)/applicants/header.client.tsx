'use client';

import * as React from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Upload, ClipboardCopy } from 'lucide-react';

export default function ApplicantsHeader() {
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
  );
}
