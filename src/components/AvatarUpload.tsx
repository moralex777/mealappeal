'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { deleteImage } from '@/lib/supabase-storage'
import AvatarImage from './AvatarImage'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onAvatarUpdate?: (url: string) => void
}

const standardAvatars = [
  { id: 'male', url: '/avatars/male.svg', label: 'Male' },
  { id: 'female', url: '/avatars/female.svg', label: 'Female' },
  { id: 'abstract', url: '/avatars/abstract.svg', label: 'Abstract' },
]

export default function AvatarUpload({ currentAvatarUrl, onAvatarUpdate }: AvatarUploadProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { uploadImage } = useImageUpload({
    bucket: 'user-avatars',
    folder: 'avatars',
    quality: 85,
    resize: true,
    generateThumbnail: false,
    maxDimension: 400, // Avatars don't need to be larger than 400x400
    skipQuotaCheck: true, // Avatars don't count against meal upload quota
  })

  const updateProfileAvatar = async (avatarUrl: string) => {
    if (!user?.id) return

    // Delete old avatar if it exists and is not a standard avatar
    if (currentAvatarUrl && !currentAvatarUrl.startsWith('/avatars/') && currentAvatarUrl !== avatarUrl) {
      try {
        // Extract path from the full URL
        const urlParts = currentAvatarUrl.split('/storage/v1/object/public/user-avatars/')
        if (urlParts.length > 1 && urlParts[1]) {
          const oldPath = urlParts[1]
          await deleteImage(supabase, oldPath, 'user-avatars')
        }
      } catch (err) {
        console.log('Could not delete old avatar:', err)
        // Continue with update even if deletion fails
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating avatar:', error)
      setError('Failed to update avatar')
      return false
    }

    onAvatarUpdate?.(avatarUrl)
    return true
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Please use an image under 5MB.')
      setIsUploading(false)
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please use a JPEG, PNG, or WebP image.')
      setIsUploading(false)
      return
    }

    try {
      const result = await uploadImage(file)
      if (result.success && result.fullUrl) {
        const success = await updateProfileAvatar(result.fullUrl)
        if (success) {
          setShowOptions(false)
        }
      } else {
        throw new Error(result.error || 'Upload failed - no URL returned')
      }
    } catch (err: any) {
      // Provide specific error messages
      if (err.message?.includes('row-level security') || err.message?.includes('RLS')) {
        setError('Avatar upload is being configured. Please run the SQL fix in Supabase.')
        console.error('RLS Policy Error - Run fix-avatar-bucket-complete.sql in Supabase')
      } else if (err.message?.includes('Bucket not found')) {
        setError('Avatar storage is being set up. Please run the SQL fix in Supabase.')
        console.error('Bucket Missing - Run fix-avatar-bucket-complete.sql in Supabase')
      } else if (err.message?.includes('storage')) {
        setError('Storage error. Please try again later.')
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your connection.')
      } else {
        setError('Failed to upload avatar. Please try again.')
      }
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleStandardAvatar = async (avatarUrl: string) => {
    setIsUploading(true)
    setError(null)

    const success = await updateProfileAvatar(avatarUrl)
    if (success) {
      setShowOptions(false)
    }
    
    setIsUploading(false)
  }

  const startCamera = async () => {
    setError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // Front camera for avatar
        audio: false
      })
      setStream(mediaStream)
      setShowCamera(true)
      setShowOptions(false)
      
      // Wait for video ref to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
    } catch (err) {
      console.error('Camera error:', err)
      setError('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          handleFileUpload(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
          stopCamera()
        }
      }, 'image/jpeg', 0.9)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Current Avatar Display */}
      <div
        onClick={() => setShowOptions(!showOptions)}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: currentAvatarUrl 
            ? 'none' 
            : 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.3s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <AvatarImage
          src={currentAvatarUrl}
          alt="Avatar"
          size={120}
        />
        
        {/* Overlay on hover */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '0'
          }}
        >
          <Camera style={{ width: '32px', height: '32px', color: 'white' }} />
        </div>
      </div>

      {/* Options Dropdown */}
      {showOptions && !isUploading && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowOptions(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />
          
          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              padding: '24px',
              width: '90%',
              maxWidth: '320px',
              zIndex: 1000,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Choose Avatar
              </h4>
              <button
                onClick={() => setShowOptions(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f3f4f6'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'none'
                }}
              >
                ×
              </button>
            </div>

          {/* Standard Avatars */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            {standardAvatars.map(avatar => (
              <button
                key={avatar.id}
                onClick={() => handleStandardAvatar(avatar.url)}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  padding: '4px',
                  background: 'transparent',
                  border: '2px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#10b981'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <AvatarImage
                  src={avatar.url}
                  alt={avatar.label}
                  size={40}
                />
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            {/* Upload from device */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#10b981'
                e.currentTarget.style.background = '#f0fdf4'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.background = 'white'
              }}
            >
              <Upload style={{ width: '16px', height: '16px' }} />
              Upload from device
            </button>

            {/* Take photo */}
            <button
              onClick={startCamera}
              style={{
                width: '100%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#10b981'
                e.currentTarget.style.background = '#f0fdf4'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.background = 'white'
              }}
            >
              <Camera style={{ width: '16px', height: '16px' }} />
              Take a photo
            </button>
          </div>
          </div>
        </>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Camera preview */}
      {showCamera && (
        <>
          {/* Backdrop */}
          <div
            onClick={stopCamera}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              zIndex: 999,
            }}
          />
          
          {/* Camera container */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            {/* Camera preview */}
            <div
              style={{
                width: '90vw',
                maxWidth: '350px',
                aspectRatio: '1',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid white',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transform: 'scaleX(-1)', // Mirror for selfie
                }}
              />
            </div>
            
            {/* Camera controls */}
            <div
              style={{
                display: 'flex',
                gap: '30px',
                alignItems: 'center',
              }}
            >
              <button
                onClick={stopCamera}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                  e.currentTarget.style.background = 'rgba(255, 100, 100, 0.9)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                }}
              >
                <X style={{ width: '28px', height: '28px', color: '#374151' }} />
              </button>
              
              <button
                onClick={capturePhoto}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                  border: '4px solid white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Camera style={{ width: '36px', height: '36px', color: 'white' }} />
              </button>
              
              <div style={{ width: '60px' }} /> {/* Spacer for symmetry */}
            </div>
          </div>
        </>
      )}

      {/* Loading state */}
      {isUploading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="loading-spinner" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '300px',
          }}
        >
          <X style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0 }} />
          <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>
            {error}
          </p>
        </div>
      )}
    </div>
  )
}