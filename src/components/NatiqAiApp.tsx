
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
import { useToast } from '@/hooks/use-toast';
import { handleTranslateAction, handleTransliterateAction, fetchDailyVocabularyAction, handleExtractTextAction } from '@/app/actions';
import type { GenerateDailyVocabularyOutput } from '@/ai/flows/generate-daily-vocabulary';

const MAX_WORDS = 50;
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function detectLanguage(text: string): 'ar' | 'en' {
  if (ARABIC_REGEX.test(text)) {
    return 'ar';
  }
  return 'en';
}

export default function NatiqAiApp() {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  
  const [processedText, setProcessedText] = useState<string>('');

  const [translationResult, setTranslationResult] = useState<string | null>(null);
  const [transliterationResult, setTransliterationResult] = useState<string | null>(null);
  
  const [dailyVocabulary, setDailyVocabulary] = useState<GenerateDailyVocabularyOutput['words'] | null>(null);
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState<boolean>(true);

  const [isTranslating, startTranslateTransition] = useTransition();
  const [isTransliterating, startTransliterateTransition] = useTransition();
  const [isExtractingText, startExtractTextTransition] = useTransition();

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
            title: 'خطأ في المفردات',
            description: 'لم يتم تحميل المفردات اليومية.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Failed to fetch daily vocabulary:', err);
        setDailyVocabulary([]);
        toast({
          title: 'خطأ في المفردات',
          description: 'حدث خطأ أثناء جلب المفردات اليومية.',
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
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUri = reader.result as string;
        setImagePreview(imageDataUri);
        setExtractedText('');
        setProcessedText('');
        setInputText('');
        setTranslationResult(null);
        setTransliterationResult(null);
        setError(null);

        startExtractTextTransition(async () => {
          toast({ title: 'جاري استخراج النص...', description: 'يرجى الانتظار قليلاً.' });
          try {
            const result = await handleExtractTextAction({ imageDataUri });
            if (result.error) {
              setError(result.error);
              setExtractedText('');
              toast({ title: 'خطأ في استخراج النص', description: result.error, variant: 'destructive' });
            } else if (result.extractedText !== undefined) {
              setExtractedText(result.extractedText);
              setProcessedText(result.extractedText);
              if (!result.extractedText.trim()) {
                   toast({ title: 'لم يتم العثور على نص', description: 'لم يتمكن الذكاء الاصطناعي من العثور على نص في الصورة.', variant: 'default' });
              } else {
                   toast({ title: 'تم استخراج النص بنجاح', description: 'يمكنك الآن تعديل النص إذا لزم الأمر.' });
              }
            } else {
              setExtractedText('');
              toast({ title: 'خطأ غير متوقع', description: 'حدث خطأ غير متوقع أثناء استخراج النص.', variant: 'destructive' });
            }
          } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'حدث خطأ غير معروف أثناء استخراج النص.';
            setError(errorMsg);
            setExtractedText('');
            toast({ title: 'فشل استخراج النص', description: errorMsg, variant: 'destructive' });
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const checkWordLimit = (text: string): boolean => {
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > MAX_WORDS) {
      const errorMsg = `الحد الأقصى ${MAX_WORDS} كلمة. لديك ${wordCount} كلمة.`;
      setError(errorMsg);
      toast({
        title: 'تم تجاوز حد الكلمات',
        description: errorMsg,
        variant: 'destructive',
      });
      return false;
    }
    setError(null);
    return true;
  };

  const onTranslate = async () => {
    if (!processedText.trim()) {
        setError("الرجاء إدخال نص للترجمة.");
        return;
    }
    if (!checkWordLimit(processedText)) return;

    setTranslationResult(null);
    setTransliterationResult(null);
    setError(null);

    const detectedInputLang = detectLanguage(processedText);
    const targetLang = detectedInputLang === 'ar' ? 'en' : 'ar';

    startTranslateTransition(async () => {
      try {
        const result = await handleTranslateAction({ text: processedText, targetLanguage: targetLang });
        if (result.error) {
          setError(result.error);
          toast({ title: 'خطأ في الترجمة', description: result.error, variant: 'destructive' });
        } else {
          setTranslationResult(result.translatedText ?? 'لا توجد ترجمة متاحة.');
          toast({ title: 'تمت الترجمة بنجاح', description: `تم ترجمة النص إلى ${targetLang === 'en' ? 'الإنجليزية' : 'العربية'}.` });
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'حدث خطأ غير معروف.';
        setError(errorMsg);
        toast({ title: 'فشلت الترجمة', description: errorMsg, variant: 'destructive' });
      }
    });
  };

  const onTransliterate = async () => {
    if (!processedText.trim()) {
        setError("الرجاء إدخال نص للتعريب.");
        return;
    }
    if (!checkWordLimit(processedText)) return;
    
    setTranslationResult(null);
    setTransliterationResult(null);
    setError(null);

    const detectedInputLang = detectLanguage(processedText);

    startTransliterateTransition(async () => {
      try {
        if (detectedInputLang === 'ar') {
          const translationResponse = await handleTranslateAction({ text: processedText, targetLanguage: 'en' });
          if (translationResponse.error || !translationResponse.translatedText) {
            setError(translationResponse.error || 'فشل ترجمة النص العربي قبل التعريب.');
            toast({ title: 'خطأ في الترجمة الأولية', description: translationResponse.error || 'لم يتمكن من ترجمة النص العربي للإنجليزية.', variant: 'destructive' });
            return;
          }
          
          const englishText = translationResponse.translatedText;
          const translitResponse = await handleTransliterateAction({ text: englishText, sourceLanguage: 'en' });

          if (translitResponse.error) {
            setError(translitResponse.error);
            toast({ title: 'خطأ في التعريب', description: translitResponse.error, variant: 'destructive' });
          } else {
            setTransliterationResult(translitResponse.transliteratedText ?? 'لا يوجد تعريب متاح.');
            toast({ title: 'تم التعريب بنجاح', description: 'تم تعريب النص الإنجليزي الناتج.' });
          }

        } else {
          const result = await handleTransliterateAction({ text: processedText, sourceLanguage: 'en' });
          if (result.error) {
            setError(result.error);
            toast({ title: 'خطأ في التعريب', description: result.error, variant: 'destructive' });
          } else {
            setTransliterationResult(result.transliteratedText ?? 'لا يوجد تعريب متاح.');
            toast({ title: 'تم التعريب بنجاح', description: 'تم تعريب النص إلى الحروف العربية.' });
          }
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'حدث خطأ غير معروف.';
        setError(errorMsg);
        toast({ title: 'فشل التعريب', description: errorMsg, variant: 'destructive' });
      }
    });
  };
  
  const currentWordCount = processedText.trim() === "" ? 0 : processedText.trim().split(/\s+/).length;

  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col items-center p-4 md:p-8 font-sans">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
          <BotMessageSquare className="h-12 w-12 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold text-primary">Natiq AI</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          رفيقك اللغوي الذكي لاستخراج النصوص، الترجمة، والتعريب.
        </p>
      </header>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <main className="md:col-span-2 space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Type className="ms-0 me-2 h-6 w-6 text-accent" /> الإدخال والإجراءات
              </CardTitle>
              <CardDescription>أدخل نصًا أو قم بتحميل صورة للبدء.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'text' | 'image')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Type className="ms-0 me-2 h-4 w-4" /> إدخال نص
                  </TabsTrigger>
                  <TabsTrigger value="image" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <ImageUp className="ms-0 me-2 h-4 w-4" /> تحميل صورة
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text">
                  <Textarea
                    placeholder="اكتب أو الصق النص هنا (عربي أو إنجليزي)..."
                    value={inputText}
                    onChange={(e) => {setInputText(e.target.value); setProcessedText(e.target.value);}}
                    rows={6}
                    className="mb-2 focus-visible:ring-accent"
                    disabled={isExtractingText}
                  />
                </TabsContent>

                <TabsContent value="image">
                  <div className="space-y-4">
                    <Label htmlFor="image-upload" className="block text-sm font-medium text-foreground mb-1">تحميل صورة لاستخراج النص</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="image-upload" className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg  bg-card  border-primary/50 hover:border-primary ${isExtractingText ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-muted'}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {isExtractingText ? <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" /> : <UploadCloud className="w-10 h-10 mb-3 text-primary" />}
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">انقر للتحميل</span> أو قم بالسحب والإفلات</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, GIF حتى 10 ميجابايت</p>
                            </div>
                            <Input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isExtractingText} />
                        </label>
                    </div>

                    {imagePreview && (
                      <div className="mt-4 relative">
                        <p className="text-sm font-medium mb-1">معاينة الصورة:</p>
                        <Image src={imagePreview} alt="Uploaded preview" width={200} height={200} className="rounded-md border object-contain max-h-48" />
                        {isExtractingText && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                    )}
                    <Textarea
                      placeholder={isExtractingText ? "جاري استخراج النص من الصورة..." : "النص المستخرج من الصورة سيظهر هنا (قابل للتعديل)..."}
                      value={extractedText}
                      onChange={(e) => {setExtractedText(e.target.value); setProcessedText(e.target.value);}}
                      rows={4}
                      className="mt-2 focus-visible:ring-accent"
                      aria-label="النص المستخرج من الصورة"
                      readOnly={isExtractingText}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="text-sm text-muted-foreground mt-2 mb-4 text-left rtl:text-right">
                عدد الكلمات: {currentWordCount} / {MAX_WORDS}
              </div>
              
              {error && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 ms-0 me-2" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <Button onClick={onTranslate} disabled={isTranslating || !processedText.trim() || isExtractingText || isTransliterating} className="w-full mt-2 bg-primary hover:bg-primary/90">
                    {isTranslating ? <Loader2 className="ms-0 me-2 h-4 w-4 animate-spin" /> : <Languages className="ms-0 me-2 h-4 w-4" />}
                    ترجمة
                  </Button>
                </div>
                <div>
                  <Button onClick={onTransliterate} disabled={isTransliterating || !processedText.trim() || isExtractingText || isTranslating} className="w-full mt-2 bg-accent text-accent-foreground hover:bg-accent/90">
                    {isTransliterating ? <Loader2 className="ms-0 me-2 h-4 w-4 animate-spin" /> : <TextQuote className="ms-0 me-2 h-4 w-4" />}
                    تعريب
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {(translationResult || transliterationResult) && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">النتائج</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {translationResult && (
                  <div>
                    <h3 className="font-semibold text-primary">الترجمة:</h3>
                    <p className="p-3 bg-muted rounded-md whitespace-pre-wrap">{translationResult}</p>
                  </div>
                )}
                {transliterationResult && (
                  <div>
                    <h3 className="font-semibold text-accent">التعريب:</h3>
                    <p className="p-3 bg-muted rounded-md whitespace-pre-wrap">{transliterationResult}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>

        <aside className="md:col-span-1 space-y-6">
          <Card className="shadow-xl sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ms-0 me-2 h-6 w-6 text-accent"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                مفردات يومية
              </CardTitle>
              <CardDescription>وسّع معجمك بكلمات جديدة يوميًا.</CardDescription>
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
                        العربية: <span className="font-medium text-foreground">{item.arabicTranslation}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        النقل الحرفي: <span className="font-medium text-foreground">{item.arabicTransliteration}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">لا توجد مفردات متاحة اليوم. حاول مرة أخرى لاحقًا!</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Natiq AI. يعمل بواسطة Google Gemini و Next.js.</p>
        <p>مصمم لتفاعل لغوي سلس.</p>
      </footer>
    </div>
  );
}
