'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { processMobileHandoff } from '@/lib/qr-handoff'

interface HandoffState {
  isProcessing: boolean
  isComplete: boolean
  autoLogin: boolean
  message: string
  contextData: Record<string, any>
  error: string | null
}

export function useHandoffRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [handoffState, setHandoffState] = useState<HandoffState>({
    isProcessing: false,
    isComplete: false,
    autoLogin: false,
    message: '',
    contextData: {},
    error: null
  })

  useEffect(() => {
    const handoffSessionId = searchParams.get('handoff')
    
    if (handoffSessionId) {
      processHandoff(handoffSessionId)
    }
  }, [searchParams])

  const processHandoff = async (sessionId: string) => {
    setHandoffState(prev => ({
      ...prev,
      isProcessing: true,
      error: null
    }))

    try {
      const result = await processMobileHandoff(sessionId)
      
      setHandoffState({
        isProcessing: false,
        isComplete: result.success,
        autoLogin: result.autoLogin,
        message: result.message,
        contextData: result.contextData,
        error: result.success ? null : result.message
      })

      // Track successful handoff
      if (result.success && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'mobile_handoff_processed', {
          session_id: sessionId,
          auto_login: result.autoLogin,
          success: result.success
        })
      }

      // Redirect after processing
      if (result.success) {
        // Small delay to show success message
        setTimeout(() => {
          // Clean up URL parameters
          const url = new URL(window.location.href)
          url.searchParams.delete('handoff')
          url.searchParams.delete('utm_source')
          url.searchParams.delete('utm_medium')
          url.searchParams.delete('utm_campaign')
          
          // Navigate to the target path
          router.replace(url.pathname + url.search)
        }, 2000)
      }
    } catch (error) {
      console.error('Handoff processing failed:', error)
      setHandoffState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to process mobile handoff'
      }))
    }
  }

  return handoffState
}