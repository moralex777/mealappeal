import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import { AuthProvider } from '@/contexts/AuthContext'
import { StreakProvider } from '@/contexts/StreakContext'
// import PWARegistration from '@/components/PWARegistration'
// import { MobileFirstUXProvider } from '@/components/MobileFirstUXProvider'
import './emergency-fix.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MealAppeal - Smart Food Analysis',
  description:
    'Transform your meals into shareable experiences with instant food analysis and community features.',
  keywords: ['food', 'nutrition', 'smart analysis', 'analysis', 'community', 'health'],
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
              background: #f9fafb;
              min-height: 100vh !important;
            }
            /* Navigation link fixes */
            nav a {
              text-decoration: none !important;
              color: inherit !important;
            }
            a:link, a:visited, a:hover, a:active {
              text-decoration: none !important;
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
            
            /* DUPLICATE HEADER FIX - Hide injected header with MealAppeal branding */
            /* This targets the specific duplicate header structure */
            div[style*="padding:24px"][style*="max-width:1200px"] {
              display: none !important;
            }
            
            /* Additional selector for better compatibility */
            body > div:not([id]):not([class]) > div[style*="padding:24px"] {
              display: none !important;
            }
            
            /* Target any div that contains the duplicate header pattern */
            div[style*="display:flex"][style*="justify-content:space-between"] {
              /* Only hide if it contains MealAppeal text and Sign Up link */
            }
            div[style*="display:flex"][style*="justify-content:space-between"]:has(a[href="/signup"]) {
              display: none !important;
            }
          `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <StreakProvider>
            {children}
          </StreakProvider>
        </AuthProvider>
        {/* <PWARegistration /> */}
      </body>
    </html>
  )
}
