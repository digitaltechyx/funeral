'use server';

/**
 * @fileOverview Generates a transparency report based on audit logs using AI.
 *
 * - generateTransparencyReport - A function that generates a transparency report.
 * - GenerateTransparencyReportInput - The input type for the generateTransparencyReport function.
 * - GenerateTransparencyReportOutput - The return type for the generateTransparencyReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTransparencyReportInputSchema = z.object({
  auditLogs: z.string().describe('A comprehensive log of all transactions and activities within the system.'),
});
export type GenerateTransparencyReportInput = z.infer<typeof GenerateTransparencyReportInputSchema>;

const GenerateTransparencyReportOutputSchema = z.object({
  summary: z.string().describe('A concise, human-readable summary of the audit logs, highlighting key transactions and overall financial health.'),
});
export type GenerateTransparencyReportOutput = z.infer<typeof GenerateTransparencyReportOutputSchema>;

export async function generateTransparencyReport(input: GenerateTransparencyReportInput): Promise<GenerateTransparencyReportOutput> {
  return generateTransparencyReportFlow(input);
}

const transparencyReportPrompt = ai.definePrompt({
  name: 'transparencyReportPrompt',
  input: {schema: GenerateTransparencyReportInputSchema},
  output: {schema: GenerateTransparencyReportOutputSchema},
  prompt: `You are an AI assistant tasked with generating a transparent and concise summary from financial audit logs for the members of Memorial Share Community in New Jersey.

  Given the audit logs below, reason through the transactions and activities, and create a summary that highlights key financial activities, overall financial health, and any important information that the community members should be aware of. Your summary should foster trust and transparency within the community.

  Audit Logs:
  {{auditLogs}}
  `,
});

const generateTransparencyReportFlow = ai.defineFlow(
  {
    name: 'generateTransparencyReportFlow',
    inputSchema: GenerateTransparencyReportInputSchema,
    outputSchema: GenerateTransparencyReportOutputSchema,
  },
  async input => {
    const {output} = await transparencyReportPrompt(input);
    return output!;
  }
);
