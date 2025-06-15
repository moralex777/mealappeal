/**
 * Image processing utilities for MealAppeal
 * Handles compression, format conversion, EXIF stripping, and security validation
 */

type ImageSize = {
  width: number
  height: number
  quality: number
  suffix: string
}

const IMAGE_SIZES: Record<string, ImageSize> = {
  thumbnail: { width: 150, height: 150, quality: 0.7, suffix: '_thumb' },
  medium: { width: 600, height: 600, quality: 0.8, suffix: '_medium' },
  full: { width: 1200, height: 1200, quality: 0.85, suffix: '_full' },
}

// Security constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const TARGET_FILE_SIZE = 500 * 1024 // 500KB

/**
 * Validates image file for security
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' }
  }

  // Basic malicious file detection (check for suspicious patterns in file name)
  const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js']
  const fileName = file.name.toLowerCase()
  if (suspiciousPatterns.some(pattern => fileName.includes(pattern))) {
    return { valid: false, error: 'Invalid file format' }
  }

  return { valid: true }
}

/**
 * Converts data URL to Blob
 */
export function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  const mimeMatch = arr[0]?.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const bstr = atob(arr[1] || '')
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Converts Blob to data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Strips EXIF data from image by re-encoding it
 */
export async function stripExifData(dataURL: string): Promise<string> {
  // For data URLs, we can skip EXIF stripping since canvas capture doesn't include EXIF
  // This avoids CSP issues with Image loading in some browsers
  if (dataURL.startsWith('data:image/jpeg') || dataURL.startsWith('data:image/png')) {
    // Canvas-captured images don't have EXIF data, so we can return as-is
    return dataURL
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      // Draw image without EXIF data
      ctx.drawImage(img, 0, 0)
      
      // Convert back to data URL
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataURL
  })
}

/**
 * Compresses image to target size
 */
export async function compressImage(
  dataURL: string,
  targetSize: number = TARGET_FILE_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // Calculate new dimensions while maintaining aspect ratio
      const maxDimension = 1200
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension
          width = maxDimension
        } else {
          width = (width / height) * maxDimension
          height = maxDimension
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      // Try different quality levels to achieve target size
      let quality = 0.9
      let compressedDataURL = canvas.toDataURL('image/jpeg', quality)
      let blob = dataURLToBlob(compressedDataURL)

      // Reduce quality until we hit target size or minimum quality
      while (blob.size > targetSize && quality > 0.3) {
        quality -= 0.1
        compressedDataURL = canvas.toDataURL('image/jpeg', quality)
        blob = dataURLToBlob(compressedDataURL)
      }

      resolve(compressedDataURL)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataURL
  })
}

/**
 * Converts image to WebP format with JPEG fallback
 */
export async function convertToWebP(dataURL: string): Promise<{ webp?: string; jpeg: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0)

      // Try WebP first
      const webpDataURL = canvas.toDataURL('image/webp', 0.85)
      const jpegDataURL = canvas.toDataURL('image/jpeg', 0.85)

      // Check if WebP is actually supported (some browsers return jpeg even when asked for webp)
      if (webpDataURL.startsWith('data:image/webp')) {
        resolve({ webp: webpDataURL, jpeg: jpegDataURL })
      } else {
        resolve({ jpeg: jpegDataURL })
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataURL
  })
}

/**
 * Generates multiple image sizes
 */
export async function generateImageSizes(
  dataURL: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  for (const [key, config] of Object.entries(IMAGE_SIZES)) {
    try {
      const resized = await resizeImage(dataURL, config.width, config.height, config.quality)
      results[key] = resized
    } catch (error) {
      console.error(`Failed to generate ${key} size:`, error)
      // Fallback to original for this size
      results[key] = dataURL
    }
  }

  return results
}

/**
 * Resizes image to specified dimensions
 */
async function resizeImage(
  dataURL: string,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height
        if (width > height) {
          width = maxWidth
          height = width / aspectRatio
        } else {
          height = maxHeight
          width = height * aspectRatio
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Use better image smoothing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataURL
  })
}

/**
 * Main image processing pipeline
 */
export async function processImage(dataURL: string): Promise<{
  compressed: string
  sizes: Record<string, string>
  formats: { webp?: string; jpeg: string }
  fileSize: number
}> {
  try {
    // Step 1: Strip EXIF data for privacy
    const strippedDataURL = await stripExifData(dataURL)

    // Step 2: Compress to target size
    const compressed = await compressImage(strippedDataURL, TARGET_FILE_SIZE)

    // Step 3: Generate multiple sizes
    const sizes = await generateImageSizes(compressed)

    // Step 4: Convert to WebP with JPEG fallback
    const formats = await convertToWebP(compressed)

    // Calculate final file size
    const blob = dataURLToBlob(compressed)
    const fileSize = blob.size

    return {
      compressed,
      sizes,
      formats,
      fileSize,
    }
  } catch (error) {
    console.error('Image processing error:', error)
    throw new Error('Failed to process image')
  }
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}