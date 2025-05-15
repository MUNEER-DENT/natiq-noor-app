'use server';

/**
 * @fileOverview A translation AI agent.
 *
 * - translateUserMessage - A function that handles the translation process.
 * - TranslateUserMessageInput - The input type for the translateUserMessage function.
 * - TranslateUserMessageOutput - The return type for the translateUserMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateUserMessageInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.enum(['en', 'ar']).describe('The target language for the translation.'),
});
export type TranslateUserMessageInput = z.infer<typeof TranslateUserMessageInputSchema>;

const TranslateUserMessageOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateUserMessageOutput = z.infer<typeof TranslateUserMessageOutputSchema>;

export async function translateUserMessage(input: TranslateUserMessageInput): Promise<TranslateUserMessageOutput> {
  return translateUserMessageFlow(input);
}

const translateUserMessagePrompt = ai.definePrompt({
  name: 'translateUserMessagePrompt',
  input: {schema: TranslateUserMessageInputSchema},
  output: {schema: TranslateUserMessageOutputSchema},
  prompt: `Translate the following text to {{targetLanguage}}:\n\n{{text}}`,
});

const translateUserMessageFlow = ai.defineFlow(
  {
    name: 'translateUserMessageFlow',
    inputSchema: TranslateUserMessageInputSchema,
    outputSchema: TranslateUserMessageOutputSchema,
  },
  async input => {
    const {output} = await translateUserMessagePrompt(input);
    return output!;
  }
);
