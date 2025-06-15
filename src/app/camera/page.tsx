'use client'

import { Camera, Check, Loader2, RotateCcw, X, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { processImage, formatFileSize } from '@/lib/image-utils'
import { Navigation } from '@/components/Navigation'
// import { DesktopExperience } from '@/components/DesktopExperience'

type CameraState = 'idle' | 'active' | 'preview' | 'processing' | 'analyzing' | 'complete'

export default function CameraPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Core state
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [basicAnalysis, setBasicAnalysis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [processingProgress, setProcessingProgress] = useState<string>('')
  const [imageStats, setImageStats] = useState<{ original: number; compressed: number } | null>(null)
  
  // Daily meal count state
  const [dailyMealCount, setDailyMealCount] = useState<number>(0)
  const [isLoadingCount, setIsLoadingCount] = useState(true)

  const isPremium = profile?.subscription_tier === 'premium_monthly' || profile?.subscription_tier === 'premium_yearly'

  // Fetch daily meal count for free users
  useEffect(() => {
    const fetchDailyCount = async () => {
      if (!user?.id || isPremium) {
        setIsLoadingCount(false)
        return
      }

      try {
        const today = new Date().toISOString().split('T')[0]
        const { count, error } = await supabase
          .from('meals')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today)
          .lt('created_at', new Date(today + 'T23:59:59.999Z').toISOString())

        if (error) {
          console.error('Error fetching daily count:', error)
        } else {
          setDailyMealCount(count || 0)
        }
      } catch (error) {
        console.error('Error fetching daily count:', error)
      } finally {
        setIsLoadingCount(false)
      }
    }

    fetchDailyCount()
  }, [user?.id, isPremium])

  // Cleanup camera stream on unmount
  useEffect(
    () => () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    },
    [stream]
  )

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setCameraState('active')

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      setStream(mediaStream)

      // Set video source after a small delay
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
    } catch (err: any) {
      console.error('Camera error:', err)
      setError('Camera access denied. Please allow camera permissions and try again.')
      setCameraState('idle')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStream(null)
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please try again.')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      setError('Canvas not supported.')
      return
    }

    // Wait for video to be ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setError('Camera not ready. Please wait a moment and try again.')
      return
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720

      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to data URL with high quality
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95)

      if (imageDataUrl === 'data:,') {
        setError('Failed to capture image. Please try again.')
        return
      }

      setCapturedImage(imageDataUrl)
      setCameraState('preview')
      stopCamera()
      setError(null)
    } catch (err) {
      console.error('Capture error:', err)
      setError('Failed to capture photo. Please try again.')
    }
  }, [stopCamera])

  const processAndAnalyze = useCallback(async () => {
    if (!capturedImage) return

    setCameraState('processing')
    setProcessingProgress('Processing image...')

    try {
      // Calculate original size
      const originalBlob = await fetch(capturedImage).then(r => r.blob())
      const originalSize = originalBlob.size

      // Process the image
      setProcessingProgress('Compressing image...')
      const processed = await processImage(capturedImage)

      setImageStats({
        original: originalSize,
        compressed: processed.fileSize,
      })

      setProcessingProgress('Analyzing your meal...')
      setCameraState('analyzing')

      // Analyze the processed image
      await analyzeFood(processed.compressed)
    } catch (err) {
      console.error('Processing error:', err)
      setError('Failed to process image. Please try again.')
      setCameraState('preview')
    }
  }, [capturedImage])

  const analyzeFood = useCallback(
    async (imageDataUrl: string) => {
      if (!user) {
        setError('Please sign in to analyze food')
        setCameraState('preview')
        return
      }

      setError(null)

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const response = await fetch('/api/analyze-food', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && {
              Authorization: `Bearer ${session.access_token}`,
            }),
          },
          body: JSON.stringify({
            imageDataUrl,
            randomSeed: Math.floor(Math.random() * 1000000),
            focusMode: 'health_wellness',
            userTier: isPremium ? 'premium' : 'free',
          }),
        })

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`)
        }

        const result = await response.json()
        setBasicAnalysis(result)
        setCameraState('complete')
        
        // Update daily meal count for free users
        if (!isPremium) {
          setDailyMealCount(prev => prev + 1)
        }
      } catch (error) {
        console.error('Analysis error:', error)
        setError(
          error instanceof Error ? error.message : "Couldn't analyze your meal. Please try again!"
        )
        setCameraState('preview')
      }
    },
    [user, isPremium]
  )


  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    setBasicAnalysis(null)
    setError(null)
    setImageStats(null)
    setCameraState('idle')
  }, [])

  const navigateToMeals = useCallback(() => {
    router.push('/meals')
  }, [router])

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Navigation />
      
      {/* Mobile Recommendation for Desktop Users */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
        color: 'white',
        padding: '12px',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        📸 Capture your meal for instant nutrition insights
      </div>

      {/* Daily Meal Counter for Free Users */}
      {!isPremium && user && !isLoadingCount && (
        <div style={{ maxWidth: '448px', margin: '0 auto', padding: '16px 16px 0 16px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Daily Meals
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: dailyMealCount >= 3 ? '#dc2626' : '#059669'
              }}>
                {dailyMealCount}/3
              </span>
              {dailyMealCount >= 3 && (
                <span style={{
                  fontSize: '12px',
                  color: '#dc2626',
                  fontWeight: '500'
                }}>
                  Limit Reached
                </span>
              )}
            </div>
          </div>
          {dailyMealCount >= 3 && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'rgba(220, 38, 38, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(220, 38, 38, 0.2)'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#dc2626',
                margin: '0',
                textAlign: 'center'
              }}>
                Daily limit reached. <span style={{ fontWeight: '600' }}>Upgrade to Premium</span> for unlimited meals!
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: '448px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Welcome Message */}
          {cameraState === 'idle' && (
            <div
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                padding: '24px',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ marginBottom: '12px', fontSize: '48px' }}>📸</div>
              <h2 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: 'bold' }}>Ready for Food Magic?</h2>
              <p style={{ opacity: 0.9, margin: 0 }}>Capture your meal and discover its secrets!</p>
            </div>
          )}

          {/* Camera/Preview Container */}
          <div
            style={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              overflow: 'hidden',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Initial State - Start Camera */}
            {cameraState === 'idle' && (
              <div
                style={{
                  aspectRatio: '1',
                  background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  padding: '32px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                  }}
                >
                  <button
                    onClick={startCamera}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '48px',
                      borderRadius: '16px',
                      border: '2px dashed #d1d5db',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#10b981'
                      e.currentTarget.style.backgroundColor = '#f0fdf4'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div
                      style={{
                        borderRadius: '50%',
                        background: '#dcfce7',
                        padding: '16px',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Camera style={{ width: '32px', height: '32px', color: '#16a34a' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ marginBottom: '4px', fontWeight: '600', color: '#111827' }}>Start Camera</p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Let's discover your meal!</p>
                    </div>
                  </button>

                </div>
              </div>
            )}

            {/* Camera Active */}
            {cameraState === 'active' && (
              <div style={{ position: 'relative', aspectRatio: '1', backgroundColor: 'black' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Camera overlay */}
                <div style={{ position: 'absolute', inset: 0, padding: '16px' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '8px',
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '8px',
                        top: '8px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        padding: '4px 8px',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: '500', color: 'white' }}>📸 Perfect!</span>
                    </div>
                  </div>
                </div>

                {/* Capture button */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <button
                    onClick={capturePhoto}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '4px solid #10b981',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                    onMouseDown={e => {
                      e.currentTarget.style.transform = 'scale(0.95)'
                    }}
                    onMouseUp={e => {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                  >
                    <Camera style={{ width: '32px', height: '32px', color: '#16a34a' }} />
                  </button>
                </div>
              </div>
            )}

            {/* Photo Preview */}
            {cameraState === 'preview' && capturedImage && (
              <div style={{ position: 'relative', aspectRatio: '1' }}>
                <img
                  src={capturedImage}
                  alt="Captured meal"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                
                {/* Preview overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent, transparent)',
                  }}
                />
                
                {/* Action buttons */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={retakePhoto}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(12px)',
                        padding: '12px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <RotateCcw style={{ width: '20px', height: '20px' }} />
                      Retake
                    </button>
                    <button
                      onClick={processAndAnalyze}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '12px',
                        backgroundColor: '#16a34a',
                        border: 'none',
                        padding: '12px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#15803d'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = '#16a34a'
                      }}
                    >
                      <Check style={{ width: '20px', height: '20px' }} />
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Processing State */}
            {cameraState === 'processing' && (
              <div
                style={{
                  display: 'flex',
                  aspectRatio: '1',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #faf5ff, #fce7f3)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '16px', display: 'inline-flex' }}>
                    <Loader2 style={{ width: '48px', height: '48px', color: '#9333ea', animation: 'spin 1s linear infinite' }} />
                  </div>
                  <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>Processing...</h3>
                  <p style={{ color: '#9333ea', margin: 0 }}>{processingProgress}</p>
                  {imageStats && (
                    <div style={{ marginTop: '16px', fontSize: '14px' }}>
                      <p style={{ color: '#6b7280', margin: '4px 0' }}>
                        Original: {formatFileSize(imageStats.original)}
                      </p>
                      <p style={{ fontWeight: '500', color: '#16a34a', margin: '4px 0' }}>
                        Compressed: {formatFileSize(imageStats.compressed)} ✨
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analyzing State */}
            {cameraState === 'analyzing' && (
              <div
                style={{
                  display: 'flex',
                  aspectRatio: '1',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #faf5ff, #fce7f3)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      marginBottom: '16px',
                      display: 'inline-flex',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      border: '4px solid #9333ea',
                      borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>🪄 Analyzing...</h3>
                  <p style={{ color: '#9333ea', margin: 0 }}>Discovering your meal's insights...</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div
              style={{
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                border: '2px solid #fecaca',
                backgroundColor: '#fef2f2',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <X style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                <p style={{ fontWeight: '500', color: '#b91c1c', margin: 0 }}>{error}</p>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {cameraState === 'complete' && basicAnalysis && basicAnalysis.analysis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Success Message */}
              <div
                style={{
                  borderRadius: '16px',
                  background: 'linear-gradient(to right, #16a34a, #22c55e)',
                  padding: '16px',
                  textAlign: 'center',
                  color: 'white',
                  boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                }}
              >
                <div style={{ marginBottom: '8px', fontSize: '32px' }}>🎉</div>
                <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Analysis Complete!</p>
              </div>

              {/* Food Results */}
              <div
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  overflow: 'hidden',
                  boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {/* Food Name Header */}
                <div
                  style={{
                    background: 'linear-gradient(to right, #10b981, #ea580c)',
                    padding: '24px',
                    textAlign: 'center',
                    color: 'white',
                  }}
                >
                  <h2 style={{ marginBottom: '8px', fontSize: '24px', fontWeight: 'bold' }}>
                    {basicAnalysis.analysis?.foodName || 'Delicious Food'}
                  </h2>
                  {basicAnalysis.analysis?.confidence && (
                    <p style={{ fontSize: '18px', opacity: 0.9, margin: 0 }}>
                      Confidence: {Math.round(basicAnalysis.analysis.confidence * 100)}%
                    </p>
                  )}
                </div>

                {/* Nutrition Breakdown */}
                <div style={{ padding: '24px' }}>
                  <h3
                    style={{
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                    }}
                  >
                    <Zap style={{ width: '20px', height: '20px', color: '#eab308' }} />
                    Nutrition Breakdown
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '12px',
                        background: 'linear-gradient(to right, #dcfce7, #f0fdf4)',
                        padding: '12px',
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#374151' }}>Energy:</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#15803d' }}>
                        {basicAnalysis.analysis?.nutrition?.calories || 0} kcal
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '12px',
                        background: 'linear-gradient(to right, #dbeafe, #eff6ff)',
                        padding: '12px',
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#374151' }}>Protein:</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1d4ed8' }}>
                        {basicAnalysis.analysis?.nutrition?.protein || 0} g
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '12px',
                        background: 'linear-gradient(to right, #fef3c7, #fffbeb)',
                        padding: '12px',
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#374151' }}>Carbs:</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#d97706' }}>
                        {basicAnalysis.analysis?.nutrition?.carbs || 0} g
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '12px',
                        background: 'linear-gradient(to right, #ede9fe, #f5f3ff)',
                        padding: '12px',
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#374151' }}>Fat:</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>
                        {basicAnalysis.analysis?.nutrition?.fat || 0} g
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={retakePhoto}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '12px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    padding: '16px',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }}
                >
                  📸 Analyze Another
                </button>
                <button
                  onClick={navigateToMeals}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '12px',
                    backgroundColor: '#dcfce7',
                    border: 'none',
                    padding: '16px',
                    fontWeight: '600',
                    color: '#15803d',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#bbf7d0'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#dcfce7'
                  }}
                >
                  📊 View All Meals
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Animation Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `
      }} />
    </div>
  )
}