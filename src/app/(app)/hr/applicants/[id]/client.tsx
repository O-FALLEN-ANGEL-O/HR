'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  BookText,
  BrainCircuit,
  FileText,
  HeartHandshake,
  Keyboard,
  Library,
  Lightbulb,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  Sparkles,
  SpellCheck,
  User,
  Workflow,
} from 'lucide-react';

import { addApplicantNote, generateAiMatchScore } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Header } from '@/components/header';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Applicant, ApplicantNote } from '@/lib/types';
import type { ProcessResumeOutput } from '@/ai/flows/process-resume';
import { ScrollArea } from '@/components/ui/scroll-area';

const stageColors: { [key: string]: string } = {
  Sourced: 'bg-gray-100 text-gray-800',
  Applied: 'bg-blue-100 text-blue-800',
  'Phone Screen': 'bg-indigo-100 text-indigo-800',
  Interview: 'bg-purple-100 text-purple-800',
  Offer: 'bg-yellow-100 text-yellow-800',
  Hired: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

type ApplicantProfileClientProps = {
  initialApplicant: Applicant;
  initialNotes: ApplicantNote[];
};

export default function ApplicantProfileClient({
  initialApplicant,
  initialNotes,
}: ApplicantProfileClientProps) {
  const [applicant, setApplicant] = React.useState(initialApplicant);
  const [notes, setNotes] = React.useState(initialNotes);
  const [isGeneratingScore, setIsGeneratingScore] = React.useState(false);
  const { toast } = useToast();

  const fetchNotes = React.useCallback(async () => {
    const supabase = createClient();
    const { data: newNotes } = await supabase
        .from('applicant_notes')
        .select('*')
        .eq('applicant_id', applicant.id)
        .order('created_at', { ascending: false });
    setNotes(newNotes || []);
  }, [applicant.id]);

  React.useEffect(() => {
    const supabase = createClient();
    const applicantChannel = supabase
      .channel(`applicant-${applicant.id}-changes`)
      .on<Applicant>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applicants',
          filter: `id=eq.${applicant.id}`,
        },
        (payload) => {
          setApplicant((prev) => ({ ...prev, ...(payload.new as Applicant) }));
          toast({
            title: 'Applicant Updated',
            description: `${applicant.name}'s profile has been updated.`,
          });
        }
      )
      .subscribe();
      
      const notesChannel = supabase
      .channel(`applicant-${applicant.id}-notes-changes`)
      .on<ApplicantNote>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicant_notes',
          filter: `applicant_id=eq.${applicant.id}`,
        },
        () => fetchNotes()
      )
      .subscribe();


    return () => {
      supabase.removeChannel(applicantChannel);
      supabase.removeChannel(notesChannel);
    };
  }, [applicant.id, applicant.name, toast, fetchNotes]);

  const handleGenerateScore = async () => {
    setIsGeneratingScore(true);
    toast({
      title: 'Generating AI Score...',
      description: 'This may take a moment.',
    });
    try {
      await generateAiMatchScore(applicant.id);
      toast({
        title: 'Success!',
        description: "AI match score has been generated and saved.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Score',
        description: error.message || 'Could not generate AI match score. Please try again.',
      });
    } finally {
      setIsGeneratingScore(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Applicant Profile">
        <Button variant="outline">Schedule Interview</Button>
        <Button>Make Offer</Button>
      </Header>
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={applicant.avatar || undefined} />
                    <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl">{applicant.name}</CardTitle>
                    <CardDescription>Applying for {applicant.jobs?.title || 'N/A'}</CardDescription>
                </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{applicant.email}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{applicant.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stage:</span>
                    <Badge variant="secondary" className={stageColors[applicant.stage]}>
                        {applicant.stage}
                    </Badge>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Source:</span>
                    <Badge variant="outline" className="capitalize">{applicant.source}</Badge>
                </div>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><Keyboard className="h-4 w-4" /> Typing (WPM)</div>
                      <p className="font-bold">{applicant.wpm || 'N/A'}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><HeartHandshake className="h-4 w-4" /> Typing (Accuracy)</div>
                      <p className="font-bold">{applicant.accuracy ? `${applicant.accuracy}%` : 'N/A'}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><BrainCircuit className="h-4 w-4" /> Aptitude</div>
                      <p className="font-bold">{applicant.aptitude_score ? `${applicant.aptitude_score}%` : 'N/A'}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><Library className="h-4 w-4" /> Comprehensive</div>
                      <p className="font-bold">{applicant.comprehensive_score ? `${applicant.comprehensive_score}%` : 'N/A'}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><SpellCheck className="h-4 w-4" /> English Grammar</div>
                      <p className="font-bold">{applicant.english_grammar_score ? `${applicant.english_grammar_score}%` : 'N/A'}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><HeartHandshake className="h-4 w-4" /> Customer Service</div>
                      <p className="font-bold">{applicant.customer_service_score ? `${applicant.customer_service_score}%` : 'N/A'}</p>
                  </div>
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>AI Compatibility</span>
                    <Sparkles className="h-5 w-5 text-primary"/>
                </CardTitle>
                <CardDescription>AI-powered analysis of the applicant's profile against the job description.</CardDescription>
                </CardHeader>
                <CardContent>
                    {applicant.ai_match_score !== null && applicant.ai_match_score !== undefined ? (
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <Progress value={applicant.ai_match_score} className="w-full" />
                                <span className="text-2xl font-bold text-primary">{applicant.ai_match_score}%</span>
                            </div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4"/> Justification</h4>
                            <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md border">{applicant.ai_justification}</p>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-4">
                            <p className="mb-4">No AI score generated yet.</p>
                            <Button onClick={handleGenerateScore} disabled={isGeneratingScore}>
                            {isGeneratingScore ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                            Generate Score
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
            
            <div className="md:col-span-2">
                <Tabs defaultValue="resume" className="w-full">
                    <TabsList>
                        <TabsTrigger value="resume"><FileText className="mr-2"/>Resume Details</TabsTrigger>
                        <TabsTrigger value="notes"><MessageSquare className="mr-2"/>HR Notes</TabsTrigger>
                        <TabsTrigger value="timeline"><Workflow className="mr-2"/>Timeline</TabsTrigger>
                    </TabsList>
                    <TabsContent value="resume">
                        <ResumeDetails resume={applicant.resume_data} />
                    </TabsContent>
                    <TabsContent value="notes">
                    <NotesSection applicantId={applicant.id} notes={notes} />
                    </TabsContent>
                    <TabsContent value="timeline">
                        <Card><CardContent className="p-6 text-center text-muted-foreground">Application timeline feature coming soon.</CardContent></Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </main>
    </div>
  );
}

function ResumeDetails({ resume }: { resume?: ProcessResumeOutput | null }) {
    if (!resume) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    No resume data available for this applicant.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Parsed Resume Data</CardTitle>
                <CardDescription>Information extracted from the applicant's resume by AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {resume.skills?.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                    </div>
                </div>
                 {resume.links && resume.links.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Portfolio & Links</h3>
                        <div className="space-y-2">
                            {resume.links.map((link, i) => (
                                <a 
                                    key={i} 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                    <span>{link}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-lg mb-2">Work Experience</h3>
                    <div className="space-y-4">
                        {resume.experience?.map((exp, i) => (
                            <div key={i} className="p-3 border rounded-md">
                                <p className="font-medium">{exp.jobTitle}</p>
                                <p className="text-sm text-muted-foreground">{exp.company} &middot; {exp.duration}</p>
                            </div>
                        ))}
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg mb-2">Education</h3>
                    <div className="space-y-4">
                        {resume.education?.map((edu, i) => (
                            <div key={i} className="p-3 border rounded-md">
                                <p className="font-medium">{edu.institution}</p>
                                <p className="text-sm text-muted-foreground">{edu.degree} &middot; {edu.year}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-2">Full Resume Text</h3>
                    <ScrollArea className="p-4 border rounded-md bg-muted/50 max-h-96">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                            {resume.fullText || 'No full text extracted.'}
                        </pre>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    )
}

function NotesSection({ applicantId, notes }: { applicantId: string, notes: ApplicantNote[]}) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();
    const formRef = React.useRef<HTMLFormElement>(null);

    const handleAddNote = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await addApplicantNote(formData);
            toast({ title: 'Note Added', description: 'Your note has been saved.' });
            formRef.current?.reset();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Could not save your note.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>Internal HR Notes</CardTitle>
                <CardDescription>Private notes and comments for the hiring team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form action={handleAddNote} ref={formRef} className="space-y-2">
                    <input type="hidden" name="applicant_id" value={applicantId} />
                    <Textarea name="note" placeholder="Add a new note..." required minLength={10} className="min-h-[80px]" />
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <MessageSquare className="mr-2" />}
                        Add Note
                    </Button>
                </form>

                <ScrollArea className="space-y-4 h-96">
                    {notes.length > 0 ? (
                        notes.map(note => (
                            <div key={note.id} className="flex items-start gap-3 p-1">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={note.author_avatar || undefined} />
                                    <AvatarFallback>{note.author_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 rounded-md border bg-muted/30 p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold text-sm">{note.author_name}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</p>
                                    </div>
                                    <p className="text-sm">{note.note}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">No notes have been added yet.</p>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
