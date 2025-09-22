import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { StartupLogger } from '@/components/common/startup-logger';
import { FaviconSwitcher } from '@/components/common/favicon-switcher';

const inter = Inter({
  subsets: ['latin'],
});

// Use environment variable or default for metadata since it needs to be synchronous
const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Dasharr - Unified Media Dashboard',
  description: 'Consolidate your Plex, Radarr, Sonarr, and Tautulli services into one beautiful dashboard',
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: 'Dasharr - Unified Media Dashboard',
    description: 'Consolidate your Plex, Radarr, Sonarr, and Tautulli services into one beautiful dashboard',
    url: baseUrl,
    siteName: 'Dasharr',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dasharr - Unified Media Dashboard',
    description: 'Consolidate your Plex, Radarr, Sonarr, and Tautulli services into one beautiful dashboard',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/dasharr-favicon.ico" />
        <link rel="icon" type="image/png" sizes="192x192" href="/dasharr-icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/dasharr-apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Dasharr" />
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="en" />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider search={{ enabled: false }}>
          <FaviconSwitcher />
          <StartupLogger />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
