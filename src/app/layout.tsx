// MealAppeal Root Layout with Hydration Fix
// Prevents server/client hydration mismatches

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

// Load Inter font for MealAppeal branding
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// MealAppeal metadata
export const metadata: Metadata = {
  title: "MealAppeal - AI-Powered Food Analysis & Community",
  description: "Transform your food photos into detailed nutrition insights and connect with a community of food lovers. AI-powered meal analysis, nutrition tracking, and social food sharing.",
  keywords: "food analysis, AI nutrition, meal tracking, food photography, nutrition insights, food community",
  authors: [{ name: "MealAppeal Team" }],
  creator: "MealAppeal",
  publisher: "MealAppeal",
  applicationName: "MealAppeal",
  
  // Open Graph metadata for social sharing
  openGraph: {
    title: "MealAppeal - AI-Powered Food Analysis",
    description: "Transform your meals into shareable experiences with AI-powered analysis",
    url: "https://www.MealAppeal.app",
    siteName: "MealAppeal",
    type: "website",
    locale: "en_US",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "MealAppeal - AI Food Analysis",
    description: "Transform your meals with AI-powered nutrition insights",
    creator: "@MealAppeal",
  },

  // Favicon and app icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#22c55e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MealAppeal" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://dxuabbcppncshcparsqd.supabase.co" />
      </head>
      <body 
        className="font-sans antialiased bg-background text-foreground min-h-screen"
        suppressHydrationWarning
      >
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
            
            <footer className="border-t bg-muted/50 py-4">
              <div className="container flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-foreground">MealAppeal</span>
                  <span>•</span>
                  <span>AI-Powered Food Analysis</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span>fit@MealAppeal.app</span>
                  <span>•</span>
                  <span>© 2025</span>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}