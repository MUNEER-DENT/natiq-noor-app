
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
      arabicTranslation: z.string().describe('The Arabic translation of the English word/phrase.'),
      arabicTransliteration: z.string().describe('The Arabic script transliteration of the original English word/phrase, focusing on phonetic accuracy (e.g., for "Thank you", it should be "ثانك يو").'),
    })
  ).describe('A list of English words or short phrases with their Arabic translations and transliterations of the original English.'),
});
export type GenerateDailyVocabularyOutput = z.infer<typeof GenerateDailyVocabularyOutputSchema>;

export async function generateDailyVocabulary(input: GenerateDailyVocabularyInput): Promise<GenerateDailyVocabularyOutput> {
  return generateDailyVocabularyFlow(input);
}

const generateDailyVocabularyPrompt = ai.definePrompt({
  name: 'generateDailyVocabularyPrompt',
  input: {schema: GenerateDailyVocabularyInputSchema},
  output: {schema: GenerateDailyVocabularyOutputSchema},
  prompt: `You are an English-Arabic vocabulary assistant.
Generate a list of {{numWords}} common English words or short phrases.

For each English word/phrase, you MUST provide:
1.  'english': The original English word or phrase.
2.  'arabicTranslation': The most common and natural Arabic translation for the English word/phrase.
3.  'arabicTransliteration': An Arabic script representation of how the *original English word or phrase* sounds phonetically. This is NOT a transliteration of the Arabic translation. For example, if English is "Thank you", the arabicTransliteration should be something like "ثانك يو", not a transliteration of "شكراً".

Format the response as a JSON array of objects, where each object has the "english", "arabicTranslation", and "arabicTransliteration" keys.

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
      // Fallback or error handling
      // For example, return an empty list or a default set if the prompt fails
      console.error("Failed to generate daily vocabulary from prompt.");
      return {words: [
        {
          english: "Error",
          arabicTranslation: "خطأ",
          arabicTransliteration: "إيرور - لم يتمكن من جلب المفردات"
        }
      ]};
    }
  }
);

