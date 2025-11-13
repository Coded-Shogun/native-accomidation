/**
 * Root Layout
 * Applies to all pages in the application
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { env } from '@/env';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: env.NEXT_PUBLIC_APP_NAME,
    template: `%s | ${env.NEXT_PUBLIC_APP_NAME}`,
  },
  description: 'NSFAS-compliant student accommodation management system',
  keywords: [
    'student accommodation',
    'NSFAS',
    'accommodation management',
    'student housing',
    'South Africa',
  ],
  authors: [{ name: 'Student Accommodation Management' }],
  creator: 'Student Accommodation Management',
  publisher: 'Student Accommodation Management',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: env.NEXT_PUBLIC_APP_URL,
    title: env.NEXT_PUBLIC_APP_NAME,
    description: 'NSFAS-compliant student accommodation management system',
    siteName: env.NEXT_PUBLIC_APP_NAME,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="skip-to-content"
          aria-label="Skip to main content"
        >
          Skip to content
        </a>

        {/* Main content */}
        <div id="main-content" role="main">
          {children}
        </div>

        {/* Screen reader announcements */}
        <div
          id="announcements"
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        ></div>
      </body>
    </html>
  );
}
