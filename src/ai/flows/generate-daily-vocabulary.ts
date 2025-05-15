
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
      arabicTransliteration: z.string().describe('The Arabic script transliteration of the original English word/phrase, focusing on phonetic accuracy. This should represent how the English word/phrase sounds, not a transliteration of the Arabic translation. Crucially, **do not use Arabic diacritics (Tashkeel, e.g., fatha, damma, kasra, sukun, shadda, tanween). Instead, use Arabic vowel letters (ا, و, ي) to represent English vowel sounds.** For example, "Thank you" should be "ثانك يو", and "Good morning" should be "قود مورنينج". When transliterating the English letter \'G\', preferentially use the Arabic letter \'ق\' (Qaf), especially for the hard \'G\' sound (e.g., "Good morning" should be "قود مورنينج").'),
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
Generate a list of {{numWords}} common, varied, and **strictly non-repetitive** English words or short phrases. Aim for maximum diversity in the selection. **It is crucial that the generated words are not simple repetitions of common examples and are distinct from each other in the current list. Avoid re-generating words that might have been provided in recent requests.**

For each English word/phrase, you MUST provide:
1.  'english': The original English word or phrase.
2.  'arabicTranslation': The most common and natural Arabic translation for the English word/phrase.
3.  'arabicTransliteration': An Arabic script representation of how the *original English word or phrase* sounds phonetically. This is NOT a transliteration of the Arabic translation. It should accurately reflect the English pronunciation using Arabic letters.
    **Crucial instructions for arabicTransliteration:**
    *   **Do NOT use Arabic diacritics (Tashkeel, e.g., fatha, damma, kasra, sukun, shadda, tanween).**
    *   **Instead, use Arabic vowel letters to represent English vowel sounds: ا (alif) for 'a' sounds, و (waw) for 'u' or 'o' sounds, and ي (ya) for 'i' or 'e' sounds.** For example, "computer" should be "كومبيوتر", not "كُمْبِيُوتَر".
    *   For "Thank you", the arabicTransliteration should be "ثانك يو".
    *   For "hello", it should be "هالو".
    *   When transliterating the English letter 'G', in most cases, use the Arabic letter 'ق' (Qaf) to represent the English 'G' sound, especially for the hard 'G' sound (as in 'go', 'good', 'game'). For example, if English is "Good morning", the arabicTransliteration should be "قود مورنينج".

Example for "Good morning" (with preferred 'G' transliteration and no diacritics):
{
  "english": "Good morning",
  "arabicTranslation": "صباح الخير",
  "arabicTransliteration": "قود مورنينج"
}

Ensure the words provided are common enough for a language learner but try to avoid overly simple or frequently suggested words if possible, to provide a richer learning experience. **Prioritize novelty and uniqueness in each generated list.**
`,
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

