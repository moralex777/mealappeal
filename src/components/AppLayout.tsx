'use client'

import { BottomNavigation } from './BottomNavigation'
import { Navigation } from './Navigation'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <Navigation />
      {children}
      <BottomNavigation />
    </>
  )
}