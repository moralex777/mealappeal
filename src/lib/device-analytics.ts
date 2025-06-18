/**
 * Device Analytics & Cross-Device Journey Tracking
 * Comprehensive analytics for mobile-first UX optimization
 */

import { deviceDetection } from './device-detection'
import { supabase } from './supabase'

export interface DeviceSession {
  sessionId: string
  userId?: string
  deviceInfo: any
  startTime: Date
  endTime?: Date
  pageViews: PageView[]
  interactions: UserInteraction[]
  conversions: Conversion[]
  qrCodes: QRCodeInteraction[]
}

export interface PageView {
  path: string
  timestamp: Date
  referrer?: string
  utmParams?: Record<string, string>
  timeOnPage?: number
  exitPage?: boolean
}

export interface UserInteraction {
  type: 'click' | 'scroll' | 'touch' | 'gesture' | 'camera' | 'upload' | 'system'
  element?: string
  timestamp: Date
  data?: Record<string, any>
}

export interface Conversion {
  type: 'mobile_switch' | 'pwa_install' | 'qr_scan' | 'signup' | 'subscription' | 'meal_analysis'
  timestamp: Date
  value?: number
  data?: Record<string, any>
}

export interface QRCodeInteraction {
  sessionId: string
  action: 'generated' | 'displayed' | 'scanned' | 'completed'
  timestamp: Date
  sourceDevice: string
  targetDevice?: string
  conversionTime?: number
  data?: Record<string, any>
}

export interface AnalyticsEvent {
  eventName: string
  properties: Record<string, any>
  timestamp: Date
  sessionId: string
  userId?: string
  deviceInfo: any
}

export interface ConversionFunnel {
  step: string
  entryCount: number
  exitCount: number
  conversionRate: number
  averageTime: number
  dropoffReasons: string[]
}

export interface DeviceJourney {
  journeyId: string
  devices: Array<{
    deviceType: string
    platform: string
    startTime: Date
    endTime?: Date
    pages: string[]
    actions: string[]
  }>
  conversions: Conversion[]
  totalDuration: number
  crossDeviceTransitions: number
}

class DeviceAnalyticsService {
  private supabaseClient = supabase
  private currentSession: DeviceSession | null = null
  private analyticsQueue: AnalyticsEvent[] = []
  private isInitialized = false
  private sessionStartTime = Date.now()

  /**
   * Initialize analytics tracking
   */
  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {return}

    this.currentSession = this.createSession()
    this.setupEventListeners()
    this.startPeriodicFlush()
    this.trackPageView()
    
    this.isInitialized = true
    console.log('Device analytics initialized:', this.currentSession.sessionId)
  }

  /**
   * Create a new analytics session
   */
  private createSession(): DeviceSession {
    const sessionId = this.generateSessionId()
    const deviceInfo = deviceDetection.getAnalyticsData()

    return {
      sessionId,
      deviceInfo,
      startTime: new Date(),
      pageViews: [],
      interactions: [],
      conversions: [],
      qrCodes: []
    }
  }

  /**
   * Setup event listeners for automatic tracking
   */
  private setupEventListeners(): void {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.endSession()
      } else {
        this.resumeSession()
      }
    })

    // Beforeunload event
    window.addEventListener('beforeunload', () => {
      this.endSession()
      this.flushAnalytics()
    })

    // Click tracking
    document.addEventListener('click', (event) => {
      this.trackInteraction('click', {
        element: this.getElementSelector(event.target as Element),
        coordinates: { x: event.clientX, y: event.clientY }
      })
    }, { passive: true })

    // Scroll tracking
    let scrollTimeout: NodeJS.Timeout
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.trackInteraction('scroll', {
          scrollY: window.scrollY,
          scrollPercent: this.getScrollPercentage()
        })
      }, 500)
    }, { passive: true })

    // Touch tracking for mobile
    if (deviceDetection.getDeviceInfo().touchCapable) {
      document.addEventListener('touchstart', (event) => {
        this.trackInteraction('touch', {
          touchCount: event.touches.length,
          element: this.getElementSelector(event.target as Element)
        })
      }, { passive: true })
    }

    // Orientation change tracking
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.trackInteraction('gesture', {
          type: 'orientation_change',
          orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
          screenSize: `${window.innerWidth}x${window.innerHeight}`
        })
      }, 100)
    })

    // Network status changes
    window.addEventListener('online', () => {
      this.trackInteraction('system', { type: 'online' })
      this.flushAnalytics() // Flush queued analytics when back online
    })

    window.addEventListener('offline', () => {
      this.trackInteraction('system', { type: 'offline' })
    })
  }

  /**
   * Track page view
   */
  trackPageView(path?: string): void {
    if (!this.currentSession) {return}

    const pageView: PageView = {
      path: path || window.location.pathname,
      timestamp: new Date(),
      referrer: document.referrer || undefined,
      utmParams: this.extractUtmParams()
    }

    this.currentSession.pageViews.push(pageView)
    
    this.queueEvent('page_view', {
      path: pageView.path,
      referrer: pageView.referrer,
      utm_params: pageView.utmParams,
      device_type: this.currentSession.deviceInfo.device_type
    })
  }

  /**
   * Track user interaction
   */
  trackInteraction(type: UserInteraction['type'], data?: Record<string, any>): void {
    if (!this.currentSession) {return}

    const interaction: UserInteraction = {
      type,
      timestamp: new Date(),
      data
    }

    this.currentSession.interactions.push(interaction)
    
    this.queueEvent('user_interaction', {
      interaction_type: type,
      ...data,
      device_type: this.currentSession.deviceInfo.device_type
    })
  }

  /**
   * Track conversion event
   */
  trackConversion(type: Conversion['type'], value?: number, data?: Record<string, any>): void {
    if (!this.currentSession) {return}

    const conversion: Conversion = {
      type,
      timestamp: new Date(),
      value,
      data
    }

    this.currentSession.conversions.push(conversion)
    
    this.queueEvent('conversion', {
      conversion_type: type,
      conversion_value: value,
      device_type: this.currentSession.deviceInfo.device_type,
      ...data
    })

    // Track specific conversion types with Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        event_category: 'Device Journey',
        event_label: type,
        value,
        custom_parameter_device_type: this.currentSession.deviceInfo.device_type
      })
    }
  }

  /**
   * Track QR code interaction
   */
  trackQRCodeInteraction(
    action: QRCodeInteraction['action'],
    sessionId: string,
    data?: Record<string, any>
  ): void {
    if (!this.currentSession) {return}

    const qrInteraction: QRCodeInteraction = {
      sessionId,
      action,
      timestamp: new Date(),
      sourceDevice: this.currentSession.deviceInfo.device_type,
      data
    }

    this.currentSession.qrCodes.push(qrInteraction)
    
    this.queueEvent('qr_code_interaction', {
      qr_action: action,
      qr_session_id: sessionId,
      source_device: qrInteraction.sourceDevice,
      device_type: this.currentSession.deviceInfo.device_type,
      ...data
    })
  }

  /**
   * Track mobile recommendation banner interaction
   */
  trackMobileBannerInteraction(action: 'shown' | 'clicked' | 'dismissed' | 'qr_generated'): void {
    this.trackInteraction('click', {
      element: 'mobile_banner',
      action
    })

    this.queueEvent('mobile_banner_interaction', {
      action,
      device_type: this.currentSession?.deviceInfo.device_type,
      timestamp: Date.now()
    })
  }

  /**
   * Track PWA installation events
   */
  trackPWAInstallation(event: 'prompt_shown' | 'install_clicked' | 'install_success' | 'install_dismissed'): void {
    this.trackConversion('pwa_install', undefined, { event })
    
    this.queueEvent('pwa_installation', {
      event,
      device_type: this.currentSession?.deviceInfo.device_type,
      platform: this.currentSession?.deviceInfo.platform
    })
  }

  /**
   * Track cross-device journey
   */
  trackCrossDeviceTransition(fromDevice: string, toDevice: string, handoffSessionId?: string): void {
    this.trackConversion('mobile_switch', undefined, {
      from_device: fromDevice,
      to_device: toDevice,
      handoff_session: handoffSessionId
    })

    this.queueEvent('cross_device_transition', {
      from_device: fromDevice,
      to_device: toDevice,
      handoff_session_id: handoffSessionId,
      transition_time: Date.now() - this.sessionStartTime
    })
  }

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<ConversionFunnel[]> {
    const startDate = this.getStartDate(timeframe)
    
    const { data: events, error } = await this.supabaseClient
      .from('analytics_events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .in('event_name', ['page_view', 'mobile_banner_interaction', 'qr_code_interaction', 'conversion'])

    if (error) {
      console.error('Failed to fetch conversion funnel data:', error)
      return []
    }

    // Process events into funnel steps
    const funnelSteps = this.processFunnelData(events)
    return funnelSteps
  }

  /**
   * Get device usage analytics
   */
  async getDeviceUsageAnalytics(timeframe: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getStartDate(timeframe)
    
    const { data: sessions, error } = await this.supabaseClient
      .from('analytics_sessions')
      .select('*')
      .gte('start_time', startDate.toISOString())

    if (error) {
      console.error('Failed to fetch device usage data:', error)
      return null
    }

    return this.processDeviceUsageData(sessions)
  }

  /**
   * Get QR code performance metrics
   */
  async getQRCodeMetrics(timeframe: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getStartDate(timeframe)
    
    const { data: qrEvents, error } = await this.supabaseClient
      .from('analytics_events')
      .select('*')
      .eq('event_name', 'qr_code_interaction')
      .gte('timestamp', startDate.toISOString())

    if (error) {
      console.error('Failed to fetch QR code metrics:', error)
      return null
    }

    return this.processQRCodeData(qrEvents)
  }

  /**
   * Get cross-device journey analytics
   */
  async getCrossDeviceJourneys(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<DeviceJourney[]> {
    const startDate = this.getStartDate(timeframe)
    
    const { data: transitions, error } = await this.supabaseClient
      .from('analytics_events')
      .select('*')
      .eq('event_name', 'cross_device_transition')
      .gte('timestamp', startDate.toISOString())

    if (error) {
      console.error('Failed to fetch cross-device journeys:', error)
      return []
    }

    return this.processCrossDeviceJourneys(transitions)
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateAnalyticsReport(timeframe: 'day' | 'week' | 'month' = 'week') {
    const [
      deviceUsage,
      conversionFunnel,
      qrCodeMetrics,
      crossDeviceJourneys
    ] = await Promise.all([
      this.getDeviceUsageAnalytics(timeframe),
      this.getConversionFunnel(timeframe),
      this.getQRCodeMetrics(timeframe),
      this.getCrossDeviceJourneys(timeframe)
    ])

    return {
      timeframe,
      generatedAt: new Date(),
      deviceUsage,
      conversionFunnel,
      qrCodeMetrics,
      crossDeviceJourneys,
      summary: {
        totalSessions: deviceUsage?.totalSessions || 0,
        mobileConversionRate: this.calculateMobileConversionRate(conversionFunnel),
        qrCodeScanRate: qrCodeMetrics?.scanRate || 0,
        crossDeviceTransitions: crossDeviceJourneys.length,
        topConversionPath: this.getTopConversionPath(conversionFunnel)
      }
    }
  }

  /**
   * Private helper methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  private extractUtmParams(): Record<string, string> | undefined {
    const urlParams = new URLSearchParams(window.location.search)
    const utmParams: Record<string, string> = {}
    
    for (const [key, value] of urlParams.entries()) {
      if (key.startsWith('utm_')) {
        utmParams[key] = value
      }
    }
    
    return Object.keys(utmParams).length > 0 ? utmParams : undefined
  }

  private getElementSelector(element: Element): string {
    if (element.id) {return `#${element.id}`}
    if (element.className) {return `.${element.className.split(' ')[0]}`}
    return element.tagName.toLowerCase()
  }

  private getScrollPercentage(): number {
    const scrollTop = window.pageYOffset
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    return Math.round((scrollTop / docHeight) * 100)
  }

  private queueEvent(eventName: string, properties: Record<string, any>): void {
    if (!this.currentSession) {return}

    const event: AnalyticsEvent = {
      eventName,
      properties,
      timestamp: new Date(),
      sessionId: this.currentSession.sessionId,
      userId: this.currentSession.userId,
      deviceInfo: this.currentSession.deviceInfo
    }

    this.analyticsQueue.push(event)

    // Flush queue if it gets too large
    if (this.analyticsQueue.length >= 10) {
      this.flushAnalytics()
    }
  }

  private async flushAnalytics(): Promise<void> {
    if (this.analyticsQueue.length === 0) {return}

    const events = [...this.analyticsQueue]
    this.analyticsQueue = []

    try {
      // Store in Supabase
      const { error } = await this.supabaseClient
        .from('analytics_events')
        .insert(events.map(event => ({
          event_name: event.eventName,
          properties: event.properties,
          timestamp: event.timestamp.toISOString(),
          session_id: event.sessionId,
          user_id: event.userId,
          device_info: event.deviceInfo
        })))

      if (error) {
        console.error('Failed to flush analytics:', error)
        // Re-queue events if storage fails
        this.analyticsQueue.unshift(...events)
      }
    } catch (error) {
      console.error('Analytics flush error:', error)
      // Store in localStorage as fallback
      const stored = JSON.parse(localStorage.getItem('analytics_queue') || '[]')
      localStorage.setItem('analytics_queue', JSON.stringify([...stored, ...events]))
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushAnalytics()
    }, 30000) // Flush every 30 seconds
  }

  private endSession(): void {
    if (!this.currentSession) {return}

    this.currentSession.endTime = new Date()
    this.flushAnalytics()
  }

  private resumeSession(): void {
    if (!this.currentSession) {
      this.initialize()
    }
  }

  private getStartDate(timeframe: 'day' | 'week' | 'month'): Date {
    const now = new Date()
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  private processFunnelData(events: any[]): ConversionFunnel[] {
    // Implementation for processing funnel data
    return []
  }

  private processDeviceUsageData(sessions: any[]) {
    const mobileCount = sessions.filter(s => s.device_info?.device_type === 'mobile').length
    const desktopCount = sessions.filter(s => s.device_info?.device_type === 'desktop').length
    const tabletCount = sessions.filter(s => s.device_info?.device_type === 'tablet').length

    return {
      totalSessions: sessions.length,
      mobilePercentage: (mobileCount / sessions.length) * 100,
      desktopPercentage: (desktopCount / sessions.length) * 100,
      tabletPercentage: (tabletCount / sessions.length) * 100,
      averageSessionDuration: this.calculateAverageSessionDuration(sessions)
    }
  }

  private processQRCodeData(events: any[]) {
    const generated = events.filter(e => e.properties.qr_action === 'generated').length
    const scanned = events.filter(e => e.properties.qr_action === 'scanned').length
    const completed = events.filter(e => e.properties.qr_action === 'completed').length

    return {
      totalGenerated: generated,
      totalScanned: scanned,
      totalCompleted: completed,
      scanRate: generated > 0 ? (scanned / generated) * 100 : 0,
      completionRate: scanned > 0 ? (completed / scanned) * 100 : 0
    }
  }

  private processCrossDeviceJourneys(transitions: any[]): DeviceJourney[] {
    // Implementation for processing cross-device journeys
    return []
  }

  private calculateAverageSessionDuration(sessions: any[]): number {
    const durationsInMinutes = sessions
      .filter(s => s.end_time)
      .map(s => (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / (1000 * 60))
    
    return durationsInMinutes.length > 0 
      ? durationsInMinutes.reduce((a, b) => a + b, 0) / durationsInMinutes.length 
      : 0
  }

  private calculateMobileConversionRate(funnel: ConversionFunnel[]): number {
    // Implementation for calculating mobile conversion rate
    return 0
  }

  private getTopConversionPath(funnel: ConversionFunnel[]): string {
    // Implementation for finding top conversion path
    return 'desktop → mobile banner → QR scan → mobile app'
  }
}

// Export singleton instance
export const deviceAnalytics = new DeviceAnalyticsService()

// Utility functions
export const initializeAnalytics = () => deviceAnalytics.initialize()
export const trackPageView = (path?: string) => deviceAnalytics.trackPageView(path)
export const trackConversion = (type: Conversion['type'], value?: number, data?: Record<string, any>) => 
  deviceAnalytics.trackConversion(type, value, data)
export const trackQRCodeInteraction = (action: QRCodeInteraction['action'], sessionId: string, data?: Record<string, any>) =>
  deviceAnalytics.trackQRCodeInteraction(action, sessionId, data)
export const trackMobileBannerInteraction = (action: 'shown' | 'clicked' | 'dismissed' | 'qr_generated') =>
  deviceAnalytics.trackMobileBannerInteraction(action)
export const trackPWAInstallation = (event: 'prompt_shown' | 'install_clicked' | 'install_success' | 'install_dismissed') =>
  deviceAnalytics.trackPWAInstallation(event)
export const getAnalyticsReport = (timeframe?: 'day' | 'week' | 'month') =>
  deviceAnalytics.generateAnalyticsReport(timeframe)