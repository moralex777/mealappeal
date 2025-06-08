import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import { AuthProvider } from '@/contexts/AuthContext'
import './emergency-fix.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MealAppeal - AI-Powered Food Analysis',
  description:
    'Transform your meals into shareable experiences with AI-powered food analysis and community features.',
  keywords: ['food', 'nutrition', 'AI', 'analysis', 'community', 'health'],
  authors: [{ name: 'MealAppeal Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            html, body {
              background: linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%) !important;
              min-height: 100vh !important;
            }
            /* CALENDAR EMERGENCY FIX */
            .react-datepicker,
            .react-datepicker-wrapper,
            [class*="datepicker"],
            [class*="calendar"] {
              background: rgba(255, 255, 255, 0.95) !important;
              border: 2px solid rgba(255, 255, 255, 0.3) !important;
              border-radius: 1rem !important;
              backdrop-filter: blur(10px) !important;
            }
            /* ACTIVITY DROPDOWN GLASS STYLING */
            select {
              background: rgba(255, 255, 255, 0.95) !important;
              backdrop-filter: blur(15px) !important;
              border: 2px solid rgba(255, 255, 255, 0.3) !important;
              border-radius: 0.75rem !important;
              box-shadow: 0 8px 25px rgba(31, 38, 135, 0.3) !important;
            }
            select option {
              background: rgba(255, 255, 255, 0.98) !important;
              backdrop-filter: blur(10px) !important;
              padding: 0.75rem !important;
            }
          `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
