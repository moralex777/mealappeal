/**
 * Device Detection & Mobile-First UX Utilities
 * Intelligent device detection with mobile experience optimization
 */

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  hasCamera: boolean
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown'
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown'
  screenSize: 'small' | 'medium' | 'large' | 'xlarge'
  touchCapable: boolean
  orientation: 'portrait' | 'landscape'
  networkType?: string
}

export interface MobileExperience {
  shouldShowMobileBanner: boolean
  mobileAdvantages: string[]
  cameraQuality: 'optimal' | 'limited' | 'unavailable'
  recommendedAction: 'continue' | 'switch_mobile' | 'install_pwa'
}

class DeviceDetectionService {
  private deviceInfo: DeviceInfo | null = null
  private mediaQuery: MediaQueryList | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.detectDevice()
      this.setupOrientationListener()
    }
  }

  /**
   * Comprehensive device detection
   */
  detectDevice(): DeviceInfo {
    if (typeof window === 'undefined') {
      return this.getServerSideDefaults()
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const platform = this.detectPlatform(userAgent)
    const browser = this.detectBrowser(userAgent)
    
    // Advanced mobile detection
    const isMobile = this.isMobileDevice(userAgent)
    const isTablet = this.isTabletDevice(userAgent)
    const isDesktop = !isMobile && !isTablet
    
    // Camera capability detection
    const hasCamera = this.detectCameraCapability()
    
    // Screen size detection
    const screenSize = this.getScreenSize()
    
    // Touch capability
    const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    // Orientation
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    
    // Network type (experimental)
    const networkType = this.getNetworkType()

    this.deviceInfo = {
      isMobile,
      isTablet,
      isDesktop,
      hasCamera,
      platform,
      browser,
      screenSize,
      touchCapable,
      orientation,
      networkType
    }

    return this.deviceInfo
  }

  /**
   * Enhanced mobile device detection
   */
  private isMobileDevice(userAgent: string): boolean {
    const mobilePatterns = [
      /android/i,
      /webos/i,
      /iphone/i,
      /ipad/i,
      /ipod/i,
      /blackberry/i,
      /windows phone/i,
      /mobile/i,
      /iemobile/i,
      /opera mini/i,
      /fennec/i,
      /silk/i
    ]

    // Check user agent patterns
    const userAgentMatch = mobilePatterns.some(pattern => pattern.test(userAgent))
    
    // Check screen size (mobile-first approach)
    const screenSizeMatch = window.innerWidth <= 768
    
    // Check touch capability
    const touchMatch = 'ontouchstart' in window
    
    // Check CSS media queries
    const mediaQueryMatch = window.matchMedia('(pointer: coarse)').matches
    
    return userAgentMatch || (screenSizeMatch && touchMatch) || mediaQueryMatch
  }

  /**
   * Tablet detection
   */
  private isTabletDevice(userAgent: string): boolean {
    const tabletPatterns = [
      /ipad/i,
      /android(?!.*mobile)/i,
      /tablet/i,
      /kindle/i,
      /playbook/i,
      /nook/i
    ]

    const userAgentMatch = tabletPatterns.some(pattern => pattern.test(userAgent))
    const screenMatch = window.innerWidth >= 768 && window.innerWidth <= 1024
    const touchMatch = 'ontouchstart' in window

    return userAgentMatch || (screenMatch && touchMatch)
  }

  /**
   * Platform detection
   */
  private detectPlatform(userAgent: string): DeviceInfo['platform'] {
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios'
    if (/android/i.test(userAgent)) return 'android'
    if (/windows/i.test(userAgent)) return 'windows'
    if (/mac/i.test(userAgent)) return 'macos'
    if (/linux/i.test(userAgent)) return 'linux'
    return 'unknown'
  }

  /**
   * Browser detection
   */
  private detectBrowser(userAgent: string): DeviceInfo['browser'] {
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) return 'chrome'
    if (/firefox/i.test(userAgent)) return 'firefox'
    if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'safari'
    if (/edge/i.test(userAgent)) return 'edge'
    if (/opera/i.test(userAgent)) return 'opera'
    return 'unknown'
  }

  /**
   * Camera capability detection
   */
  private detectCameraCapability(): boolean {
    return !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia &&
      window.MediaStream
    )
  }

  /**
   * Screen size categorization
   */
  private getScreenSize(): DeviceInfo['screenSize'] {
    const width = window.innerWidth
    if (width < 640) return 'small'
    if (width < 1024) return 'medium'
    if (width < 1440) return 'large'
    return 'xlarge'
  }

  /**
   * Network type detection (experimental)
   */
  private getNetworkType(): string | undefined {
    // @ts-ignore - Experimental API
    if (navigator.connection) {
      // @ts-ignore
      return navigator.connection.effectiveType || navigator.connection.type
    }
    return undefined
  }

  /**
   * Server-side defaults
   */
  private getServerSideDefaults(): DeviceInfo {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasCamera: false,
      platform: 'unknown',
      browser: 'unknown',
      screenSize: 'large',
      touchCapable: false,
      orientation: 'landscape'
    }
  }

  /**
   * Orientation change listener
   */
  private setupOrientationListener(): void {
    if (typeof window === 'undefined') return

    this.mediaQuery = window.matchMedia('(orientation: portrait)')
    this.mediaQuery.addEventListener('change', () => {
      if (this.deviceInfo) {
        this.deviceInfo.orientation = this.mediaQuery?.matches ? 'portrait' : 'landscape'
      }
    })
  }

  /**
   * Get current device info
   */
  getDeviceInfo(): DeviceInfo {
    if (!this.deviceInfo) {
      this.detectDevice()
    }
    return this.deviceInfo!
  }

  /**
   * Analyze mobile experience recommendation
   */
  analyzeMobileExperience(): MobileExperience {
    const device = this.getDeviceInfo()
    
    const shouldShowMobileBanner = device.isDesktop && !device.touchCapable
    
    const mobileAdvantages = [
      '📸 Superior camera quality for food analysis',
      '🔍 Real-time photo preview and optimization',
      '📱 Native mobile gestures and touch controls',
      '⚡ Faster image capture and processing',
      '🎯 Optimized UI for one-thumb operation',
      '📍 Location-based meal tracking',
      '🔔 Smart meal reminders and notifications',
      '💾 Offline photo storage and sync'
    ]

    let cameraQuality: MobileExperience['cameraQuality'] = 'unavailable'
    if (device.hasCamera) {
      cameraQuality = device.isMobile ? 'optimal' : 'limited'
    }

    let recommendedAction: MobileExperience['recommendedAction'] = 'continue'
    if (device.isDesktop) {
      recommendedAction = 'switch_mobile'
    } else if (device.isMobile && this.isPWAInstallable()) {
      recommendedAction = 'install_pwa'
    }

    return {
      shouldShowMobileBanner,
      mobileAdvantages,
      cameraQuality,
      recommendedAction
    }
  }

  /**
   * Check if PWA installation is available
   */
  isPWAInstallable(): boolean {
    if (typeof window === 'undefined') return false
    
    // Check if running in PWA mode
    const isInPWA = window.matchMedia('(display-mode: standalone)').matches
    if (isInPWA) return false

    // Check if beforeinstallprompt event is available
    return 'onbeforeinstallprompt' in window
  }

  /**
   * Get optimal camera settings for current device
   */
  getOptimalCameraSettings() {
    const device = this.getDeviceInfo()
    
    if (device.isMobile) {
      return {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: 'environment',
        aspectRatio: 16/9
      }
    } else {
      return {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
        aspectRatio: 16/9
      }
    }
  }

  /**
   * Get device-specific feature recommendations
   */
  getFeatureRecommendations() {
    const device = this.getDeviceInfo()
    const experience = this.analyzeMobileExperience()
    
    return {
      showQRCode: device.isDesktop,
      showFileUpload: device.isDesktop || !device.hasCamera,
      showCameraCapture: device.hasCamera,
      showPWAInstall: device.isMobile && this.isPWAInstallable(),
      showMobileBanner: experience.shouldShowMobileBanner,
      enableOfflineMode: device.isMobile,
      enablePushNotifications: device.isMobile,
      optimizeForTouch: device.touchCapable,
      useNativeSharing: device.isMobile,
      showLocationTracking: device.isMobile
    }
  }

  /**
   * Analytics tracking data
   */
  getAnalyticsData() {
    const device = this.getDeviceInfo()
    
    return {
      device_type: device.isMobile ? 'mobile' : device.isTablet ? 'tablet' : 'desktop',
      platform: device.platform,
      browser: device.browser,
      screen_size: device.screenSize,
      has_camera: device.hasCamera,
      touch_capable: device.touchCapable,
      orientation: device.orientation,
      network_type: device.networkType,
      pwa_installable: this.isPWAInstallable()
    }
  }
}

// Singleton instance
export const deviceDetection = new DeviceDetectionService()

// Utility functions
export const isMobileDevice = () => deviceDetection.getDeviceInfo().isMobile
export const isDesktopDevice = () => deviceDetection.getDeviceInfo().isDesktop
export const hasCamera = () => deviceDetection.getDeviceInfo().hasCamera
export const shouldShowMobileBanner = () => deviceDetection.analyzeMobileExperience().shouldShowMobileBanner
export const getFeatureRecommendations = () => deviceDetection.getFeatureRecommendations()
export const getAnalyticsData = () => deviceDetection.getAnalyticsData()

// React hook for device detection
export const useDeviceDetection = () => {
  if (typeof window === 'undefined') {
    return {
      deviceInfo: deviceDetection.getServerSideDefaults(),
      mobileExperience: {
        shouldShowMobileBanner: false,
        mobileAdvantages: [],
        cameraQuality: 'unavailable' as const,
        recommendedAction: 'continue' as const
      },
      features: {
        showQRCode: false,
        showFileUpload: true,
        showCameraCapture: false,
        showPWAInstall: false,
        showMobileBanner: false,
        enableOfflineMode: false,
        enablePushNotifications: false,
        optimizeForTouch: false,
        useNativeSharing: false,
        showLocationTracking: false
      }
    }
  }

  const deviceInfo = deviceDetection.getDeviceInfo()
  const mobileExperience = deviceDetection.analyzeMobileExperience()
  const features = deviceDetection.getFeatureRecommendations()

  return {
    deviceInfo,
    mobileExperience,
    features
  }
}