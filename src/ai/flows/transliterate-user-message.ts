
'use server';

/**
 * @fileOverview A transliteration AI agent.
 *
 * - transliterateUserMessage - A function that handles the transliteration process.
 * - TransliterateUserMessageInput - The input type for the transliterateUserMessage function.
 * - TransliterateUserMessageOutput - The return type for the transliterateUserMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransliterateUserMessageInputSchema = z.object({
  text: z.string().describe('The text to transliterate.'),
  sourceLanguage: z.enum(['en', 'ar']).describe('The source language of the text.'),
});
export type TransliterateUserMessageInput = z.infer<typeof TransliterateUserMessageInputSchema>;

const TransliterateUserMessageOutputSchema = z.object({
  transliteratedText: z.string().describe('The transliterated text.'),
});
export type TransliterateUserMessageOutput = z.infer<typeof TransliterateUserMessageOutputSchema>;

export async function transliterateUserMessage(input: TransliterateUserMessageInput): Promise<TransliterateUserMessageOutput> {
  return transliterateUserMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transliterateUserMessagePrompt',
  input: {schema: TransliterateUserMessageInputSchema},
  output: {schema: TransliterateUserMessageOutputSchema},
  prompt: `You are a helpful assistant that transliterates text between Arabic and English.

If the source language is English, convert the English text to Arabic script, focusing on phonetic accuracy.
**Crucial instructions for English to Arabic script transliteration:**
*   **Do NOT use Arabic diacritics (Tashkeel, e.g., fatha, damma, kasra, sukun, shadda, tanween).**
*   **Instead, use Arabic vowel letters to represent English vowel sounds: ا (alif) for 'a' sounds, و (waw) for 'u' or 'o' sounds, and ي (ya) for 'i' or 'e' sounds.** For example, 'computer' should be transliterated as 'كومبيوتر' not 'كُمبيوتر', and 'hello' should be 'هالو' not 'هَلُو'.
*   When transliterating English text to Arabic script, if the English text contains the letter 'G' (especially the hard 'G' sound as in 'go', 'good', 'game'), preferentially use the Arabic letter 'ق' (Qaf) to represent it. For example, 'game' should be transliterated as 'قيم', and 'good' as 'قود'. Avoid using 'ج' or 'غ' for 'G' unless phonetically more appropriate for specific edge cases or names.

If the source language is Arabic, convert the Arabic text to English script (Latin characters), maintaining the original pronunciation as closely as possible.

Source Language: {{{sourceLanguage}}}
Text: {{{text}}}

Transliterated Text: `,
});

const transliterateUserMessageFlow = ai.defineFlow(
  {
    name: 'transliterateUserMessageFlow',
    inputSchema: TransliterateUserMessageInputSchema,
    outputSchema: TransliterateUserMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
