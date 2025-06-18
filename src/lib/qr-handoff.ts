/**
 * QR Code Handoff Service
 * Seamless PC-to-mobile session transfer with auto-login and context preservation
 */

import QRCode from 'qrcode'

import { supabase } from '@/lib/supabase'

import { deviceDetection } from './device-detection'

export interface HandoffSession {
  id: string
  userId?: string
  sessionToken?: string
  currentPath: string
  contextData: Record<string, any>
  expiresAt: Date
  deviceInfo: {
    sourceDevice: string
    targetDevice: 'mobile' | 'any'
    userAgent: string
  }
  analytics: {
    createdAt: Date
    scannedAt?: Date
    completedAt?: Date
    conversionType: 'guest_to_mobile' | 'user_to_mobile' | 'page_to_mobile'
  }
}

export interface QRCodeOptions {
  size: 'small' | 'medium' | 'large'
  style: 'default' | 'branded' | 'minimal'
  includeText: boolean
  customMessage?: string
  trackingContext?: Record<string, any>
}

export interface HandoffResult {
  qrCodeDataURL: string
  handoffUrl: string
  sessionId: string
  expiresIn: number
}

class QRHandoffService {
  private supabaseClient = supabase
  private baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'https://mealappeal.com'

  /**
   * Create a handoff session for PC-to-mobile transfer
   */
  async createHandoffSession(
    currentPath: string,
    contextData: Record<string, any> = {},
    options: Partial<QRCodeOptions> = {}
  ): Promise<HandoffResult> {
    try {
      // Generate unique session ID
      const sessionId = this.generateSessionId()
      
      // Get current user session if available
      const { data: { session } } = await this.supabaseClient.auth.getSession()
      
      // Get device info
      const deviceInfo = deviceDetection.getDeviceInfo()
      
      // Calculate expiration (15 minutes for optimal UX)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
      
      // Create handoff session
      const handoffSession: HandoffSession = {
        id: sessionId,
        userId: session?.user?.id,
        sessionToken: session?.access_token,
        currentPath,
        contextData: {
          ...contextData,
          timestamp: Date.now(),
          referrer: typeof window !== 'undefined' ? document.referrer : undefined
        },
        expiresAt,
        deviceInfo: {
          sourceDevice: this.getDeviceSignature(deviceInfo),
          targetDevice: 'mobile',
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
        },
        analytics: {
          createdAt: new Date(),
          conversionType: session?.user ? 'user_to_mobile' : 'guest_to_mobile'
        }
      }

      // Store session in database
      await this.storeHandoffSession(handoffSession)
      
      // Generate handoff URL
      const handoffUrl = this.generateHandoffUrl(sessionId, currentPath)
      
      // Generate QR code
      const qrCodeDataURL = await this.generateQRCode(handoffUrl, options)
      
      // Track analytics
      this.trackHandoffCreation(sessionId, handoffSession.analytics.conversionType)

      return {
        qrCodeDataURL,
        handoffUrl,
        sessionId,
        expiresIn: 15 * 60 * 1000 // 15 minutes in ms
      }
    } catch (error) {
      console.error('Failed to create handoff session:', error)
      throw new Error('Failed to create mobile handoff session')
    }
  }

  /**
   * Process mobile handoff when QR code is scanned
   */
  async processHandoff(sessionId: string): Promise<{
    success: boolean
    redirectPath: string
    autoLogin: boolean
    contextData: Record<string, any>
    message: string
  }> {
    try {
      // Retrieve handoff session
      const session = await this.getHandoffSession(sessionId)
      
      if (!session) {
        return {
          success: false,
          redirectPath: '/',
          autoLogin: false,
          contextData: {},
          message: 'Invalid or expired handoff session'
        }
      }

      // Check expiration
      if (new Date() > session.expiresAt) {
        await this.deleteHandoffSession(sessionId)
        return {
          success: false,
          redirectPath: '/',
          autoLogin: false,
          contextData: {},
          message: 'Handoff session has expired'
        }
      }

      // Update analytics
      await this.updateHandoffAnalytics(sessionId, 'scannedAt')
      
      // No auto-login - user should manually authenticate
      const autoLogin = false

      // Track successful handoff
      this.trackHandoffSuccess(sessionId, autoLogin)

      // Clean up session (optional - keep for analytics)
      // await this.deleteHandoffSession(sessionId)

      return {
        success: true,
        redirectPath: session.currentPath,
        autoLogin,
        contextData: session.contextData,
        message: 'Successfully opened on mobile!'
      }
    } catch (error) {
      console.error('Failed to process handoff:', error)
      return {
        success: false,
        redirectPath: '/',
        autoLogin: false,
        contextData: {},
        message: 'Failed to process mobile handoff'
      }
    }
  }

  /**
   * Generate QR code with custom styling
   */
  private async generateQRCode(url: string, options: Partial<QRCodeOptions> = {}): Promise<string> {
    const defaultOptions = {
      size: 'medium' as const,
      style: 'branded' as const,
      includeText: true
    }
    
    const config = { ...defaultOptions, ...options }
    
    // Size configuration
    const sizeMap = {
      small: 128,
      medium: 200,
      large: 256
    }
    
    // Style configuration
    const qrOptions: QRCode.QRCodeToDataURLOptions = {
      width: sizeMap[config.size],
      margin: 2,
      color: {
        dark: '#1f2937', // Dark gray
        light: '#ffffff' // White
      },
      errorCorrectionLevel: 'M'
    }
    
    // Apply branded styling
    if (config.style === 'branded') {
      qrOptions.color = {
        dark: '#10b981', // MealAppeal green
        light: '#ffffff'
      }
    } else if (config.style === 'minimal') {
      qrOptions.margin = 1
      qrOptions.color = {
        dark: '#374151',
        light: '#f9fafb'
      }
    }

    try {
      return await QRCode.toDataURL(url, qrOptions)
    } catch (error) {
      console.error('QR code generation failed:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2, 15)
    return `handoff_${timestamp}_${randomPart}`
  }

  /**
   * Generate handoff URL
   */
  private generateHandoffUrl(sessionId: string, currentPath: string): string {
    const params = new URLSearchParams({
      handoff: sessionId,
      utm_source: 'qr_handoff',
      utm_medium: 'qr_code',
      utm_campaign: 'mobile_transition'
    })
    
    const targetPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`
    return `${this.baseUrl}${targetPath}?${params.toString()}`
  }

  /**
   * Get device signature for analytics
   */
  private getDeviceSignature(deviceInfo: any): string {
    return `${deviceInfo.platform}_${deviceInfo.browser}_${deviceInfo.screenSize}`
  }

  /**
   * Store handoff session in database
   */
  private async storeHandoffSession(session: HandoffSession): Promise<void> {
    const { error } = await this.supabaseClient
      .from('handoff_sessions')
      .insert({
        id: session.id,
        user_id: session.userId,
        session_token: session.sessionToken,
        current_path: session.currentPath,
        context_data: session.contextData,
        expires_at: session.expiresAt.toISOString(),
        device_info: session.deviceInfo,
        analytics: session.analytics,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to store handoff session:', error)
      // Fallback to localStorage for critical functionality
      if (typeof window !== 'undefined') {
        localStorage.setItem(`handoff_${session.id}`, JSON.stringify(session))
      }
    }
  }

  /**
   * Retrieve handoff session
   */
  private async getHandoffSession(sessionId: string): Promise<HandoffSession | null> {
    const { data, error } = await this.supabaseClient
      .from('handoff_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error || !data) {
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`handoff_${sessionId}`)
        if (stored) {
          try {
            const session = JSON.parse(stored)
            return {
              ...session,
              expiresAt: new Date(session.expiresAt)
            }
          } catch {
            return null
          }
        }
      }
      return null
    }

    return {
      id: data.id,
      userId: data.user_id,
      sessionToken: data.session_token,
      currentPath: data.current_path,
      contextData: data.context_data,
      expiresAt: new Date(data.expires_at),
      deviceInfo: data.device_info,
      analytics: data.analytics
    }
  }

  /**
   * Update handoff analytics
   */
  private async updateHandoffAnalytics(sessionId: string, field: 'scannedAt' | 'completedAt'): Promise<void> {
    const updateData = {
      [`analytics.${field}`]: new Date().toISOString()
    }

    const { error } = await this.supabaseClient
      .from('handoff_sessions')
      .update(updateData)
      .eq('id', sessionId)

    if (error) {
      console.error('Failed to update handoff analytics:', error)
    }
  }

  /**
   * Delete handoff session
   */
  private async deleteHandoffSession(sessionId: string): Promise<void> {
    await this.supabaseClient
      .from('handoff_sessions')
      .delete()
      .eq('id', sessionId)

    // Also clean up localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`handoff_${sessionId}`)
    }
  }

  /**
   * Track handoff creation analytics
   */
  private trackHandoffCreation(sessionId: string, conversionType: string): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'qr_handoff_created', {
        session_id: sessionId,
        conversion_type: conversionType,
        device_type: deviceDetection.getDeviceInfo().isDesktop ? 'desktop' : 'mobile'
      })
    }
  }

  /**
   * Track handoff success analytics
   */
  private trackHandoffSuccess(sessionId: string, autoLogin: boolean): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'qr_handoff_success', {
        session_id: sessionId,
        auto_login: autoLogin,
        device_type: 'mobile'
      })
    }
  }

  /**
   * Get handoff analytics for admin dashboard
   */
  async getHandoffAnalytics(timeframe: 'day' | 'week' | 'month' = 'week') {
    const startDate = new Date()
    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    const { data, error } = await this.supabaseClient
      .from('handoff_sessions')
      .select('*')
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('Failed to get handoff analytics:', error)
      return null
    }

    // Process analytics data
    const totalCreated = data.length
    const totalScanned = data.filter(s => s.analytics.scannedAt).length
    const totalCompleted = data.filter(s => s.analytics.completedAt).length
    
    const scanRate = totalCreated > 0 ? (totalScanned / totalCreated) * 100 : 0
    const conversionRate = totalScanned > 0 ? (totalCompleted / totalScanned) * 100 : 0

    return {
      totalCreated,
      totalScanned,
      totalCompleted,
      scanRate,
      conversionRate,
      timeframe
    }
  }
}

// Create singleton instance
export const qrHandoffService = new QRHandoffService()

// Utility functions
export const createMobileHandoff = (path: string, context?: Record<string, any>, options?: Partial<QRCodeOptions>) => 
  qrHandoffService.createHandoffSession(path, context, options)

export const processMobileHandoff = (sessionId: string) => 
  qrHandoffService.processHandoff(sessionId)

export const getHandoffAnalytics = (timeframe?: 'day' | 'week' | 'month') => 
  qrHandoffService.getHandoffAnalytics(timeframe)