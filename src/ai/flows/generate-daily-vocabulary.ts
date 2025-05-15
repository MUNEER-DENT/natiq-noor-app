
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
      english: z.string().describe('The English word.'),
      arabicTranslation: z.string().describe('The Arabic translation of the word.'),
      arabicTransliteration: z.string().describe('The Arabic transliteration of the word.'),
    })
  ).describe('A list of English words with their Arabic translations and transliterations.'),
});
export type GenerateDailyVocabularyOutput = z.infer<typeof GenerateDailyVocabularyOutputSchema>;

export async function generateDailyVocabulary(input: GenerateDailyVocabularyInput): Promise<GenerateDailyVocabularyOutput> {
  return generateDailyVocabularyFlow(input);
}

const generateDailyVocabularyPrompt = ai.definePrompt({
  name: 'generateDailyVocabularyPrompt',
  input: {schema: GenerateDailyVocabularyInputSchema},
  output: {schema: GenerateDailyVocabularyOutputSchema},
  prompt: `Provide a list of {{numWords}} common English words with their Arabic translations and transliterations.

      Format the response as a JSON array of objects, where each object has the following keys:
      - english: The English word.
      - arabicTranslation: The Arabic translation of the word.
      - arabicTransliteration: The Arabic transliteration of the word.

      Example:
      [
        {
          "english": "hello",
          "arabicTranslation": "مرحبا",
          "arabicTransliteration": "mrhba"
        },
        ...
      ]`,      
});

const translateToArabic = ai.defineTool(
  {
    name: 'translateToArabic',
    description: 'Translates a given English word to Arabic.',
    inputSchema: z.object({
      englishWord: z.string().describe('The English word to translate.'),
    }),
    outputSchema: z.string().describe('The Arabic translation of the word.'),
  },
  async (input) => {
    const translatePrompt = ai.definePrompt({
      name: 'translatePrompt',
      prompt: `Translate the following English word to Arabic: {{{englishWord}}}`,
    });
    const {output} = await translatePrompt(input);
    return output!;
  }
);

const transliterateToArabic = ai.defineTool(
  {
    name: 'transliterateToArabic',
    description: 'Transliterates a given English word to Arabic script.',
    inputSchema: z.object({
      englishWord: z.string().describe('The English word to transliterate.'),
    }),
    outputSchema: z.string().describe('The Arabic transliteration of the word.'),
  },
  async (input) => {
    const transliteratePrompt = ai.definePrompt({
      name: 'transliteratePrompt',
      prompt: `Transliterate the following English word to Arabic script: {{{englishWord}}}`,
    });
    const {output} = await transliteratePrompt(input);
    return output!;
  }
);

const generateDailyVocabularyFlow = ai.defineFlow(
  {
    name: 'generateDailyVocabularyFlow',
    inputSchema: GenerateDailyVocabularyInputSchema,
    outputSchema: GenerateDailyVocabularyOutputSchema,
  },
  async input => {
    const {numWords} = input;
    const words: { english: string; arabicTranslation: string; arabicTransliteration: string }[] = [];

    // Generate the words using the prompt
    const {output} = await generateDailyVocabularyPrompt({numWords});

    // If the prompt returns a valid JSON, parse it and return it.  Otherwise, return an empty array.
    if (output) {
      return output;
    } else {
      return {words: []};
    }
  }
);
