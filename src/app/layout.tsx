import type { Metadata } from 'next';
import { Tajawal, Roboto_Mono } from 'next/font/google'; // Updated font
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';

const tajawal = Tajawal({ // Updated font
  variable: '--font-tajawal',
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'], // Added weights
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ناطق AI - رفيقك اللغوي الذكي', // Translated
  description: 'ترجم، عرب، وتعلم مع ناطق AI، بدعم من Google Gemini.', // Translated
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning> {/* Updated lang and dir */}
      <body className={`${tajawal.variable} ${robotoMono.variable} antialiased font-sans`}> {/* Updated font variable */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
