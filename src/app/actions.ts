
// @ts-nocheck
"use server";

import { translateUserMessage, type TranslateUserMessageInput, type TranslateUserMessageOutput } from '@/ai/flows/translate-user-message';
import { transliterateUserMessage, type TransliterateUserMessageInput, type TransliterateUserMessageOutput } from '@/ai/flows/transliterate-user-message';
import { generateDailyVocabulary, type GenerateDailyVocabularyInput, type GenerateDailyVocabularyOutput } from '@/ai/flows/generate-daily-vocabulary';
import { extractTextFromImage, type ExtractTextFromImageInput, type ExtractTextFromImageOutput } from '@/ai/flows/extract-text-from-image-flow';

interface ActionResult<T> {
  data?: T;
  error?: string;
  translatedText?: string; // for translateUserMessage
  transliteratedText?: string; // for transliterateUserMessage
  words?: GenerateDailyVocabularyOutput['words']; // for generateDailyVocabulary
  extractedText?: string; // for extractTextFromImage
}

export async function handleTranslateAction(
  input: TranslateUserMessageInput
): Promise<ActionResult<TranslateUserMessageOutput>> {
  try {
    const result = await translateUserMessage(input);
    return { translatedText: result.translatedText };
  } catch (error) {
    console.error('Translation Error:', error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred during translation.' };
  }
}

export async function handleTransliterateAction(
  input: TransliterateUserMessageInput
): Promise<ActionResult<TransliterateUserMessageOutput>> {
  try {
    const result = await transliterateUserMessage(input);
    return { transliteratedText: result.transliteratedText };
  } catch (error) {
    console.error('Transliteration Error:', error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred during transliteration.' };
  }
}

export async function fetchDailyVocabularyAction(
  input: GenerateDailyVocabularyInput
): Promise<ActionResult<GenerateDailyVocabularyOutput>> {
  try {
    const result = await generateDailyVocabulary(input);
    return { words: result.words };
  } catch (error) {
    console.error('Daily Vocabulary Error:', error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred while fetching daily vocabulary.' };
  }
}

export async function handleExtractTextAction(
  input: ExtractTextFromImageInput
): Promise<ActionResult<ExtractTextFromImageOutput>> {
  try {
    const result = await extractTextFromImage(input);
    return { extractedText: result.extractedText };
  } catch (error) {
    console.error('Text Extraction Error:', error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred during text extraction.' };
  }
}
