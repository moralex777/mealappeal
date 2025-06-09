'use client'

import { Camera, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function CameraPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Core state
  const [isActive, setIsActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [basicAnalysis, setBasicAnalysis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const isPremium = profile?.subscription_tier === 'premium'

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
      console.log('🎥 Starting camera...')

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      console.log('✅ Camera stream obtained')
      setStream(mediaStream)
      setIsActive(true)

      // Set video source after a small delay
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
    } catch (err: any) {
      console.error('❌ Camera error:', err)
      setError('Camera access denied. Please allow camera permissions and try again.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...')
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStream(null)
    setIsActive(false)
  }, [stream])

  const analyzeFood = useCallback(
    async (imageDataUrl: string, focusMode: string = 'health_wellness') => {
      if (!user) {
        setError('Please sign in to analyze food')
        return
      }

      setIsAnalyzing(true)
      setError(null)

      try {
        console.log('🔍 Starting food analysis with focus:', focusMode)

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
            focusMode,
            userTier: isPremium ? 'premium' : 'free',
          }),
        })

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Analysis complete:', result)
        setBasicAnalysis(result)
      } catch (error) {
        console.error('Analysis error:', error)
        setError(
          error instanceof Error ? error.message : "Couldn't analyze your meal. Please try again!"
        )
      } finally {
        setIsAnalyzing(false)
      }
    },
    [user, isPremium]
  )

  const capturePhoto = useCallback(() => {
    console.log('📸 Capturing photo...')

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
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480

      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)

      if (imageDataUrl === 'data:,') {
        setError('Failed to capture image. Please try again.')
        return
      }

      console.log('✅ Photo captured successfully')
      setCapturedImage(imageDataUrl)
      stopCamera()
      setBasicAnalysis(null)
      setError(null)

      // Start analysis automatically
      console.log('🚀 Starting instant basic analysis...')
      analyzeFood(imageDataUrl, 'health_wellness')
    } catch (err) {
      console.error('❌ Capture error:', err)
      setError('Failed to capture photo. Please try again.')
    }
  }, [stopCamera, analyzeFood])

  const resetCamera = useCallback(() => {
    console.log('🔄 Resetting camera...')
    setCapturedImage(null)
    setBasicAnalysis(null)
    setError(null)
    setIsAnalyzing(false)
    startCamera()
  }, [startCamera])

  const navigateToMeals = useCallback(() => {
    router.push('/meals')
  }, [router])

  return (
    <div style={{minHeight: "100vh", backgroundColor: "#f9fafb", fontFamily: "Inter, sans-serif"}}>
      <Navigation />

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "32px 16px"
      }}>
        <div style={{
          maxWidth: "448px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}>
          {/* Welcome Message */}
          {!capturedImage && !isActive && !isAnalyzing && (
            <div style={{
              borderRadius: "16px",
              background: "linear-gradient(to right, #10b981, #ea580c)",
              padding: "24px",
              textAlign: "center",
              color: "white",
              boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)"
            }}>
              <div style={{marginBottom: "12px", fontSize: "32px"}}>🎉</div>
              <h2 style={{marginBottom: "8px", fontSize: "20px", fontWeight: "bold", margin: 0}}>Ready for Food Magic?</h2>
              <p style={{opacity: 0.9, margin: "8px 0 0 0"}}>Capture your meal and discover its secrets!</p>
            </div>
          )}

          {/* Camera Interface */}
          <div style={{
            overflow: "hidden",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            backgroundColor: "white",
            boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)"
          }}>
            {/* 1. Initial State - Start Camera */}
            {!isActive && !capturedImage && !isAnalyzing && (
              <div style={{
                aspectRatio: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)"
              }}>
                <button
                  onClick={startCamera}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                    borderRadius: "16px",
                    border: "2px dashed #d1d5db",
                    padding: "48px",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontSize: "16px"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "#dcfce7"
                  }}>
                    <Camera style={{width: "32px", height: "32px", color: "#16a34a"}} />
                  </div>
                  <div style={{textAlign: "center"}}>
                    <p style={{marginBottom: "4px", fontWeight: "600", color: "#1f2937", margin: 0}}>Start Camera</p>
                    <p style={{fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0"}}>Let's discover your meal!</p>
                  </div>
                </button>
              </div>
            )}

            {/* 2. Camera Active - Video Stream */}
            {isActive && !capturedImage && (
              <div style={{position: "relative", aspectRatio: "1", backgroundColor: "black"}}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{width: "100%", height: "100%", objectFit: "cover"}}
                />

                <div style={{
                  position: "absolute",
                  inset: "16px",
                  border: "2px solid rgba(255, 255, 255, 0.5)",
                  borderRadius: "8px"
                }}>
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    padding: "4px 8px",
                    backdropFilter: "blur(4px)"
                  }}>
                    <span style={{fontSize: "12px", fontWeight: "500", color: "white"}}>📸 Perfect!</span>
                  </div>
                </div>

                <div style={{
                  position: "absolute",
                  bottom: "24px",
                  left: "50%",
                  transform: "translateX(-50%)"
                }}>
                  <button
                    onClick={capturePhoto}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      border: "4px solid #16a34a",
                      backgroundColor: "white",
                      cursor: "pointer",
                      boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
                      transition: "transform 0.2s"
                    }}
                  >
                    <Camera style={{width: "32px", height: "32px", color: "#16a34a"}} />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Analysis in Progress */}
            {isAnalyzing && (
              <div style={{
                display: "flex",
                aspectRatio: "1",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f3e8ff, #fce7f3)"
              }}>
                <div style={{textAlign: "center"}}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    margin: "0 auto 16px",
                    border: "4px solid #a855f7",
                    borderTop: "4px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                  <h3 style={{marginBottom: "8px", fontSize: "18px", fontWeight: "bold", color: "#7c3aed", margin: 0}}>🪄 Analyzing...</h3>
                  <p style={{color: "#a855f7", margin: "8px 0 0 0"}}>Discovering your meal's secrets...</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              borderRadius: "16px",
              border: "1px solid #fca5a5",
              backgroundColor: "#fef2f2",
              padding: "16px"
            }}>
              <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                <span style={{fontSize: "20px"}}>😔</span>
                <p style={{fontWeight: "500", color: "#dc2626", margin: 0}}>{error}</p>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {basicAnalysis && basicAnalysis.analysis && (
            <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
              {/* Success Message */}
              <div style={{
                borderRadius: "16px",
                background: "linear-gradient(to right, #10b981, #059669)",
                padding: "16px",
                textAlign: "center",
                color: "white",
                boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)"
              }}>
                <div style={{marginBottom: "8px", fontSize: "24px"}}>🎉</div>
                <p style={{fontSize: "18px", fontWeight: "bold", margin: 0}}>Analysis Complete!</p>
              </div>

              {/* Food Results */}
              <div style={{
                overflow: "hidden",
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                backgroundColor: "white",
                boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)"
              }}>
                {/* Food Name Header */}
                <div style={{
                  background: "linear-gradient(to right, #10b981, #ea580c)",
                  padding: "24px",
                  textAlign: "center",
                  color: "white"
                }}>
                  <h2 style={{
                    marginBottom: "8px",
                    fontSize: "24px",
                    fontWeight: "bold",
                    margin: 0
                  }}>
                    {basicAnalysis.analysis?.foodName || 'Delicious Food'}
                  </h2>
                  {basicAnalysis.analysis?.confidence && (
                    <p style={{fontSize: "18px", opacity: 0.9, margin: "8px 0 0 0"}}>
                      Confidence: {Math.round(basicAnalysis.analysis.confidence * 100)}%
                    </p>
                  )}
                </div>

                {/* Nutrition Breakdown */}
                <div style={{padding: "24px"}}>
                  <h3 style={{
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1f2937",
                    margin: 0
                  }}>
                    <Zap style={{width: "20px", height: "20px", color: "#eab308"}} />
                    Nutrition Breakdown
                  </h3>
                  <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: "12px",
                      background: "linear-gradient(to right, #dcfce7, #bbf7d0)",
                      padding: "12px 16px"
                    }}>
                      <span style={{fontWeight: "600", color: "#374151"}}>Energy:</span>
                      <span style={{fontSize: "18px", fontWeight: "bold", color: "#15803d"}}>
                        {basicAnalysis.analysis?.nutrition?.calories || 0} kcal
                      </span>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: "12px",
                      background: "linear-gradient(to right, #dbeafe, #bfdbfe)",
                      padding: "12px 16px"
                    }}>
                      <span style={{fontWeight: "600", color: "#374151"}}>Protein:</span>
                      <span style={{fontSize: "18px", fontWeight: "bold", color: "#1d4ed8"}}>
                        {basicAnalysis.analysis?.nutrition?.protein || 0} g
                      </span>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: "12px",
                      background: "linear-gradient(to right, #fef3c7, #fde68a)",
                      padding: "12px 16px"
                    }}>
                      <span style={{fontWeight: "600", color: "#374151"}}>Carbs:</span>
                      <span style={{fontSize: "18px", fontWeight: "bold", color: "#d97706"}}>
                        {basicAnalysis.analysis?.nutrition?.carbs || 0} g
                      </span>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: "12px",
                      background: "linear-gradient(to right, #f3e8ff, #e9d5ff)",
                      padding: "12px 16px"
                    }}>
                      <span style={{fontWeight: "600", color: "#374151"}}>Fat:</span>
                      <span style={{fontSize: "18px", fontWeight: "bold", color: "#7c3aed"}}>
                        {basicAnalysis.analysis?.nutrition?.fat || 0} g
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{display: "flex", gap: "12px"}}>
                <button
                  onClick={resetCamera}
                  style={{
                    flex: 1,
                    borderRadius: "12px",
                    backgroundColor: "#f3f4f6",
                    padding: "16px",
                    fontWeight: "600",
                    color: "#374151",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  📸 Analyze Another
                </button>
                <button
                  onClick={navigateToMeals}
                  style={{
                    flex: 1,
                    borderRadius: "12px",
                    backgroundColor: "#dcfce7",
                    padding: "16px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#15803d",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  📊 View All Meals
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{display: "none"}} />
        </div>
      </div>

      {/* Spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
