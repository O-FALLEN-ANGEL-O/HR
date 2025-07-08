import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { applicants } from '@/lib/data';
import { PlusCircle, Upload } from 'lucide-react';
import ApplicantList from './client';

export default function ApplicantsPage() {
  // In a real app, you'd fetch this data from an API
  const data = applicants;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Applicants">
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
