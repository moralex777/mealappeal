import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import { AuthProvider } from '@/contexts/AuthContext'
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
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
