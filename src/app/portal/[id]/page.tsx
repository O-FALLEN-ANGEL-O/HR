'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, BrainCircuit, Keyboard, FileText, ArrowRight, Library, SpellCheck, HeartHandshake, UploadCloud, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Applicant } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function ApplicantPortalPage() {
    const params = useParams();
    const id = params.id as string;

    const [applicant, setApplicant] = React.useState<Applicant | null>(null);
    const [loading, setLoading] = React.useState(true);
    const { toast } = useToast();
    
    const fetchApplicant = React.useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('applicants')
            .select('*, jobs(title)')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching applicant:', error);
            toast({ title: 'Error', description: 'Could not load applicant data.', variant: 'destructive' });
        } else {
            setApplicant(data);
        }
        if (showLoading) setLoading(false);
    }, [id, toast]);

    React.useEffect(() => {
        if (!id) return;
        
        fetchApplicant();

        const supabase = createClient();
        const channel = supabase
            .channel(`applicant-portal-${id}`)
            .on<Applicant>(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'applicants',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    setApplicant(payload.new as Applicant);
                    toast({ title: 'Profile Updated', description: 'Your application status has been updated.' });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, fetchApplicant, toast]);
    
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
                            We could not find an applicant profile with this ID. Please check the URL or contact HR.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
         )
    }

    const hasCompletedTypingTest = applicant.wpm !== null && applicant.wpm !== undefined;
    const hasCompletedAptitudeTest = applicant.aptitude_score !== null && applicant.aptitude_score !== undefined;
    const hasCompletedComprehensiveTest = applicant.comprehensive_score !== null && applicant.comprehensive_score !== undefined;
    const hasCompletedGrammarTest = applicant.english_grammar_score !== null && applicant.english_grammar_score !== undefined;
    const hasCompletedCustomerServiceTest = applicant.customer_service_score !== null && applicant.customer_service_score !== undefined;


    const allTestsCompleted = hasCompletedTypingTest && hasCompletedAptitudeTest && hasCompletedComprehensiveTest && hasCompletedGrammarTest && hasCompletedCustomerServiceTest;

    const pendingTests = [
        { completed: hasCompletedTypingTest, name: 'Typing Test', icon: Keyboard, description: 'Measure your typing speed and accuracy.', path: 'typing-test' },
        { completed: hasCompletedAptitudeTest, name: 'Aptitude Test', icon: BrainCircuit, description: 'Assess your problem-solving skills.', path: 'aptitude-test' },
        { completed: hasCompletedComprehensiveTest, name: 'Comprehensive Test', icon: Library, description: 'Test your reading and comprehension.', path: 'comprehensive-test' },
        { completed: hasCompletedGrammarTest, name: 'English Grammar Test', icon: SpellCheck, description: 'Assess your command of English.', path: 'english-grammar-test' },
        { completed: hasCompletedCustomerServiceTest, name: 'Customer Service Test', icon: HeartHandshake, description: 'Evaluate your customer-facing skills.', path: 'customer-service-test' },
    ].filter(test => !test.completed);

    const isShortlisted = applicant.stage === 'Interview' || applicant.stage === 'Offer';

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Welcome, {applicant.name}!</CardTitle>
                    <CardDescription>
                       This is your personal portal for the application process.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Application Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                             <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Applicant ID:</span>
                                <span className="font-mono">{id}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Applying for:</span>
                                <span className="font-medium">{applicant.jobs?.title || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Current Stage:</span>
                                <Badge variant="outline">{applicant.stage}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {isShortlisted && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><Calendar /> Interview Scheduling</CardTitle>
                                <CardDescription>Congratulations! You have been shortlisted. Please schedule your interview or upload your documents.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <AlertTitle>Candidate Document Locker</AlertTitle>
                                    <AlertDescription>Please upload your photo ID, certificates, etc.</AlertDescription>
                                    <div className="mt-4 flex items-center gap-2">
                                        <Input id="document-upload" type="file" className="flex-1" />
                                        <Button size="sm"><UploadCloud className="mr-2" /> Upload</Button>
                                    </div>
                                </Alert>
                                 <Alert>
                                    <AlertTitle>Reschedule Interview</AlertTitle>
                                    <AlertDescription>If you need to reschedule, you may do so once.</AlertDescription>
                                    <Button className="mt-4 w-full" variant="outline">Request a New Slot</Button>
                                </Alert>
                            </CardContent>
                        </Card>
                    )}

                    {allTestsCompleted ? (
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><CheckCircle className="text-green-500" /> Assessments Complete</CardTitle>
                                <CardDescription>Thank you for completing all required assessments. We will review your results and be in touch soon.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-lg border p-4">
                                    <p className="font-semibold">Typing Test</p>
                                    <p className="text-sm text-muted-foreground">WPM: <span className="font-bold text-primary">{applicant.wpm}</span></p>
                                    <p className="text-sm text-muted-foreground">Accuracy: <span className="font-bold text-primary">{applicant.accuracy}%</span></p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="font-semibold">Aptitude Test</p>
                                    <p className="text-sm text-muted-foreground">Score: <span className="font-bold text-primary">{applicant.aptitude_score}%</span></p>
                                </div>
                                 <div className="rounded-lg border p-4">
                                    <p className="font-semibold">Comprehensive Test</p>
                                    <p className="text-sm text-muted-foreground">Score: <span className="font-bold text-primary">{applicant.comprehensive_score}%</span></p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="font-semibold">English Grammar Test</p>
                                    <p className="text-sm text-muted-foreground">Score: <span className="font-bold text-primary">{applicant.english_grammar_score}%</span></p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="font-semibold">Customer Service Test</p>
                                    <p className="text-sm text-muted-foreground">Score: <span className="font-bold text-primary">{applicant.customer_service_score}%</span></p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Pending Assessments</CardTitle>
                                <CardDescription>Please complete the following assessments to proceed with your application.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pendingTests.map(test => (
                                     <Alert key={test.path} className="flex items-center justify-between">
                                        <div>
                                            <AlertTitle className="flex items-center gap-2"><test.icon/>{test.name}</AlertTitle>
                                            <AlertDescription>{test.description}</AlertDescription>
                                        </div>
                                        <Button asChild>
                                            <Link href={`/${test.path}?id=${id}`}>Start Test <ArrowRight className="ml-2"/></Link>
                                        </Button>
                                    </Alert>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground text-center w-full">If you have any questions, please contact the HR department.</p>
                </CardFooter>
            </Card>
        </div>
    )
}
