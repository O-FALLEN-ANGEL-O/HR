'use server';

/**
 * @fileOverview Applicant Match Scoring AI agent.
 *
 * - applicantMatchScoring - A function that handles the applicant match scoring process.
 * - ApplicantMatchScoringInput - The input type for the applicantMatchScoring function.
 * - ApplicantMatchScoringOutput - The return type for the applicantMatchScoring function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ApplicantMatchScoringInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
  applicantProfile: z.string().describe('The profile of the applicant.'),
});
export type ApplicantMatchScoringInput = z.infer<typeof ApplicantMatchScoringInputSchema>;

const ApplicantMatchScoringOutputSchema = z.object({
  matchScore: z
    .number()
    .describe(
      'A score from 0 to 100 indicating how well the applicant matches the job description.'
    ),
  justification: z
    .string()
    .describe(
      'A brief explanation of why the applicant received the match score, highlighting strengths and weaknesses.'
    ),
});
export type ApplicantMatchScoringOutput = z.infer<typeof ApplicantMatchScoringOutputSchema>;

export async function applicantMatchScoring(
  input: ApplicantMatchScoringInput
): Promise<ApplicantMatchScoringOutput> {
  return applicantMatchScoringFlow(input);
}

const prompt = ai.definePrompt({
  name: 'applicantMatchScoringPrompt',
  input: {schema: ApplicantMatchScoringInputSchema},
  output: {schema: ApplicantMatchScoringOutputSchema},
  prompt: `You are an expert HR recruiter specializing in applicant screening.

You will analyze the applicant profile and compare it to the job description to determine a match score and provide a justification.

Job Description: {{{jobDescription}}}

Applicant Profile: {{{applicantProfile}}}

Provide a match score from 0 to 100 and a brief justification for the score.
`,
});

const applicantMatchScoringFlow = ai.defineFlow(
  {
    name: 'applicantMatchScoringFlow',
    inputSchema: ApplicantMatchScoringInputSchema,
    outputSchema: ApplicantMatchScoringOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
