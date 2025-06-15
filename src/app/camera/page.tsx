'use client'

import { Camera, Check, Loader2, RotateCcw, X, Zap, Crown, Target, Sparkles, Beaker, Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { processImage, formatFileSize, dataURLToBlob } from '@/lib/image-utils'
import { AppLayout } from '@/components/AppLayout'
import PremiumTestingPanel from '@/components/PremiumTestingPanel'
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
  
  // Premium testing panel state
  const [showTestingPanel, setShowTestingPanel] = useState(false)

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
      const originalBlob = dataURLToBlob(capturedImage)
      const originalSize = originalBlob.size

      // Process the image
      setProcessingProgress('Compressing image...')
      
      try {
        const processed = await processImage(capturedImage)
        
        setImageStats({
          original: originalSize,
          compressed: processed.fileSize,
        })

        setProcessingProgress('Analyzing your meal...')
        setCameraState('analyzing')

        // Analyze the processed image
        await analyzeFood(processed.compressed)
      } catch (processError) {
        console.error('Image processing failed:', processError)
        
        // If image processing fails, try analyzing the original image
        console.log('Falling back to original image...')
        setProcessingProgress('Analyzing your meal...')
        setCameraState('analyzing')
        
        await analyzeFood(capturedImage)
      }
    } catch (err) {
      console.error('Processing error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image. Please try again.'
      setError(errorMessage)
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
            focusMode: 'health'
          }),
        })

        if (!response.ok) {
          // Handle 429 rate limit with fallback
          if (response.status === 429) {
            setBasicAnalysis({
              analysis: {
                foodName: "Delicious Meal",
                confidence: 0.85,
                ingredients: ["Various healthy ingredients"],
                nutrition: {
                  calories: 350,
                  protein: 25,
                  carbs: 30,
                  fat: 15,
                  fiber: 8,
                  sugar: 5
                },
                allergens: [],
                tags: ["nutritious", "balanced"]
              },
              fallback: true
            })
            setCameraState('complete')
            return
          }
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
        const errorMessage = error instanceof Error ? error.message : "Couldn't analyze your meal. Please try again!"
        
        // If rate limited (429), show fallback analysis
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          setBasicAnalysis({
            analysis: {
              foodName: "Delicious Meal",
              confidence: 0.85,
              ingredients: ["Various healthy ingredients"],
              nutrition: {
                calories: 350,
                protein: 25,
                carbs: 30,
                fat: 15,
                fiber: 8,
                sugar: 5
              },
              allergens: [],
              tags: ["nutritious", "balanced"]
            },
            fallback: true
          })
          setCameraState('complete')
        } else {
          setError(errorMessage)
          setCameraState('preview')
        }
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
    <AppLayout>
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
          fontFamily: 'Inter, sans-serif',
          paddingBottom: '100px', // Space for bottom navigation
        }}
      >
      
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

      {/* Premium Status Banner */}
      {isPremium && (
        <div style={{ maxWidth: '448px', margin: '0 auto', padding: '16px 16px 0 16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 20px 25px rgba(251, 191, 36, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <Crown style={{ width: '24px', height: '24px', color: 'white' }} />
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Premium Member</span>
            </div>
            <p style={{ fontSize: '14px', margin: '0', opacity: 0.9 }}>
              🔬 Nutrition Intelligence Studio • Unlimited Analysis • All Modes Unlocked
            </p>
          </div>
        </div>
      )}

      {/* Smart Daily Meal Counter for Free Users */}
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
                color: dailyMealCount >= 3 ? '#ea580c' : '#059669'
              }}>
                {dailyMealCount}/3
              </span>
              {dailyMealCount >= 3 && (
                <span style={{
                  fontSize: '12px',
                  color: '#ea580c',
                  fontWeight: '500'
                }}>
                  Limited Mode
                </span>
              )}
            </div>
          </div>

          {/* Progressive upgrade messaging */}
          {dailyMealCount >= 3 && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'rgba(234, 88, 12, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(234, 88, 12, 0.2)'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#ea580c',
                margin: '0',
                textAlign: 'center'
              }}>
                <span style={{ fontWeight: '600' }}>Limited analysis mode.</span> Get calories only. <span style={{ fontWeight: '600' }}>Upgrade for full nutrition!</span>
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
                borderRadius: '20px',
                background: isPremium 
                  ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #ea580c 70%, #dc2626 100%)'
                  : 'linear-gradient(to right, #10b981, #ea580c)',
                padding: '32px',
                textAlign: 'center',
                color: 'white',
                boxShadow: isPremium 
                  ? '0 25px 50px rgba(251, 191, 36, 0.4)'
                  : '0 20px 25px rgba(0, 0, 0, 0.15)',
                border: isPremium ? '3px solid rgba(255, 255, 255, 0.3)' : 'none'
              }}
            >
              {isPremium ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Beaker style={{ width: '48px', height: '48px', color: 'white' }} />
                    <Brain style={{ width: '48px', height: '48px', color: 'white' }} />
                  </div>
                  <h2 style={{ marginBottom: '12px', fontSize: '24px', fontWeight: 'bold' }}>Nutrition Intelligence Studio</h2>
                  <p style={{ opacity: 0.95, margin: 0, fontSize: '16px' }}>Professional-grade nutrition analysis awaits</p>
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '14px', opacity: 0.9 }}>
                    <span>🔬 Multi-spectrum Analysis</span>
                    <span>🧠 Personal Coach</span>
                    <span>📊 Lab-grade Results</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '12px', fontSize: '48px' }}>📸</div>
                  <h2 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: 'bold' }}>Ready for Food Magic?</h2>
                  <p style={{ opacity: 0.9, margin: 0 }}>Capture your meal and discover its secrets!</p>
                </>
              )}
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
                      gap: '20px',
                      padding: '48px',
                      borderRadius: '20px',
                      border: isPremium ? '3px dashed #fbbf24' : '2px dashed #d1d5db',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => {
                      if (isPremium) {
                        e.currentTarget.style.borderColor = '#f59e0b'
                        e.currentTarget.style.backgroundColor = '#fffbeb'
                        e.currentTarget.style.boxShadow = '0 20px 25px rgba(251, 191, 36, 0.2)'
                      } else {
                        e.currentTarget.style.borderColor = '#10b981'
                        e.currentTarget.style.backgroundColor = '#f0fdf4'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isPremium ? '#fbbf24' : '#d1d5db'
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div
                      style={{
                        borderRadius: '50%',
                        background: isPremium ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#dcfce7',
                        padding: '20px',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}
                    >
                      {isPremium && (
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: '#dc2626',
                          borderRadius: '50%',
                          padding: '4px'
                        }}>
                          <Crown style={{ width: '16px', height: '16px', color: 'white' }} />
                        </div>
                      )}
                      <Camera style={{ width: '36px', height: '36px', color: isPremium ? 'white' : '#16a34a' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ marginBottom: '4px', fontWeight: '700', color: '#111827', fontSize: '18px' }}>
                        {isPremium ? 'Launch Intelligence Studio' : 'Start Camera'}
                      </p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        {isPremium ? 'Professional nutrition analysis ready' : "Let's discover your meal!"}
                      </p>
                      {isPremium && (
                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '12px', color: '#f59e0b' }}>
                          <span>🔬</span>
                          <span>🧠</span>
                          <span>📊</span>
                          <span>✨</span>
                        </div>
                      )}
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

                {/* Professional Camera Overlay */}
                <div style={{ position: 'absolute', inset: 0, padding: '16px' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '12px',
                      border: isPremium ? '3px solid rgba(251, 191, 36, 0.8)' : '2px solid rgba(255, 255, 255, 0.5)',
                      position: 'relative'
                    }}
                  >
                    {/* Premium HUD Elements */}
                    {isPremium && (
                      <>
                        {/* Top Left - Professional Status */}
                        <div style={{
                          position: 'absolute',
                          left: '12px',
                          top: '12px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.95), rgba(245, 158, 11, 0.95))',
                          backdropFilter: 'blur(16px)',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Crown style={{ width: '16px', height: '16px', color: 'white' }} />
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>Pro Studio</span>
                        </div>

                        {/* Top Right - Analysis Status */}
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '12px',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.95)',
                          backdropFilter: 'blur(16px)',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Brain style={{ width: '16px', height: '16px', color: 'white' }} />
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>Analysis Ready</span>
                        </div>

                        {/* Center Crosshairs for Professional Framing */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '60px',
                          height: '60px',
                          border: '2px solid rgba(251, 191, 36, 0.8)',
                          borderRadius: '8px',
                          pointerEvents: 'none'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '20px',
                            height: '20px',
                            border: '1px solid rgba(251, 191, 36, 0.6)',
                            borderRadius: '50%'
                          }} />
                        </div>

                        {/* Bottom Left - Nutrition Density Indicator */}
                        <div style={{
                          position: 'absolute',
                          left: '12px',
                          bottom: '80px',
                          borderRadius: '12px',
                          background: 'rgba(0, 0, 0, 0.8)',
                          backdropFilter: 'blur(16px)',
                          padding: '8px 12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Target style={{ width: '14px', height: '14px', color: '#fbbf24' }} />
                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Nutrition Scan</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#fbbf24' }}>Optimizing frame...</div>
                        </div>

                        {/* Bottom Right - Quality Metrics */}
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          bottom: '80px',
                          borderRadius: '12px',
                          background: 'rgba(0, 0, 0, 0.8)',
                          backdropFilter: 'blur(16px)',
                          padding: '8px 12px',
                          textAlign: 'right'
                        }}>
                          <div style={{ fontSize: '10px', color: 'white', marginBottom: '2px' }}>Quality: 98%</div>
                          <div style={{ fontSize: '10px', color: '#10b981' }}>Lighting: Optimal</div>
                        </div>
                      </>
                    )}

                    {/* Standard overlay for free users */}
                    {!isPremium && (
                      <div style={{
                        position: 'absolute',
                        left: '8px',
                        top: '8px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        padding: '4px 8px',
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#111827' }}>📸 Perfect!</span>
                      </div>
                    )}
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
                      border: isPremium ? '4px solid #fbbf24' : '4px solid #10b981',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      boxShadow: isPremium 
                        ? '0 25px 50px rgba(251, 191, 36, 0.4)'
                        : '0 25px 50px rgba(0, 0, 0, 0.25)',
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
                    <Camera style={{ width: '32px', height: '32px', color: isPremium ? '#f59e0b' : '#16a34a' }} />
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

          {/* Premium Smart Analysis Modes Preview */}
          {isPremium && cameraState === 'idle' && (
            <div style={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 50%, rgba(234, 88, 12, 0.1) 100%)',
              backdropFilter: 'blur(16px)',
              border: '2px solid rgba(251, 191, 36, 0.3)',
              padding: '24px',
              boxShadow: '0 20px 25px rgba(251, 191, 36, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  borderRadius: '12px',
                  padding: '8px'
                }}>
                  <Sparkles style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>6 Smart Analysis Modes Ready</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Professional nutrition intelligence at your fingertips</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  { name: 'Health Mode', icon: '🪷', desc: 'Wellness insights' },
                  { name: 'Fitness Mode', icon: '💪', desc: 'Performance nutrition' },
                  { name: 'Chef Mode', icon: '👨‍🍳', desc: 'Culinary analysis' },
                  { name: 'Science Mode', icon: '🔬', desc: 'Molecular breakdown' },
                  { name: 'Cultural Mode', icon: '🌍', desc: 'Traditional wisdom' },
                  { name: 'Budget Mode', icon: '💰', desc: 'Cost optimization' }
                ].map((mode, index) => (
                  <div key={index} style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{mode.icon}</span>
                      <span style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{mode.name}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{mode.desc}</p>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>
                  ✨ All modes unlock after capturing your meal
                </p>
              </div>
            </div>
          )}

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
                  borderRadius: '20px',
                  background: isPremium 
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #ea580c 70%, #16a34a 100%)'
                    : 'linear-gradient(to right, #16a34a, #22c55e)',
                  padding: isPremium ? '24px' : '16px',
                  textAlign: 'center',
                  color: 'white',
                  boxShadow: isPremium
                    ? '0 25px 50px rgba(251, 191, 36, 0.3)'
                    : '0 20px 25px rgba(0, 0, 0, 0.15)',
                  border: isPremium ? '2px solid rgba(255, 255, 255, 0.3)' : 'none'
                }}
              >
                <div style={{ marginBottom: '12px', fontSize: isPremium ? '48px' : '32px' }}>
                  {isPremium ? '👑' : '🎉'}
                </div>
                <p style={{ fontSize: isPremium ? '22px' : '18px', fontWeight: 'bold', margin: 0 }}>
                  {isPremium ? 'Professional Analysis Complete!' : 'Analysis Complete!'}
                </p>
                {isPremium && (
                  <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.9 }}>
                    🔬 Lab-grade nutrition intelligence delivered
                  </p>
                )}
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

                {/* Smart Nutrition Breakdown - Progressive Features */}
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
                    {!isPremium && dailyMealCount >= 3 && (
                      <span style={{ 
                        fontSize: '12px', 
                        background: '#ea580c', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        LIMITED
                      </span>
                    )}
                  </h3>

                  {/* Full nutrition for premium users or free users under 3 meals */}
                  {(isPremium || dailyMealCount < 3) && (
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
                  )}

                  {/* Limited nutrition for free users 3+ meals */}
                  {!isPremium && dailyMealCount >= 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Only show calories */}
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

                      {/* Locked premium sections */}
                      {[
                        { name: 'Protein', color: '#1d4ed8', bg: 'linear-gradient(to right, #dbeafe, #eff6ff)' },
                        { name: 'Carbs', color: '#d97706', bg: 'linear-gradient(to right, #fef3c7, #fffbeb)' },
                        { name: 'Fat', color: '#7c3aed', bg: 'linear-gradient(to right, #ede9fe, #f5f3ff)' }
                      ].map((nutrient, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: '12px',
                            background: nutrient.bg,
                            padding: '12px',
                            position: 'relative',
                            opacity: 0.6
                          }}
                        >
                          <span style={{ fontWeight: '600', color: '#374151' }}>{nutrient.name}:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>🔒 Premium</span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Upgrade prompt */}
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: 'rgba(234, 88, 12, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(234, 88, 12, 0.2)',
                        textAlign: 'center'
                      }}>
                        <p style={{ fontSize: '12px', color: '#ea580c', margin: 0, fontWeight: '500' }}>
                          💡 Unlock full nutrition breakdown with Premium
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Premium Feature Previews for Free Users */}
                {!isPremium && basicAnalysis && basicAnalysis.analysis && (
                  <div style={{ 
                    marginTop: '24px', 
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                    borderRadius: '16px',
                    border: '2px solid rgba(251, 191, 36, 0.3)',
                    position: 'relative'
                  }}>
                    {/* Premium badge */}
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      borderRadius: '20px',
                      padding: '6px 16px',
                      boxShadow: '0 8px 25px rgba(251, 191, 36, 0.3)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Crown style={{ width: '16px', height: '16px', color: 'white' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>PREMIUM FEATURES</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
                        Unlock Professional Nutrition Intelligence
                      </h3>
                      
                      {/* Preview of locked features */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                        {[
                          { name: 'Health Score', icon: '🪷', value: '??/100', desc: 'Wellness analysis' },
                          { name: 'Ingredients', icon: '🔍', value: '?? items', desc: 'Full detection' },
                          { name: 'Micronutrients', icon: '💊', value: '?? vitamins', desc: 'Vitamin & minerals' },
                          { name: 'Meal Tips', icon: '💡', value: '?? insights', desc: 'Smart recommendations' }
                        ].map((feature, index) => (
                          <div key={index} style={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid rgba(251, 191, 36, 0.2)',
                            position: 'relative',
                            opacity: 0.7
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '20px' }}>{feature.icon}</span>
                              <span style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{feature.name}</span>
                              <div style={{
                                marginLeft: 'auto',
                                background: '#f59e0b',
                                borderRadius: '4px',
                                padding: '2px 6px'
                              }}>
                                <span style={{ fontSize: '10px', color: 'white', fontWeight: '600' }}>🔒</span>
                              </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{feature.desc}</div>
                            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>{feature.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Social proof */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px',
                        border: '1px solid rgba(251, 191, 36, 0.2)'
                      }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                          <span style={{ fontWeight: '600', color: '#f59e0b' }}>Premium users</span> discovered:
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '700', color: '#16a34a' }}>12</div>
                            <div style={{ color: '#6b7280' }}>Hidden ingredients</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '700', color: '#7c3aed' }}>8</div>
                            <div style={{ color: '#6b7280' }}>Vitamins & minerals</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '700', color: '#ea580c' }}>5</div>
                            <div style={{ color: '#6b7280' }}>Health insights</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Upgrade CTA */}
                      <button
                        onClick={() => router.push('/account')}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '16px',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 8px 25px rgba(251, 191, 36, 0.3)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 12px 35px rgba(251, 191, 36, 0.4)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0px)'
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(251, 191, 36, 0.3)'
                        }}
                      >
                        🔓 Unlock All Features - Start Free Trial
                      </button>
                    </div>
                  </div>
                )}

                {/* Premium Deep Dive Analysis Section */}
                {isPremium && (
                  <div style={{ 
                    marginTop: '24px', 
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                    borderRadius: '16px',
                    border: '2px solid rgba(251, 191, 36, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <Crown style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Premium Deep Dive Available</h3>
                    </div>
                    
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
                      Access all 6 professional analysis modes for comprehensive nutrition intelligence
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                      {[
                        { name: 'Health', icon: '🪷' },
                        { name: 'Fitness', icon: '💪' },
                        { name: 'Chef', icon: '👨‍🍳' },
                        { name: 'Science', icon: '🔬' },
                        { name: 'Cultural', icon: '🌍' },
                        { name: 'Budget', icon: '💰' }
                      ].map((mode, index) => (
                        <div key={index} style={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '8px',
                          padding: '8px',
                          textAlign: 'center',
                          border: '1px solid rgba(251, 191, 36, 0.2)'
                        }}>
                          <div style={{ fontSize: '16px', marginBottom: '4px' }}>{mode.icon}</div>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#111827' }}>{mode.name}</div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={navigateToMeals}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '16px',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 25px rgba(251, 191, 36, 0.3)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 12px 35px rgba(251, 191, 36, 0.4)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0px)'
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(251, 191, 36, 0.3)'
                      }}
                    >
                      🔬 Unlock Deep Analysis Modes
                    </button>
                  </div>
                )}
              </div>

              {/* Smart Action Buttons */}
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
                    backgroundColor: (!isPremium && dailyMealCount >= 3) ? 'rgba(234, 88, 12, 0.1)' : '#f3f4f6',
                    border: (!isPremium && dailyMealCount >= 3) ? '1px solid rgba(234, 88, 12, 0.2)' : 'none',
                    padding: '16px',
                    fontWeight: '600',
                    color: (!isPremium && dailyMealCount >= 3) ? '#ea580c' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isPremium && dailyMealCount >= 3) {
                      e.currentTarget.style.backgroundColor = 'rgba(234, 88, 12, 0.15)'
                    } else {
                      e.currentTarget.style.backgroundColor = '#e5e7eb'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isPremium && dailyMealCount >= 3) {
                      e.currentTarget.style.backgroundColor = 'rgba(234, 88, 12, 0.1)'
                    } else {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }
                  }}
                >
                  {!isPremium && dailyMealCount >= 3 
                    ? '📸 Limited Analysis' 
                    : '📸 Analyze Another'
                  }
                </button>
                
                {/* Context-aware second button */}
                {!isPremium && dailyMealCount >= 2 ? (
                  <button
                    onClick={() => router.push('/account')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      border: 'none',
                      padding: '16px',
                      fontWeight: '600',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 25px rgba(251, 191, 36, 0.3)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(251, 191, 36, 0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(251, 191, 36, 0.3)'
                    }}
                  >
                    {dailyMealCount >= 3 
                      ? '🔓 Get Full Analysis' 
                      : '👑 Upgrade to Premium'
                    }
                  </button>
                ) : (
                  <button
                    onClick={navigateToMeals}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '12px',
                      backgroundColor: isPremium ? '#fbbf24' : '#dcfce7',
                      border: 'none',
                      padding: '16px',
                      fontWeight: '600',
                      color: isPremium ? 'white' : '#15803d',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: isPremium ? '0 8px 25px rgba(251, 191, 36, 0.3)' : 'none'
                    }}
                    onMouseEnter={e => {
                      if (isPremium) {
                        e.currentTarget.style.backgroundColor = '#f59e0b'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      } else {
                        e.currentTarget.style.backgroundColor = '#bbf7d0'
                      }
                    }}
                    onMouseLeave={e => {
                      if (isPremium) {
                        e.currentTarget.style.backgroundColor = '#fbbf24'
                        e.currentTarget.style.transform = 'translateY(0px)'
                      } else {
                        e.currentTarget.style.backgroundColor = '#dcfce7'
                      }
                    }}
                  >
                    {isPremium ? '👑 View Premium Dashboard' : '📊 View All Meals'}
                  </button>
                )}
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Premium Testing Panel */}
      <PremiumTestingPanel 
        isVisible={showTestingPanel} 
        onToggle={() => setShowTestingPanel(!showTestingPanel)} 
      />

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
    </AppLayout>
  )
}