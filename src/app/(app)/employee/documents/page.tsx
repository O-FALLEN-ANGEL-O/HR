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
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { CompanyDocument } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

async function getDocuments(): Promise<CompanyDocument[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .order('last_updated', { ascending: false });

    if (error) {
        console.error("Error fetching documents:", error);
        return [];
    }
    return data;
}

export default async function CompanyDocumentsPage() {
  const documents = await getDocuments();

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Company Policies & Documents" />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
            <Card key={doc.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                         <CardTitle>{doc.title}</CardTitle>
                         <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                         </div>
                    </div>
                    <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                <Badge variant="outline">{doc.category}</Badge>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                    Updated: {format(new Date(doc.last_updated), 'PPP')}
                </p>
                <Button asChild variant="secondary" size="sm">
                    <a href={doc.download_url} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                    </a>
                </Button>
                </CardFooter>
            </Card>
            ))}
        </div>
      </main>
    </div>
  );
}
