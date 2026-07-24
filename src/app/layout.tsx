import type { Metadata } from 'next';
import { Geist, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import BannedOverlay from '@/components/BannedOverlay';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'SnipLive | Live Preview Code Snippet Manager',
  description: 'Paste your code, see it come alive, and save it in seconds.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className={`${geist.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <ToastProvider>
          {children}
          <BannedOverlay />
        </ToastProvider>
      </body>
    </html>
  );
}

