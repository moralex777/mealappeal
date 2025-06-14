import { useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  uploadImage, 
  checkStorageQuota, 
  STORAGE_CONFIG,
  type IImageUploadResult,
  cleanupOldImages
} from '@/lib/supabase-storage'
import { useAuth } from '@/contexts/AuthContext'

interface UseImageUploadOptions {
  bucket?: string
  folder?: string
  quality?: number
  resize?: boolean
  generateThumbnail?: boolean
  onProgress?: (progress: number) => void
  onSuccess?: (result: IImageUploadResult) => void
  onError?: (error: string) => void
}

interface UseImageUploadReturn {
  uploadImage: (imageData: string | File | Blob, fileName?: string) => Promise<IImageUploadResult>
  isUploading: boolean
  progress: number
  quota: {
    canUpload: boolean
    usedGB: number
    limitGB: number
    filesThisMonth: number
    filesLimit: number
  } | null
  checkQuota: () => Promise<void>
  cleanup: () => Promise<{ deleted: number; errors: number }>
  error: string | null
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [quota, setQuota] = useState<UseImageUploadReturn['quota']>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { user, profile } = useAuth()
  const supabase = createClientComponentClient()

  // Check storage quota
  const checkQuota = useCallback(async () => {
    if (!user || !profile) return

    try {
      const quotaInfo = await checkStorageQuota(
        supabase,
        user.id,
        profile.subscription_tier || 'free'
      )
      setQuota(quotaInfo)
    } catch (err: any) {
      console.error('Failed to check quota:', err)
      setError(err.message)
    }
  }, [user, profile, supabase])

  // Upload image function
  const upload = useCallback(async (
    imageData: string | File | Blob,
    fileName?: string
  ): Promise<IImageUploadResult> => {
    if (!user) {
      const error = 'User not authenticated'
      setError(error)
      options.onError?.(error)
      return { success: false, error }
    }

    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Check quota before upload
      const quotaInfo = await checkStorageQuota(
        supabase,
        user.id,
        profile?.subscription_tier || 'free'
      )

      if (!quotaInfo.canUpload) {
        const errorMsg = quotaInfo.filesThisMonth >= quotaInfo.filesLimit
          ? `Monthly upload limit reached (${quotaInfo.filesLimit} files). Upgrade to premium for unlimited uploads.`
          : `Storage limit reached (${quotaInfo.limitGB}GB). Upgrade to premium for more storage.`
        
        setError(errorMsg)
        options.onError?.(errorMsg)
        return { success: false, error: errorMsg }
      }

      // Simulate progress for compression phase
      setProgress(10)
      options.onProgress?.(10)

      // Upload with compression
      const result = await uploadImage(supabase, imageData, {
        userId: user.id,
        bucket: options.bucket,
        folder: options.folder || 'meals',
        fileName,
        quality: options.quality || 85,
        resize: options.resize !== false,
        generateThumbnail: options.generateThumbnail !== false,
        metadata: {
          userTier: profile?.subscription_tier || 'free',
          uploadSource: 'camera'
        }
      })

      setProgress(100)
      options.onProgress?.(100)

      if (result.success) {
        options.onSuccess?.(result)
        // Refresh quota after successful upload
        await checkQuota()
      } else {
        setError(result.error || 'Upload failed')
        options.onError?.(result.error || 'Upload failed')
      }

      return result

    } catch (err: any) {
      const errorMsg = err.message || 'Upload failed'
      setError(errorMsg)
      options.onError?.(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }, [user, profile, supabase, options, checkQuota])

  // Cleanup old images for free tier
  const cleanup = useCallback(async () => {
    if (!user || !profile) {
      return { deleted: 0, errors: 1 }
    }

    const retentionPolicy = STORAGE_CONFIG.policies[
      profile.subscription_tier as keyof typeof STORAGE_CONFIG.policies
    ] || STORAGE_CONFIG.policies.free

    return await cleanupOldImages(
      supabase,
      user.id,
      retentionPolicy.retentionDays
    )
  }, [user, profile, supabase])

  return {
    uploadImage: upload,
    isUploading,
    progress,
    quota,
    checkQuota,
    cleanup,
    error
  }
}

// Hook for progressive image loading
export function useProgressiveImage(src: string) {
  const [currentSrc, setCurrentSrc] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadImage = useCallback((imageSrc: string) => {
    setLoading(true)
    setError(false)

    const img = new Image()
    img.onload = () => {
      setCurrentSrc(imageSrc)
      setLoading(false)
    }
    img.onerror = () => {
      setError(true)
      setLoading(false)
    }
    img.src = imageSrc
  }, [])

  const loadHighRes = useCallback(() => {
    if (src && src !== currentSrc) {
      loadImage(src)
    }
  }, [src, currentSrc, loadImage])

  return {
    src: currentSrc,
    loading,
    error,
    loadHighRes
  }
}

// Hook for lazy loading images
export function useLazyImage(src: string, rootMargin = '100px') {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [error, setError] = useState(false)

  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        },
        { rootMargin }
      )
      observer.observe(node)
      return () => observer.disconnect()
    }
    return undefined
  }, [rootMargin])

  const onLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const onError = useCallback(() => {
    setError(true)
  }, [])

  return {
    imgRef,
    src: isInView ? src : '',
    isLoaded,
    error,
    onLoad,
    onError
  }
}