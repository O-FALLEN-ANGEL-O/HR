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
import { Loader2, CheckCircle, BrainCircuit, Keyboard, FileText, ArrowRight, Library, SpellCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Applicant } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
                    toast({ title: 'Profile Updated', description: 'Your assessment results have been saved.' });
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

    const allTestsCompleted = hasCompletedTypingTest && hasCompletedAptitudeTest && hasCompletedComprehensiveTest && hasCompletedGrammarTest;

    const pendingTests = [
        { completed: hasCompletedTypingTest, name: 'Typing Test', icon: Keyboard, description: 'Measure your typing speed and accuracy.', path: 'typing-test' },
        { completed: hasCompletedAptitudeTest, name: 'Aptitude Test', icon: BrainCircuit, description: 'Assess your problem-solving skills.', path: 'aptitude-test' },
        { completed: hasCompletedComprehensiveTest, name: 'Comprehensive Test', icon: Library, description: 'Test your reading and comprehension.', path: 'comprehensive-test' },
        { completed: hasCompletedGrammarTest, name: 'English Grammar Test', icon: SpellCheck, description: 'Assess your command of English.', path: 'english-grammar-test' },
    ].filter(test => !test.completed);

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
