import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { interviews } from '@/lib/data';
import { PlusCircle } from 'lucide-react';
import InterviewList from './client';

export default function InterviewsPage() {
  const data = interviews;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Interviews">
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      </Header>
      <InterviewList initialInterviews={data} />
    </div>
  );
}
