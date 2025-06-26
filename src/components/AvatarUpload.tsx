'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, User } from 'lucide-react'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

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
  const [isUploading, setIsUploading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { uploadImage } = useImageUpload({
    bucketName: 'user-avatars',
    maxSizeMB: 5,
    quality: 0.9,
  })

  const updateProfileAvatar = async (avatarUrl: string) => {
    if (!user?.id) return

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

    try {
      const result = await uploadImage(file)
      if (result.url) {
        await updateProfileAvatar(result.url)
        setShowOptions(false)
      }
    } catch (err) {
      setError('Failed to upload image')
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

  const handleCameraCapture = () => {
    // For mobile devices, this will open camera
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'user'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileUpload(file)
      }
    }
    input.click()
  }

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
        {currentAvatarUrl ? (
          <Image
            src={currentAvatarUrl}
            alt="Avatar"
            width={120}
            height={120}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <User style={{ width: '48px', height: '48px', color: 'white' }} />
        )}
        
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
                <Image
                  src={avatar.url}
                  alt={avatar.label}
                  width={40}
                  height={40}
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
              onClick={handleCameraCapture}
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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-green-500" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px' }}>
          {error}
        </p>
      )}
    </div>
  )
}