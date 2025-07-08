// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Analyzes performance reviews and suggests improvements based on tone and data.
 *
 * - analyzePerformanceReview - A function that analyzes performance reviews and suggests improvements.
 * - AnalyzePerformanceReviewInput - The input type for the analyzePerformanceReview function.
 * - AnalyzePerformanceReviewOutput - The return type for the analyzePerformanceReview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePerformanceReviewInputSchema = z.object({
  reviewText: z.string().describe('The text content of the performance review.'),
  employeeName: z.string().describe('The name of the employee being reviewed.'),
  reviewerName: z.string().describe('The name of the reviewer.'),
  jobTitle: z.string().describe('The job title of the employee being reviewed.'),
  performanceData: z
    .string()
    .optional()
    .describe('Any quantitative performance data available for the employee.'),
});
export type AnalyzePerformanceReviewInput = z.infer<typeof AnalyzePerformanceReviewInputSchema>;

const AnalyzePerformanceReviewOutputSchema = z.object({
  overallSentiment: z
    .string()
    .describe('The overall sentiment of the performance review (e.g., positive, negative, neutral).'),
  suggestedImprovements: z
    .array(z.string())
    .describe('Specific suggestions for improving the performance review.'),
  revisedReviewText: z.string().describe('The revised text of the performance review with improvements.'),
});
export type AnalyzePerformanceReviewOutput = z.infer<typeof AnalyzePerformanceReviewOutputSchema>;

export async function analyzePerformanceReview(
  input: AnalyzePerformanceReviewInput
): Promise<AnalyzePerformanceReviewOutput> {
  return analyzePerformanceReviewFlow(input);
}

const analyzePerformanceReviewPrompt = ai.definePrompt({
  name: 'analyzePerformanceReviewPrompt',
  input: {schema: AnalyzePerformanceReviewInputSchema},
  output: {schema: AnalyzePerformanceReviewOutputSchema},
  prompt: `You are an AI assistant specializing in providing constructive feedback on employee performance reviews. You will take in the review text and suggest improvements to make the review more fair, consistent, and provide actionable feedback. You will also provide a revised review text.

Employee Name: {{{employeeName}}}
Reviewer Name: {{{reviewerName}}}
Job Title: {{{jobTitle}}}
Performance Data: {{{performanceData}}}

Review Text:
{{{reviewText}}}`,
});

const analyzePerformanceReviewFlow = ai.defineFlow(
  {
    name: 'analyzePerformanceReviewFlow',
    inputSchema: AnalyzePerformanceReviewInputSchema,
    outputSchema: AnalyzePerformanceReviewOutputSchema,
  },
  async input => {
    const {output} = await analyzePerformanceReviewPrompt(input);
    return output!;
  }
);
