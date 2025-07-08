'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, BrainCircuit, Hourglass } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Applicant } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function ApplicantPortalPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [applicant, setApplicant] = React.useState<Applicant | null>(null);
    const [loading, setLoading] = React.useState(true);
    const { toast } = useToast();
    
    // In a real app, this would be triggered by a Supabase Realtime subscription
    // to a 'assessments' table for this applicant.
    const [assessment, setAssessment] = React.useState<{id: string, type: string} | null>(null);

    React.useEffect(() => {
        if (!id) return;
        
        const supabase = createClient();
        
        async function fetchApplicant() {
            const { data, error } = await supabase
                .from('applicants')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching applicant:', error);
                toast({ title: 'Error', description: 'Could not load applicant data.', variant: 'destructive' });
            } else {
                setApplicant(data);
            }
            setLoading(false);
        }

        fetchApplicant();
        
        // This is a placeholder for a real-time subscription.
        // For demonstration, we'll simulate an assessment being assigned after a delay.
        const timer = setTimeout(() => {
            setAssessment({ id: 'assess-123', type: 'Aptitude Test'});
            toast({
                title: 'New Assessment Assigned!',
                description: 'You have a new assessment to complete.',
            })
        }, 10000); // 10 seconds

        return () => clearTimeout(timer);

    }, [id, toast]);
    
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (!applicant) {
         return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl">Applicant Not Found</CardTitle>
                        <CardDescription>
                            We could not find an applicant profile with this ID.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
         )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Registration Complete!</CardTitle>
                    <CardDescription>
                        Welcome, {applicant.name}. Your profile is now active.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Your Applicant ID is: <span className="font-mono">{id}</span></p>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-lg mb-2">Application Status</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline">{applicant.stage}</Badge>
                        </div>
                         <div className="flex items-center justify-between mt-1">
                            <span className="text-muted-foreground">Applying for:</span>
                            <span className="font-medium">{applicant.job_title}</span>
                        </div>
                    </div>

                    {!assessment && (
                        <Alert>
                           <Hourglass className="h-4 w-4" />
                           <AlertTitle>Your Profile is Under Review</AlertTitle>
                           <AlertDescription>
                             An assessment may be assigned to you shortly. Please keep this window open and wait for instructions from our HR team.
                           </AlertDescription>
                       </Alert>
                    )}

                    {assessment && (
                         <Alert className="border-primary/50 bg-primary/5">
                            <BrainCircuit className="h-4 w-4" />
                            <AlertTitle className="font-semibold">Assessment Assigned!</AlertTitle>
                            <AlertDescription className="flex items-center justify-between">
                                An {assessment.type} is ready for you.
                               <Button size="sm">Begin Test</Button>
                            </AlertDescription>
                        </Alert>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}
