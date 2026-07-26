import type { Metadata } from 'next';
import { Geist, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import BannedOverlay from '@/components/BannedOverlay';
import { ThemeProvider } from '@/context/ThemeContext';
import ShortcutHandler from '@/components/ShortcutHandler';
import AuthInitializer from '@/components/AuthInitializer';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://sniplive.com'),
  title: 'SnipLive | Live Preview Code Snippet Manager',
  description: 'Paste your HTML, CSS, and JS code, see it come alive instantly, and save it in seconds. Build and share your components with the SnipLive community.',
  keywords: ['code snippets', 'live preview', 'HTML CSS JS editor', 'component library', 'coding playground', 'web development'],
  authors: [{ name: 'SnipLive Team' }],
  creator: 'SnipLive',
  openGraph: {
    title: 'SnipLive | Live Preview Code Snippet Manager',
    description: 'Paste your HTML, CSS, and JS code, see it come alive instantly, and save it in seconds.',
    url: 'https://sniplive.com', // Placeholder URL for now
    siteName: 'SnipLive',
    images: [
      {
        url: '/logo.png', // Fallback image for now
        width: 1200,
        height: 630,
        alt: 'SnipLive Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnipLive | Live Preview Code Snippet Manager',
    description: 'Paste your HTML, CSS, and JS code, see it come alive instantly, and save it in seconds.',
    images: ['/logo.png'],
  },
  verification: {
    google: '0cexsjx1Y1zJYof_LlK4uWBn7WYyHpnQ4ZOpHKiuNJY',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className={`${geist.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <AuthInitializer />
            <ShortcutHandler />
            {children}
            <BannedOverlay />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
