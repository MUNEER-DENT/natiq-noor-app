// @ts-nocheck
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { BotMessageSquare, Languages, TextQuote, ImageUp, Type, Loader2, AlertCircle, UploadCloud } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { handleTranslateAction, handleTransliterateAction, fetchDailyVocabularyAction } from '@/app/actions';
import type { GenerateDailyVocabularyOutput } from '@/ai/flows/generate-daily-vocabulary';

const MAX_WORDS = 50;

export default function NatiqAiApp() {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>(''); // For "OCR"
  
  const [processedText, setProcessedText] = useState<string>(''); // Text to be sent to AI

  const [targetLanguage, setTargetLanguage] = useState<'en' | 'ar'>('ar');
  const [sourceLanguageTranslit, setSourceLanguageTranslit] = useState<'en' | 'ar'>('en');

  const [translationResult, setTranslationResult] = useState<string | null>(null);
  const [transliterationResult, setTransliterationResult] = useState<string | null>(null);
  
  const [dailyVocabulary, setDailyVocabulary] = useState<GenerateDailyVocabularyOutput['words'] | null>(null);
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState<boolean>(true);

  const [isTranslating, startTranslateTransition] = useTransition();
  const [isTransliterating, startTransliterateTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadDailyVocabulary() {
      setIsLoadingVocabulary(true);
      try {
        const vocabData = await fetchDailyVocabularyAction({ numWords: 3 });
        if (vocabData?.words) {
          setDailyVocabulary(vocabData.words);
        } else {
          setDailyVocabulary([]);
          toast({
            title: 'Vocabulary Error',
            description: 'Could not load daily vocabulary.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Failed to fetch daily vocabulary:', err);
        setDailyVocabulary([]);
        toast({
          title: 'Vocabulary Error',
          description: 'An error occurred while fetching daily vocabulary.',
          variant: 'destructive',
        });
      }
      setIsLoadingVocabulary(false);
    }
    loadDailyVocabulary();
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'text') {
      setProcessedText(inputText);
    } else {
      setProcessedText(extractedText);
    }
  }, [activeTab, inputText, extractedText]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Simulate OCR: In a real app, you'd send the image to a backend for OCR.
      // Here, we'll just provide a placeholder and make it editable.
      setExtractedText(`Text from ${file.name} (edit if needed)`);
      setProcessedText(`Text from ${file.name} (edit if needed)`);
      setInputText(''); // Clear text input if switching to image
      setTranslationResult(null);
      setTransliterationResult(null);
      setError(null);
    }
  };
  
  const checkWordLimit = (text: string): boolean => {
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > MAX_WORDS) {
      setError(`Input exceeds ${MAX_WORDS} words. Please shorten your text.`);
      toast({
        title: 'Word Limit Exceeded',
        description: `Maximum ${MAX_WORDS} words allowed. You have ${wordCount} words.`,
        variant: 'destructive',
      });
      return false;
    }
    setError(null);
    return true;
  };

  const onTranslate = async () => {
    if (!processedText.trim() || !checkWordLimit(processedText)) {
      if (!processedText.trim()) setError("Please enter some text to translate.");
      return;
    }
    setTranslationResult(null);
    setTransliterationResult(null);
    setError(null);

    startTranslateTransition(async () => {
      try {
        const result = await handleTranslateAction({ text: processedText, targetLanguage });
        if (result.error) {
          setError(result.error);
          toast({ title: 'Translation Error', description: result.error, variant: 'destructive' });
        } else {
          setTranslationResult(result.translatedText ?? 'No translation available.');
          toast({ title: 'Translation Successful', description: 'Text translated.' });
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(errorMsg);
        toast({ title: 'Translation Failed', description: errorMsg, variant: 'destructive' });
      }
    });
  };

  const onTransliterate = async () => {
    if (!processedText.trim() || !checkWordLimit(processedText)) {
      if (!processedText.trim()) setError("Please enter some text to transliterate.");
      return;
    }
    setTranslationResult(null);
    setTransliterationResult(null);
    setError(null);

    startTransliterateTransition(async () => {
      try {
        const result = await handleTransliterateAction({ text: processedText, sourceLanguage: sourceLanguageTranslit });
        if (result.error) {
          setError(result.error);
          toast({ title: 'Transliteration Error', description: result.error, variant: 'destructive' });
        } else {
          setTransliterationResult(result.transliteratedText ?? 'No transliteration available.');
          toast({ title: 'Transliteration Successful', description: 'Text transliterated.' });
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(errorMsg);
        toast({ title: 'Transliteration Failed', description: errorMsg, variant: 'destructive' });
      }
    });
  };
  
  const currentWordCount = processedText.trim() === "" ? 0 : processedText.trim().split(/\s+/).length;

  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col items-center p-4 md:p-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3">
          <BotMessageSquare className="h-12 w-12 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold text-primary">Natiq AI</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Your intelligent companion for OCR, translation, and transliteration.
        </p>
      </header>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Interaction Area */}
        <main className="md:col-span-2 space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Type className="mr-2 h-6 w-6 text-accent" /> Input & Actions
              </CardTitle>
              <CardDescription>Enter text or upload an image to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'text' | 'image')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Type className="mr-2 h-4 w-4" /> Enter Text
                  </TabsTrigger>
                  <TabsTrigger value="image" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <ImageUp className="mr-2 h-4 w-4" /> Upload Image
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text">
                  <Textarea
                    placeholder="Type or paste your text here (Arabic or English)..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={6}
                    className="mb-2 focus-visible:ring-accent"
                  />
                </TabsContent>

                <TabsContent value="image">
                  <div className="space-y-4">
                    <Label htmlFor="image-upload" className="block text-sm font-medium text-foreground mb-1">Upload an image for OCR</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted border-primary/50 hover:border-primary">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-primary" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                            </div>
                            <Input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>

                    {imagePreview && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-1">Image Preview:</p>
                        <Image src={imagePreview} alt="Uploaded preview" width={200} height={200} className="rounded-md border object-contain max-h-48" data-ai-hint="abstract tech" />
                      </div>
                    )}
                    <Textarea
                      placeholder="Text extracted from image will appear here (editable)..."
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      rows={4}
                      className="mt-2 focus-visible:ring-accent"
                      aria-label="Extracted text from image"
                    />
                    <p className="text-xs text-muted-foreground">Note: OCR is simulated. Please type or edit the text from your image above.</p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="text-sm text-muted-foreground mt-2 mb-4 text-right">
                Word count: {currentWordCount} / {MAX_WORDS}
              </div>
              
              {error && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="translate-target-lang" className="text-sm font-medium">Translate To</Label>
                  <Select value={targetLanguage} onValueChange={(value) => setTargetLanguage(value as 'en' | 'ar')}>
                    <SelectTrigger id="translate-target-lang" className="w-full focus:ring-accent">
                      <SelectValue placeholder="Select target language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">Arabic (العربية)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={onTranslate} disabled={isTranslating || !processedText.trim()} className="w-full mt-2 bg-primary hover:bg-primary/90">
                    {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                    Translate
                  </Button>
                </div>
                <div>
                  <Label htmlFor="translit-source-lang" className="text-sm font-medium">Transliterate From</Label>
                   <Select value={sourceLanguageTranslit} onValueChange={(value) => setSourceLanguageTranslit(value as 'en' | 'ar')}>
                    <SelectTrigger id="translit-source-lang" className="w-full focus:ring-accent">
                      <SelectValue placeholder="Select source for transliteration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English Script</SelectItem>
                      <SelectItem value="ar">Arabic Script</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={onTransliterate} disabled={isTransliterating || !processedText.trim()} className="w-full mt-2 bg-accent text-accent-foreground hover:bg-accent/90">
                    {isTransliterating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TextQuote className="mr-2 h-4 w-4" />}
                    Transliterate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {(translationResult || transliterationResult) && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {translationResult && (
                  <div>
                    <h3 className="font-semibold text-primary">Translation:</h3>
                    <p className="p-3 bg-muted rounded-md whitespace-pre-wrap">{translationResult}</p>
                  </div>
                )}
                {transliterationResult && (
                  <div>
                    <h3 className="font-semibold text-accent">Transliteration:</h3>
                    <p className="p-3 bg-muted rounded-md whitespace-pre-wrap">{transliterationResult}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>

        {/* Daily Vocabulary Area */}
        <aside className="md:col-span-1 space-y-6">
          <Card className="shadow-xl sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6 text-accent"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                Daily Vocabulary
              </CardTitle>
              <CardDescription>Expand your lexicon with new words daily.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingVocabulary ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 bg-muted rounded-md animate-pulse h-16"></div>
                  ))}
                </div>
              ) : dailyVocabulary && dailyVocabulary.length > 0 ? (
                <ul className="space-y-3">
                  {dailyVocabulary.map((item, index) => (
                    <li key={index} className="p-3 border border-border rounded-lg shadow-sm bg-card">
                      <p className="font-semibold text-primary text-lg">{item.english}</p>
                      <p className="text-sm text-muted-foreground">
                        Arabic: <span className="font-medium text-foreground">{item.arabicTranslation}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Transliteration: <span className="font-medium text-foreground">{item.arabicTransliteration}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No vocabulary available today. Check back later!</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Natiq AI. Powered by Google Gemini & Next.js.</p>
        <p>Designed for intuitive language interaction.</p>
      </footer>
    </div>
  );
}
