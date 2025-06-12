'use client'

import React, { useState, useCallback, useRef } from 'react'
import { 
  Upload, 
  Camera, 
  Smartphone, 
  Star, 
  AlertTriangle, 
  FileImage, 
  Zap,
  CheckCircle,
  X,
  Download,
  QrCode
} from 'lucide-react'
import { useDeviceDetection } from '@/lib/device-detection'
import { createMobileHandoff } from '@/lib/qr-handoff'
import { useDropzone } from 'react-dropzone'

interface DesktopExperienceProps {
  onFileSelect: (file: File) => void
  onAnalyzeRequest: (file: File) => void
  className?: string
  showMobilePromotion?: boolean
  maxFileSize?: number
  acceptedFileTypes?: string[]
}

interface QRCodeState {
  dataURL: string | null
  isGenerating: boolean
  error: string | null
}

export function DesktopExperience({
  onFileSelect,
  onAnalyzeRequest,
  className = '',
  showMobilePromotion = true,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp']
}: DesktopExperienceProps) {
  const { deviceInfo, features } = useDeviceDetection()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<QRCodeState>({
    dataURL: null,
    isGenerating: false,
    error: null
  })
  const [showQRModal, setShowQRModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      handleFileSelection(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedFileTypes.map(type => type.replace('image/', '.'))
    },
    maxSize: maxFileSize,
    multiple: false
  })

  const handleFileSelection = (file: File) => {
    setSelectedFile(file)
    onFileSelect(file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Track desktop file upload
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'desktop_file_upload', {
        file_size: file.size,
        file_type: file.type,
        device_type: 'desktop'
      })
    }
  }

  const generateQRCode = async () => {
    if (qrCode.isGenerating) return

    setQrCode(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const result = await createMobileHandoff(
        '/camera',
        {
          source: 'desktop_camera_prompt',
          intent: 'better_camera_quality',
          timestamp: Date.now()
        },
        {
          size: 'large',
          style: 'branded',
          includeText: true
        }
      )

      setQrCode({
        dataURL: result.qrCodeDataURL,
        isGenerating: false,
        error: null
      })
    } catch (error) {
      setQrCode({
        dataURL: null,
        isGenerating: false,
        error: 'Failed to generate QR code'
      })
    }
  }

  const handleAnalyze = () => {
    if (selectedFile) {
      onAnalyzeRequest(selectedFile)

      // Track desktop analysis
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'desktop_analysis_start', {
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          device_type: 'desktop'
        })
      }
    }
  }

  const resetFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mobile Promotion Banner */}
      {showMobilePromotion && features.showMobileBanner && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
          borderRadius: '12px',
          padding: '20px',
          border: '2px dashed #f59e0b',
          position: 'relative'
        }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div style={{
                  background: '#f59e0b',
                  borderRadius: '8px',
                  padding: '8px',
                  color: 'white'
                }}>
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-amber-900 font-semibold text-lg">
                    📸 Get Professional Food Analysis
                  </h3>
                  <p className="text-amber-800 text-sm">
                    Mobile cameras deliver 10x better food recognition accuracy
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-amber-800 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Professional camera sensors
                </div>
                <div className="flex items-center gap-2 text-amber-800 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  AI-optimized image processing
                </div>
                <div className="flex items-center gap-2 text-amber-800 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Real-time photo preview
                </div>
                <div className="flex items-center gap-2 text-amber-800 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Touch-optimized interface
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    generateQRCode()
                    setShowQRModal(true)
                  }}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#d97706'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f59e0b'
                    e.currentTarget.style.transform = 'translateY(0px)'
                  }}
                >
                  <QrCode className="w-4 h-4" />
                  Switch to Mobile Camera
                </button>

                <span className="text-amber-700 text-sm">
                  or continue with file upload below
                </span>
              </div>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '50%',
              padding: '16px'
            }}>
              <Smartphone className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>
      )}

      {/* Desktop File Upload Interface */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Desktop File Upload
          </h2>
          
          {!features.hasCamera && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Camera not detected
            </div>
          )}
        </div>

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          style={{
            background: isDragActive 
              ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: isDragActive 
              ? '2px dashed #10b981' 
              : selectedFile 
                ? '2px solid #10b981'
                : '2px dashed #d1d5db',
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          
          {selectedFile ? (
            <div className="space-y-4">
              {/* File Preview */}
              {previewUrl && (
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Food preview"
                    className="max-w-sm max-h-64 object-contain rounded-lg shadow-lg mx-auto"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      resetFile()
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* File Info */}
              <div className="text-center">
                <p className="text-green-700 font-medium">
                  {selectedFile.name}
                </p>
                <p className="text-gray-500 text-sm">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {/* Analyze Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAnalyze()
                }}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <Zap className="w-5 h-5" />
                Analyze Food
              </button>

              {/* Desktop Limitations Warning */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '16px'
              }}>
                <div className="flex items-center gap-2 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Limited desktop analysis:</span>
                </div>
                <p className="text-red-600 text-xs mt-1">
                  Desktop uploads may have reduced accuracy. For best results, use mobile camera.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                {isDragActive ? (
                  <Download className="w-8 h-8 text-green-500" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive 
                    ? 'Drop your food image here' 
                    : 'Upload a food image'}
                </p>
                <p className="text-gray-600 text-sm">
                  Drag and drop or click to select • JPEG, PNG, WebP up to 10MB
                </p>
              </div>

              <button
                type="button"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#2563eb',
                  border: '1px solid #2563eb',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Choose File
              </button>
            </div>
          )}
        </div>

        {/* File Rejections */}
        {fileRejections.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <h4 className="text-red-700 font-medium text-sm mb-2">File Upload Errors:</h4>
            {fileRejections.map(({ file, errors }) => (
              <div key={file.name} className="text-red-600 text-sm">
                <p className="font-medium">{file.name}</p>
                <ul className="list-disc list-inside ml-2">
                  {errors.map(error => (
                    <li key={error.code}>{error.message}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Alternative Camera Options */}
        {features.hasCamera && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div className="flex items-center gap-3 mb-3">
              <Camera className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Use Desktop Camera</h3>
            </div>
            <p className="text-blue-800 text-sm mb-3">
              Your camera is available but mobile cameras provide better food analysis.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Trigger camera capture logic
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'desktop_camera_attempt', {
                      device_type: 'desktop'
                    })
                  }
                }}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Use Desktop Camera
              </button>
              <span className="text-blue-700 text-sm">Limited quality</span>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              📱 Switch to Mobile Camera
            </h3>

            {qrCode.isGenerating ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
                <p className="text-gray-600">Generating QR code...</p>
              </div>
            ) : qrCode.dataURL ? (
              <div>
                <img
                  src={qrCode.dataURL}
                  alt="QR Code for mobile camera"
                  className="w-48 h-48 mx-auto mb-4"
                />
                <p className="text-gray-700 mb-2">
                  Scan with your phone's camera to continue with better quality
                </p>
                <p className="text-gray-500 text-sm">
                  You'll be automatically logged in and redirected to the camera
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-red-600 mb-4">{qrCode.error}</p>
                <button
                  onClick={generateQRCode}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}