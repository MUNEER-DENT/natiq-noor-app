
import { config } from 'dotenv';
config();

import '@/ai/flows/transliterate-user-message.ts';
import '@/ai/flows/generate-daily-vocabulary.ts';
import '@/ai/flows/translate-user-message.ts';
import '@/ai/flows/extract-text-from-image-flow.ts';
