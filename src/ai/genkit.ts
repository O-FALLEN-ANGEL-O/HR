import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY || 'AIzaSyBIRTUHWaTMUe4pAfrs23NC0SsxKDK4X7M',
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
