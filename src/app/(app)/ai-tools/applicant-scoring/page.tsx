'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  applicantMatchScoring,
  type ApplicantMatchScoringInput,
  type ApplicantMatchScoringOutput,
} from '@/ai/flows/applicant-match-scoring';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

const FormSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters.'),
  applicantProfile: z.string().min(50, 'Applicant profile must be at least 50 characters.'),
});

export default function ApplicantScoringPage() {
  const [result, setResult] = React.useState<ApplicantMatchScoringOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      jobDescription: '',
      applicantProfile: '',
    },
  });

  const onSubmit: SubmitHandler<ApplicantMatchScoringInput> = async (data) => {
    setIsLoading(true);
    setResult(null);
    try {
      const scoringResult = await applicantMatchScoring(data);
      setResult(scoringResult);
    } catch (error) {
      console.error('Error scoring applicant:', error);
      toast({
        title: 'Error',
        description: 'Failed to score applicant. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Applicant Match Scoring</CardTitle>
          <CardDescription>
            Let AI analyze an applicant's profile against a job description to generate a match score.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the job description here..."
                        className="min-h-[150px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicantProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicant Profile / Resume</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the applicant's profile or resume text here..."
                        className="min-h-[150px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Analyze Match
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Analysis Result</CardTitle>
          <CardDescription>The AI-generated match score and justification will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing... please wait.</p>
            </div>
          )}
          {result && (
            <div className="space-y-6">
              <div>
                <FormLabel>Match Score</FormLabel>
                <div className="mt-2 flex items-center gap-4">
                  <Progress value={result.matchScore} className="w-full" />
                  <span className="text-xl font-bold text-primary">{result.matchScore}%</span>
                </div>
              </div>
              <div>
                <FormLabel>Justification</FormLabel>
                <p className="mt-2 text-sm text-muted-foreground rounded-md border bg-secondary/30 p-4">
                  {result.justification}
                </p>
              </div>
            </div>
          )}
          {!isLoading && !result && (
             <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12" />
                <p>Results will be displayed here after analysis.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
