'use client'

import Image from 'next/image'
import { User } from 'lucide-react'
import { useState } from 'react'

interface AvatarImageProps {
  src?: string | null
  alt?: string
  size?: number
  className?: string
  fallbackIcon?: React.ReactNode
}

export default function AvatarImage({ 
  src, 
  alt = 'Avatar', 
  size = 40, 
  className = '',
  fallbackIcon
}: AvatarImageProps) {
  const [imageError, setImageError] = useState(false)
  
  // Check if it's a standard avatar (local SVG)
  const isStandardAvatar = src?.startsWith('/avatars/')
  
  if (!src || imageError) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
        }}
      >
        {fallbackIcon || <User style={{ width: size * 0.6, height: size * 0.6, color: 'white' }} />}
      </div>
    )
  }
  
  // For standard avatars, use regular img tag for better SVG support
  if (isStandardAvatar) {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'cover', borderRadius: '50%' }}
        onError={() => setImageError(true)}
      />
    )
  }
  
  // For uploaded avatars from Supabase
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'cover', borderRadius: '50%' }}
      onError={() => setImageError(true)}
      unoptimized // Since we already optimize during upload
    />
  )
}