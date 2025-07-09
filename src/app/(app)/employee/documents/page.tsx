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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Company Policies & Documents" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
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
                Updated: {format(new Date(doc.last_updated), 'PPP')}
              </p>
              <Button asChild variant="secondary" size="sm">
                <a href={doc.download_url}>
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
