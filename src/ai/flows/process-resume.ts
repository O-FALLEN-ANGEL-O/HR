'use server';
/**
 * @fileOverview A resume processing AI agent.
 *
 * - processResume - A function that handles the resume parsing process.
 * - ProcessResumeInput - The input type for the processResume function.
 * - ProcessResumeOutput - The return type for the processResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "A resume file or photo (PDF or image), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProcessResumeInput = z.infer<typeof ProcessResumeInputSchema>;

const EducationSchema = z.object({
    institution: z.string().describe("The name of the educational institution."),
    degree: z.string().describe("The degree or qualification obtained."),
    year: z.string().describe("The year of graduation or period of study."),
});

const ProcessResumeOutputSchema = z.object({
  fullName: z.string().describe("The full name of the applicant."),
  email: z.string().email().describe("The email address of the applicant."),
  phone: z.string().describe("The phone number of the applicant."),
  skills: z.array(z.string()).describe("A list of key skills extracted from the resume."),
  experience: z.array(z.object({
    jobTitle: z.string().describe("The job title."),
    company: z.string().describe("The company name."),
    duration: z.string().describe("The duration of employment (e.g., 'Jan 2020 - Present')."),
  })).describe("A list of work experiences."),
  education: z.array(EducationSchema).describe("A list of the applicant's educational qualifications."),
});
export type ProcessResumeOutput = z.infer<typeof ProcessResumeOutputSchema>;

export async function processResume(input: ProcessResumeInput): Promise<ProcessResumeOutput> {
  return processResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processResumePrompt',
  input: {schema: ProcessResumeInputSchema},
  output: {schema: ProcessResumeOutputSchema},
  prompt: `You are an expert resume parser for an HR system. First, enhance the image for clarity if needed. Then, analyze the provided resume and extract the requested information accurately.

Resume: {{media url=resumeDataUri}}

Extract the applicant's full name, email address, phone number, a list of their skills, their work experience, and their educational background.
`,
});

const processResumeFlow = ai.defineFlow(
  {
    name: 'processResumeFlow',
    inputSchema: ProcessResumeInputSchema,
    outputSchema: ProcessResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
