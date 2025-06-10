'use client'

import { useEffect } from 'react'

import { registerServiceWorker } from '@/lib/registerSW'

export default function PWARegistration() {
  useEffect(() => {
    // Register service worker only in production and after initial load
    const timer = setTimeout(() => {
      registerServiceWorker()
    }, 1000) // Delay to avoid blocking initial page load

    return () => clearTimeout(timer)
  }, [])

  return null // This component doesn't render anything
}