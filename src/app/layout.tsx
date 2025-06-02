// MealAppeal Root Layout with Hydration Fix
// Prevents server/client hydration mismatches

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'

import Providers from '@/components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Move service worker registration to a client component
const registerSW = async () => {
  if (typeof window !== 'undefined') {
    const { registerServiceWorker } = await import('@/lib/registerSW')
    registerServiceWorker()
  }
}

// Register service worker after hydration
if (typeof window !== 'undefined') {
  registerSW()
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mealappeal.app'),
  title: 'MealAppeal - Your AI Food Tracking Companion',
  description:
    'Track your meals with AI-powered insights, nutrition analysis, and personalized recommendations.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MealAppeal',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.mealappeal.app',
    title: 'MealAppeal - Your AI Food Tracking Companion',
    description:
      'Track your meals with AI-powered insights, nutrition analysis, and personalized recommendations.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'MealAppeal Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MealAppeal - Your AI Food Tracking Companion',
    description:
      'Track your meals with AI-powered insights, nutrition analysis, and personalized recommendations.',
    images: ['/og-image.jpg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f97316',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Remove browser extension attributes early in the page lifecycle */}
        <Script
          id="remove-extension-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function removeAttrs() {
                  document.documentElement.removeAttribute('data-gr-ext-installed');
                  document.documentElement.removeAttribute('data-new-gr-c-s-check-loaded');
                  document.documentElement.removeAttribute('data-grammarly-extension');
                }
                // Remove immediately
                removeAttrs();
                // Remove after DOM content loaded
                document.addEventListener('DOMContentLoaded', removeAttrs);
                // Remove after window load
                window.addEventListener('load', removeAttrs);
                // Periodically check and remove
                setInterval(removeAttrs, 1000);
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Suspense
          fallback={
            // Static loading state to prevent hydration mismatch
            <div className="bg-opacity-50 fixed inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="border-brand-500 mx-auto h-16 w-16 animate-spin rounded-full border-4 border-t-transparent" />
                <p className="text-brand-700 mt-4 font-medium">Loading MealAppeal...</p>
              </div>
            </div>
          }
        >
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  )
}
