
// src/ai/flows/generate-daily-vocabulary.ts
'use server';

/**
 * @fileOverview A flow for generating and sending daily English vocabulary words with Arabic translations.
 *
 * - generateDailyVocabulary - A function that generates a list of English words with their Arabic translations and transliterations.
 * - GenerateDailyVocabularyInput - The input type for the generateDailyVocabulary function.
 * - GenerateDailyVocabularyOutput - The return type for the generateDailyVocabulary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyVocabularyInputSchema = z.object({
  numWords: z.number().default(3).describe('The number of words to generate.'),
});
export type GenerateDailyVocabularyInput = z.infer<typeof GenerateDailyVocabularyInputSchema>;

const GenerateDailyVocabularyOutputSchema = z.object({
  words: z.array(
    z.object({
      english: z.string().describe('The English word or phrase.'),
      arabicTranslation: z.string().describe('The Arabic translation.'),
      arabicTransliteration: z.string().describe('The Arabic script transliteration focusing on phonetic accuracy.'),
    })
  ).describe('A list of English words or short phrases with their Arabic translations and transliterations.'),
});
export type GenerateDailyVocabularyOutput = z.infer<typeof GenerateDailyVocabularyOutputSchema>;

export async function generateDailyVocabulary(input: GenerateDailyVocabularyInput): Promise<GenerateDailyVocabularyOutput> {
  return generateDailyVocabularyFlow(input);
}

const generateDailyVocabularyPrompt = ai.definePrompt({
  name: 'generateDailyVocabularyPrompt',
  input: {schema: GenerateDailyVocabularyInputSchema},
  output: {schema: GenerateDailyVocabularyOutputSchema},
  prompt: `Provide a list of {{numWords}} common English words or short phrases with their Arabic translations and a phonetically accurate Arabic script transliteration.

      Format the response as a JSON array of objects, where each object has the following keys:
      - english: The English word or phrase.
      - arabicTranslation: The Arabic translation.
      - arabicTransliteration: The Arabic script transliteration focusing on phonetic accuracy.

      Example:
      [
        {
          "english": "hello",
          "arabicTranslation": "مرحبا",
          "arabicTransliteration": "هالو"
        },
        {
          "english": "thank you",
          "arabicTranslation": "شكرا لك",
          "arabicTransliteration": "ثانك يو"
        },
        {
          "english": "good morning",
          "arabicTranslation": "صباح الخير",
          "arabicTransliteration": "جود مورنينج"
        }
      ]`,
});

const generateDailyVocabularyFlow = ai.defineFlow(
  {
    name: 'generateDailyVocabularyFlow',
    inputSchema: GenerateDailyVocabularyInputSchema,
    outputSchema: GenerateDailyVocabularyOutputSchema,
  },
  async input => {
    const {numWords} = input;
    
    const {output} = await generateDailyVocabularyPrompt({numWords});

    if (output) {
      return output;
    } else {
      return {words: []};
    }
  }
);
