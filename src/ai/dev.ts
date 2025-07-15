import { config } from 'dotenv';
config();

import '@/ai/flows/applicant-match-scoring.ts';
import '@/ai/flows/ai-chatbot.ts';
import '@/ai/flows/performance-review-analysis.ts';
import '@/ai/flows/process-resume.ts';
import '@/ai/flows/predict-leave-spikes.ts';
import '@/ai/flows/summarize-leave-reasons.ts';
