import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import type { CompanyDocument } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const mockDocuments: CompanyDocument[] = [
  {
    id: 'doc-1',
    title: 'Employee Handbook 2024',
    category: 'HR Policies',
    description: 'The official guide to company policies, procedures, and culture.',
    lastUpdated: '2024-05-20T10:00:00Z',
    downloadUrl: '#',
  },
  {
    id: 'doc-2',
    title: 'Work From Home Policy',
    category: 'HR Policies',
    description: 'Guidelines and best practices for remote work.',
    lastUpdated: '2024-03-15T14:30:00Z',
    downloadUrl: '#',
  },
  {
    id: 'doc-3',
    title: 'IT Security Guidelines',
    category: 'IT Policies',
    description: 'Procedures for maintaining the security of company data and systems.',
    lastUpdated: '2024-06-01T09:00:00Z',
    downloadUrl: '#',
  },
  {
    id: 'doc-4',
    title: 'Code of Conduct',
    category: 'HR Policies',
    description: 'Our commitment to a respectful and inclusive workplace.',
    lastUpdated: '2023-11-10T11:00:00Z',
    downloadUrl: '#',
  },
  {
    id: 'doc-5',
    title: 'Emergency Evacuation Plan',
    category: 'Health & Safety',
    description: 'Procedures to follow in case of an emergency at the office.',
    lastUpdated: '2024-02-28T16:00:00Z',
    downloadUrl: '#',
  },
];

export default function CompanyDocumentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Company Policies & Documents" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockDocuments.map((doc) => (
          <Card key={doc.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{doc.title}</CardTitle>
              <CardDescription>{doc.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
               <Badge variant="outline">{doc.category}</Badge>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Updated: {format(new Date(doc.lastUpdated), 'PPP')}
              </p>
              <Button asChild variant="secondary" size="sm">
                <a href={doc.downloadUrl}>
                  <Download className="mr-2" />
                  Download
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
