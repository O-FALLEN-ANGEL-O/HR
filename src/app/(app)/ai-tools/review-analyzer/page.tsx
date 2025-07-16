'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  analyzePerformanceReview,
  type AnalyzePerformanceReviewInput,
  type AnalyzePerformanceReviewOutput,
} from '@/ai/flows/performance-review-analysis';
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
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PenSquare, Sparkles, ThumbsUp, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';

const FormSchema = z.object({
  employeeName: z.string().min(1, 'Employee name is required.'),
  reviewerName: z.string().min(1, 'Reviewer name is required.'),
  jobTitle: z.string().min(1, 'Job title is required.'),
  reviewText: z.string().min(50, 'Review text must be at least 50 characters.'),
  performanceData: z.string().optional(),
});

export default function ReviewAnalyzerPage() {
  const [result, setResult] = React.useState<AnalyzePerformanceReviewOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      employeeName: '',
      reviewerName: '',
      jobTitle: '',
      reviewText: '',
      performanceData: '',
    },
  });

  const onSubmit: SubmitHandler<AnalyzePerformanceReviewInput> = async (data) => {
    setIsLoading(true);
    setResult(null);
    try {
      const analysisResult = await analyzePerformanceReview(data);
      setResult(analysisResult);
    } catch (error) {
      console.error('Error analyzing review:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header title="AI Review Analyzer" />
      <main className="p-4 md:p-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Review Analysis</CardTitle>
            <CardDescription>
              Get AI suggestions to make performance reviews more fair, consistent, and actionable.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="employeeName" render={({ field }) => (
                    <FormItem><FormLabel>Employee Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="reviewerName" render={({ field }) => (
                    <FormItem><FormLabel>Reviewer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
                <FormField control={form.control} name="jobTitle" render={({ field }) => (
                    <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="performanceData" render={({ field }) => (
                    <FormItem><FormLabel>Performance Data (Optional)</FormLabel><FormControl><Input placeholder="e.g., 115% of quota, 98% CSAT" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="reviewText" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Review Text</FormLabel>
                    <FormControl><Textarea placeholder="Paste the review text here..." className="min-h-[150px] resize-y" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Analyze Review
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
            <CardDescription>The AI-powered analysis and suggestions will appear here.</CardDescription>
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
                  <FormLabel className="flex items-center gap-2"><ThumbsUp className="h-4 w-4" /> Overall Sentiment</FormLabel>
                  <Badge variant="outline" className="mt-2 capitalize">{result.overallSentiment}</Badge>
                </div>
                <div>
                  <FormLabel className="flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Suggested Improvements</FormLabel>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {result.suggestedImprovements.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
                 <div>
                  <FormLabel className="flex items-center gap-2"><PenSquare className="h-4 w-4" /> Revised Review Text</FormLabel>
                  <p className="mt-2 text-sm text-muted-foreground rounded-md border bg-secondary/30 p-4">
                    {result.revisedReviewText}
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
      </main>
    </>
  );
}
