import type { SupabaseClient } from '@supabase/supabase-js'

// Storage bucket configuration
export const STORAGE_CONFIG = {
  buckets: {
    meals: 'meal-images',
    avatars: 'user-avatars',
    thumbnails: 'meal-thumbnails'
  },
  cdn: {
    baseUrl: `${process.env['NEXT_PUBLIC_SUPABASE_URL']}/storage/v1/object/public`,
    transformUrl: `${process.env['NEXT_PUBLIC_SUPABASE_URL']}/storage/v1/render/image/public`
  },
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: {
      full: { width: 1200, height: 1200 },
      medium: { width: 600, height: 600 },
      thumbnail: { width: 150, height: 150 }
    }
  },
  policies: {
    free: {
      maxStorageGB: 1,
      maxFilesPerMonth: 50,
      retentionDays: 14
    },
    premium_monthly: {
      maxStorageGB: 10,
      maxFilesPerMonth: 500,
      retentionDays: -1 // Unlimited
    },
    premium_yearly: {
      maxStorageGB: 20,
      maxFilesPerMonth: 1000,
      retentionDays: -1 // Unlimited
    }
  }
}

interface IIImageUploadOptions {
  userId: string
  bucket?: string
  folder?: string
  fileName?: string
  quality?: number
  resize?: boolean
  generateThumbnail?: boolean
  metadata?: Record<string, string>
}

interface IIImageUploadResult {
  success: boolean
  fullUrl?: string
  thumbnailUrl?: string
  cdnUrl?: string
  path?: string
  size?: number
  dimensions?: { width: number; height: number }
  error?: string
}

interface IIImageProcessingOptions {
  maxWidth: number
  maxHeight: number
  quality: number
  format?: 'webp' | 'jpeg' | 'png'
}

// Client-side image compression
export async function compressImage(
  file: File | Blob,
  options: IImageProcessingOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      const aspectRatio = width / height

      if (width > options.maxWidth || height > options.maxHeight) {
        if (width / options.maxWidth > height / options.maxHeight) {
          width = options.maxWidth
          height = width / aspectRatio
        } else {
          height = options.maxHeight
          width = height * aspectRatio
        }
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        `image/${options.format || 'webp'}`,
        options.quality / 100
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))

    // Load image
    if (file instanceof File) {
      img.src = URL.createObjectURL(file)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  })
}

// Convert base64 to blob
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',')
  const mimeMatch = parts[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const bstr = atob(parts[1])
  const n = bstr.length
  const u8arr = new Uint8Array(n)

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }

  return new Blob([u8arr], { type: mime })
}

// Main image upload function
export async function uploadImage(
  supabase: SupabaseClient,
  imageData: string | File | Blob,
  options: IImageUploadOptions
): Promise<IImageUploadResult> {
  try {
    const {
      userId,
      bucket = STORAGE_CONFIG.buckets.meals,
      folder = '',
      fileName,
      quality = 85,
      resize = true,
      generateThumbnail = true,
      metadata = {}
    } = options

    // Convert base64 to blob if needed
    let imageBlob: Blob
    if (typeof imageData === 'string') {
      imageBlob = base64ToBlob(imageData)
    } else {
      imageBlob = imageData
    }

    // Validate file type
    if (!STORAGE_CONFIG.limits.allowedTypes.includes(imageBlob.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
      }
    }

    // Validate file size
    if (imageBlob.size > STORAGE_CONFIG.limits.maxFileSize) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit.'
      }
    }

    // Generate file name
    const timestamp = Date.now()
    const extension = imageBlob.type.split('/')[1] || 'jpg'
    const baseName = fileName || `meal_${timestamp}`
    const fullFileName = `${baseName}.${extension}`
    const filePath = folder ? `${userId}/${folder}/${fullFileName}` : `${userId}/${fullFileName}`

    // Compress main image if needed
    let processedImage = imageBlob
    if (resize) {
      processedImage = await compressImage(imageBlob, {
        maxWidth: STORAGE_CONFIG.limits.dimensions.full.width,
        maxHeight: STORAGE_CONFIG.limits.dimensions.full.height,
        quality,
        format: 'webp'
      })
    }

    // Upload main image
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, processedImage, {
        contentType: processedImage.type,
        upsert: true,
        metadata: {
          ...metadata,
          userId,
          uploadedAt: new Date().toISOString(),
          originalSize: imageBlob.size.toString(),
          processedSize: processedImage.size.toString()
        }
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return {
        success: false,
        error: uploadError.message
      }
    }

    // Generate URLs
    const { data: { publicUrl: fullUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    // CDN URL with transformation
    const cdnUrl = `${STORAGE_CONFIG.cdn.transformUrl}/${bucket}/${filePath}?width=800&quality=80`

    let thumbnailUrl: string | undefined

    // Generate and upload thumbnail
    if (generateThumbnail) {
      try {
        const thumbnail = await compressImage(imageBlob, {
          maxWidth: STORAGE_CONFIG.limits.dimensions.thumbnail.width,
          maxHeight: STORAGE_CONFIG.limits.dimensions.thumbnail.height,
          quality: 70,
          format: 'webp'
        })

        const thumbnailPath = filePath.replace(`.${extension}`, '_thumb.webp')
        
        const { error: thumbError } = await supabase.storage
          .from(STORAGE_CONFIG.buckets.thumbnails)
          .upload(thumbnailPath, thumbnail, {
            contentType: 'image/webp',
            upsert: true
          })

        if (!thumbError) {
          const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_CONFIG.buckets.thumbnails)
            .getPublicUrl(thumbnailPath)
          
          thumbnailUrl = publicUrl
        }
      } catch (thumbError) {
        console.error('Thumbnail generation error:', thumbError)
        // Continue without thumbnail
      }
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(imageBlob)

    return {
      success: true,
      fullUrl,
      thumbnailUrl,
      cdnUrl,
      path: filePath,
      size: processedImage.size,
      dimensions
    }

  } catch (error: any) {
    console.error('Image upload error:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload image'
    }
  }
}

// Get image dimensions
function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
    }
    img.src = URL.createObjectURL(blob)
  })
}

// Delete image from storage
export async function deleteImage(
  supabase: SupabaseClient,
  path: string,
  bucket: string = STORAGE_CONFIG.buckets.meals
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      return { success: false, error: error.message }
    }

    // Also try to delete thumbnail
    const thumbnailPath = path.replace(/\.[^.]+$/, '_thumb.webp')
    await supabase.storage
      .from(STORAGE_CONFIG.buckets.thumbnails)
      .remove([thumbnailPath])

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Check user storage quota
export async function checkStorageQuota(
  supabase: SupabaseClient,
  userId: string,
  userTier: string
): Promise<{
  canUpload: boolean
  usedGB: number
  limitGB: number
  filesThisMonth: number
  filesLimit: number
}> {
  try {
    const policy = STORAGE_CONFIG.policies[userTier as keyof typeof STORAGE_CONFIG.policies] 
      || STORAGE_CONFIG.policies.free

    // Get user's files from this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: meals, error } = await supabase
      .from('meals')
      .select('image_path, created_at')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    if (error) {
      console.error('Error checking quota:', error)
      return {
        canUpload: true,
        usedGB: 0,
        limitGB: policy.maxStorageGB,
        filesThisMonth: 0,
        filesLimit: policy.maxFilesPerMonth
      }
    }

    const filesThisMonth = meals?.length || 0
    
    // Estimate storage (simplified - in production, track actual sizes)
    const avgFileSizeMB = 0.5 // Assume 500KB average after compression
    const usedGB = (filesThisMonth * avgFileSizeMB) / 1024

    return {
      canUpload: filesThisMonth < policy.maxFilesPerMonth && usedGB < policy.maxStorageGB,
      usedGB,
      limitGB: policy.maxStorageGB,
      filesThisMonth,
      filesLimit: policy.maxFilesPerMonth
    }
  } catch (error) {
    console.error('Storage quota check error:', error)
    return {
      canUpload: true,
      usedGB: 0,
      limitGB: 1,
      filesThisMonth: 0,
      filesLimit: 50
    }
  }
}

// Generate thumbnail from image blob
export async function generateThumbnail(
  imageBlob: Blob,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  } = {}
): Promise<Blob> {
  const { 
    width = 150, 
    height = 150, 
    quality = 0.8, 
    format = 'webp' 
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = img.width / img.height
      let newWidth = width
      let newHeight = height

      if (aspectRatio > 1) {
        newHeight = width / aspectRatio
      } else {
        newWidth = height * aspectRatio
      }

      canvas.width = newWidth
      canvas.height = newHeight

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to generate thumbnail'))
          }
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(imageBlob)
  })
}

// Clean up old images for free tier users
export async function cleanupOldImages(
  supabase: SupabaseClient,
  userId: string,
  retentionDays: number
): Promise<{ deleted: number; errors: number }> {
  if (retentionDays < 0) return { deleted: 0, errors: 0 } // Unlimited retention

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  try {
    // Get old meals
    const { data: oldMeals, error } = await supabase
      .from('meals')
      .select('id, image_path')
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString())

    if (error || !oldMeals) {
      console.error('Error fetching old meals:', error)
      return { deleted: 0, errors: 0 }
    }

    let deleted = 0
    let errors = 0

    // Delete images and records
    for (const meal of oldMeals) {
      if (meal.image_path) {
        const deleteResult = await deleteImage(supabase, meal.image_path)
        if (!deleteResult.success) errors++
      }

      // Delete meal record
      const { error: deleteError } = await supabase
        .from('meals')
        .delete()
        .eq('id', meal.id)

      if (deleteError) {
        errors++
      } else {
        deleted++
      }
    }

    return { deleted, errors }
  } catch (error) {
    console.error('Cleanup error:', error)
    return { deleted: 0, errors: 1 }
  }
}

// Generate signed URL for private access
export async function getSignedUrl(
  supabase: SupabaseClient,
  path: string,
  bucket: string = STORAGE_CONFIG.buckets.meals,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      return { error: error.message }
    }

    return { url: data.signedUrl }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Progressive image loading component helper
export function getProgressiveImageUrls(basePath: string, bucket: string = STORAGE_CONFIG.buckets.meals) {
  const baseUrl = `${STORAGE_CONFIG.cdn.transformUrl}/${bucket}/${basePath}`
  
  return {
    placeholder: `${baseUrl}?width=50&quality=10&blur=20`, // Tiny blurred placeholder
    thumbnail: `${baseUrl}?width=150&quality=60`,
    medium: `${baseUrl}?width=600&quality=75`,
    full: `${baseUrl}?width=1200&quality=85`,
    webp: {
      thumbnail: `${baseUrl}?width=150&quality=60&format=webp`,
      medium: `${baseUrl}?width=600&quality=75&format=webp`,
      full: `${baseUrl}?width=1200&quality=85&format=webp`
    }
  }
}

// Image optimization utilities
export function stripExifData(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const dataView = new DataView(arrayBuffer)
      
      // Check for JPEG
      if (dataView.getUint16(0) !== 0xFFD8) {
        // Not a JPEG, return as-is
        resolve(file)
        return
      }
      
      // Simple EXIF stripping - find APP1 marker and remove it
      const stripped = stripExifFromArrayBuffer(arrayBuffer)
      const blob = new Blob([stripped], { type: file.type })
      resolve(blob)
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

function stripExifFromArrayBuffer(buffer: ArrayBuffer): ArrayBuffer {
  const dataView = new DataView(buffer)
  const pieces: ArrayBuffer[] = []
  let offset = 2 // Skip SOI marker
  
  while (offset < dataView.byteLength) {
    const marker = dataView.getUint16(offset)
    
    if (marker === 0xFFE1) {
      // APP1 marker (EXIF) - skip it
      const length = dataView.getUint16(offset + 2)
      offset += 2 + length
    } else if ((marker & 0xFF00) === 0xFF00) {
      // Other marker
      const length = dataView.getUint16(offset + 2)
      pieces.push(buffer.slice(offset, offset + 2 + length))
      offset += 2 + length
    } else {
      // Image data
      pieces.push(buffer.slice(offset))
      break
    }
  }
  
  // Reassemble without EXIF
  const totalLength = pieces.reduce((sum, piece) => sum + piece.byteLength, 2)
  const result = new ArrayBuffer(totalLength)
  const resultView = new Uint8Array(result)
  
  // Add SOI marker
  resultView[0] = 0xFF
  resultView[1] = 0xD8
  
  let resultOffset = 2
  for (const piece of pieces) {
    resultView.set(new Uint8Array(piece), resultOffset)
    resultOffset += piece.byteLength
  }
  
  return result
}