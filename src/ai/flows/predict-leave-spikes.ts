'use server';

/**
 * @fileOverview An AI agent to predict leave spikes and potential mass absenteeism.
 *
 * - predictLeaveSpikes - A function that handles the leave spike prediction process.
 * - PredictLeaveSpikesInput - The input type for the predictLeaveSpikes function.
 * - PredictLeaveSpikesOutput - The return type for the predictLeaveSpikes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const LeaveRecordSchema = z.object({
  leave_type: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  total_days: z.number(),
  department: z.string(),
});

const PredictLeaveSpikesInputSchema = z.object({
  leaveRecords: z.array(LeaveRecordSchema).describe("A list of recent leave records for the entire organization or a specific department."),
  analysisPeriod: z.string().describe("The period being analyzed, e.g., 'Next 30 days' or 'Q4 2024'."),
  country: z.string().describe("The country of operation, used for holiday context."),
});
export type PredictLeaveSpikesInput = z.infer<typeof PredictLeaveSpikesInputSchema>;

const SpikePredictionSchema = z.object({
    isSpikePredicted: z.boolean().describe("Whether a significant spike in leave is predicted."),
    confidenceScore: z.number().describe("A confidence score (0-1) for the prediction."),
    predictedSpikeDate: z.string().optional().describe("The date or date range where the spike is most likely."),
    reasoning: z.string().describe("A detailed explanation of the factors leading to the prediction, such as proximity to public holidays, seasonal trends, or observed patterns (e.g., many people taking leave on a Friday or Monday)."),
    affectedDepartments: z.array(z.string()).describe("A list of departments most likely to be affected."),
});

const PredictLeaveSpikesOutputSchema = z.object({
  prediction: SpikePredictionSchema,
});
export type PredictLeaveSpikesOutput = z.infer<typeof PredictLeaveSpikesOutputSchema>;


export async function predictLeaveSpikes(input: PredictLeaveSpikesInput): Promise<PredictLeaveSpikesOutput> {
  return predictLeaveSpikesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictLeaveSpikesPrompt',
  input: { schema: PredictLeaveSpikesInputSchema },
  output: { schema: PredictLeaveSpikesOutputSchema },
  prompt: `You are an expert HR workforce analyst for a company operating in {{{country}}}. Your task is to analyze historical and upcoming leave data to predict any unusual spikes in employee absenteeism for the period: {{{analysisPeriod}}}.

Analyze the following leave records:
{{#each leaveRecords}}
- Department: {{{department}}}, Type: {{{leave_type}}}, From: {{{start_date}}}, To: {{{end_date}}} ({{total_days}} days)
{{/each}}

Consider the following factors:
1.  **Public Holidays**: Are there clusters of leave requests around known public holidays in {{{country}}}?
2.  **Long Weekends**: Identify patterns where many employees are taking leave on a Friday or Monday to extend a weekend.
3.  **Seasonal Trends**: Note any seasonal patterns (e.g., summer holidays, end-of-year breaks).
4.  **Departmental Concentration**: Is there a high concentration of leave requests within a single critical department?

Based on your analysis, determine if a significant leave spike is likely. Provide a confidence score and a detailed reasoning for your prediction. If a spike is predicted, specify the likely dates and which departments will be most affected.`,
});

const predictLeaveSpikesFlow = ai.defineFlow(
  {
    name: 'predictLeaveSpikesFlow',
    inputSchema: PredictLeaveSpikesInputSchema,
    outputSchema: PredictLeaveSpikesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
