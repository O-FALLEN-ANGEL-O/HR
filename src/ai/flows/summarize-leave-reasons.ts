'use server';

/**
 * @fileOverview An AI agent to summarize and analyze a batch of leave reasons.
 *
 * - summarizeLeaveReasons - A function that handles the reason summarization process.
 * - SummarizeLeaveReasonsInput - The input type for the summarizeLeaveReasons function.
 * - SummarizeLeaveReasonsOutput - The return type for the summarizeLeaveReasons function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeLeaveReasonsInputSchema = z.object({
  reasons: z.array(z.string()).describe("A list of raw text reasons provided by employees for their leave requests."),
});
export type SummarizeLeaveReasonsInput = z.infer<typeof SummarizeLeaveReasonsInputSchema>;

const SummarizeLeaveReasonsOutputSchema = z.object({
  commonThemes: z.array(z.string()).describe("A list of the most common themes or categories found in the leave reasons (e.g., 'Family Event', 'Personal Appointment', 'Feeling Unwell')."),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative', 'Mixed']).describe("The overall sentiment of the provided reasons."),
  summary: z.string().describe("A concise, high-level summary of the collective reasons for leave."),
  unusualPatterns: z.array(z.string()).describe("A list of any unusual or noteworthy patterns detected, such as a sudden spike in 'unwell' reasons or multiple people citing the same specific event."),
});
export type SummarizeLeaveReasonsOutput = z.infer<typeof SummarizeLeaveReasonsOutputSchema>;

export async function summarizeLeaveReasons(input: SummarizeLeaveReasonsInput): Promise<SummarizeLeaveReasonsOutput> {
  return summarizeLeaveReasonsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeLeaveReasonsPrompt',
  input: { schema: SummarizeLeaveReasonsInputSchema },
  output: { schema: SummarizeLeaveReasonsOutputSchema },
  prompt: `You are an HR analyst AI. Your task is to process a batch of anonymized leave request reasons and provide a structured summary.

Analyze the following reasons for leave:
{{#each reasons}}
- "{{this}}"
{{/each}}

Based on this list, please provide:
1.  **Common Themes**: Group the reasons into 3-5 high-level categories.
2.  **Overall Sentiment**: Determine the general sentiment of the reasons provided.
3.  **High-Level Summary**: Write a brief, one-paragraph summary of why people are taking leave.
4.  **Unusual Patterns**: Highlight any recurring specific reasons or potential red flags (e.g., multiple people mentioning "stress" or "burnout", a cluster of "food poisoning" reports, etc.).`,
});

const summarizeLeaveReasonsFlow = ai.defineFlow(
  {
    name: 'summarizeLeaveReasonsFlow',
    inputSchema: SummarizeLeaveReasonsInputSchema,
    outputSchema: SummarizeLeaveReasonsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
