/**
 * Image compression and validation utilities
 * Ensures images are optimized for storage and display
 */

/**
 * Compress image to ensure it fits in database storage
 * Target: Keep images under 40KB to avoid any truncation issues
 */
export async function compressImage(
  dataUrl: string,
  maxSizeKB: number = 40
): Promise<string> {
  // Extract image data and type
  const matches = dataUrl.match(/^data:image\/(.*?);base64,(.*)$/);
  if (!matches) {
    throw new Error('Invalid image data URL');
  }

  const imageType = matches[1];
  const base64Data = matches[2];

  // Check current size
  const currentSizeKB = Math.ceil(base64Data.length * 0.75 / 1024);
  console.log(`Image size: ${currentSizeKB}KB (target: <${maxSizeKB}KB)`);

  // If already small enough, return as-is
  if (currentSizeKB <= maxSizeKB) {
    return dataUrl;
  }

  // For server-side, we'll return the original if browser APIs aren't available
  if (typeof window === 'undefined') {
    console.warn('Image compression not available server-side');
    return dataUrl;
  }

  try {
    // Create image element
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Load image
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    // Calculate new dimensions (reduce by steps until size is acceptable)
    let scale = 1;
    let quality = 0.9;
    let compressedDataUrl = dataUrl;
    let attempts = 0;
    const maxAttempts = 5;

    while (currentSizeKB > maxSizeKB && attempts < maxAttempts) {
      attempts++;
      
      // Reduce dimensions
      scale *= 0.8;
      const newWidth = Math.floor(img.width * scale);
      const newHeight = Math.floor(img.height * scale);

      // Set canvas size
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw scaled image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to compressed format
      compressedDataUrl = canvas.toDataURL(`image/jpeg`, quality);
      
      // Check new size
      const newMatches = compressedDataUrl.match(/^data:image\/(.*?);base64,(.*)$/);
      if (newMatches) {
        const newSizeKB = Math.ceil(newMatches[2].length * 0.75 / 1024);
        console.log(`Compression attempt ${attempts}: ${newSizeKB}KB (scale: ${scale.toFixed(2)}, quality: ${quality})`);
        
        if (newSizeKB <= maxSizeKB) {
          return compressedDataUrl;
        }
      }

      // Reduce quality for next iteration
      quality *= 0.8;
    }

    console.warn(`Could not compress image to target size after ${attempts} attempts`);
    return compressedDataUrl;

  } catch (error) {
    console.error('Image compression failed:', error);
    return dataUrl; // Return original on error
  }
}

/**
 * Validate image data URL
 */
export function validateImageDataUrl(dataUrl: string): {
  valid: boolean;
  error?: string;
  sizeKB?: number;
} {
  if (!dataUrl) {
    return { valid: false, error: 'No image data provided' };
  }

  // Check format
  const matches = dataUrl.match(/^data:image\/(.*?);base64,(.*)$/);
  if (!matches) {
    return { valid: false, error: 'Invalid image format' };
  }

  const base64Data = matches[2];
  const sizeKB = Math.ceil(base64Data.length * 0.75 / 1024);

  // Check size (warn if over 40KB)
  if (sizeKB > 45) {
    return { 
      valid: true, // Still valid, but might need compression
      error: `Image is ${sizeKB}KB, compression recommended`,
      sizeKB 
    };
  }

  return { valid: true, sizeKB };
}

/**
 * Convert blob to data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert data URL to blob
 */
export function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Ensure image is properly formatted for storage
 */
export async function prepareImageForStorage(dataUrl: string): Promise<string> {
  // Validate
  const validation = validateImageDataUrl(dataUrl);
  if (!validation.valid && !validation.sizeKB) {
    throw new Error(validation.error || 'Invalid image');
  }

  // Compress if needed (only in browser)
  if (typeof window !== 'undefined' && validation.sizeKB && validation.sizeKB > 40) {
    console.log(`Image needs compression: ${validation.sizeKB}KB`);
    return await compressImage(dataUrl, 40);
  }

  return dataUrl;
}