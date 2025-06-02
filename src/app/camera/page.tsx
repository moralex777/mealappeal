'use client'

import { ArrowLeft, Camera, Crown, RotateCcw, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import FocusSelection from '@/components/FocusSelection'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabase } from '@/lib/supabase'

export default function CameraPage() {
  const { user, profile } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [basicAnalysis, setBasicAnalysis] = useState<any>(null)
  const [detailedAnalysis, setDetailedAnalysis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null)
  const [showFocusSelection, setShowFocusSelection] = useState(false)
  const [recentSelections, setRecentSelections] = useState<string[]>([])
  const [upgradePrompt, setUpgradePrompt] = useState<{ mode: string; description: string } | null>(
    null
  )

  const isPremium = profile?.subscription_tier === 'premium'

  // Load recent selections from localStorage and handle cleanup
  useEffect(() => {
    const saved = localStorage.getItem('mealappeal_recent_focus')
    if (saved) {
      try {
        setRecentSelections(JSON.parse(saved))
      } catch {
        console.log('Could not parse recent selections')
      }
    }

    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const showUpgradePrompt = (mode: string, description: string) => {
    setUpgradePrompt({ mode, description })
  }

  const startCamera = async () => {
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

      console.log('✅ Camera stream obtained:', mediaStream)

      setStream(mediaStream)
      setIsActive(true)

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          console.log('✅ Video element updated with stream')
        }
      }, 100)
    } catch (err: any) {
      console.error('❌ Camera error:', err)
      setError(`Camera error: ${err.message}`)
    }
  }

  const stopCamera = () => {
    console.log('🛑 Stopping camera...')
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
        console.log('🛑 Stopped track:', track.kind)
      })
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStream(null)
    setIsActive(false)
  }

  const capturePhoto = () => {
    console.log('📸 Capturing photo...')
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')

      if (context && video.videoWidth > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        console.log('✅ Photo captured, data length:', imageDataUrl.length)
        setCapturedImage(imageDataUrl)
        stopCamera()
        setBasicAnalysis(null)
        setDetailedAnalysis(null)
        setError(null)

        // Start basic nutrition analysis immediately
        analyzeBasicNutrition(imageDataUrl)
      } else {
        setError('Video not ready for capture. Please wait for camera to fully load.')
      }
    }
  }

  const analyzeBasicNutrition = async (imageDataUrl: string) => {
    if (!user) {
      setError('Please sign in to analyze food')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('🔍 Getting basic nutrition analysis...')

      const supabase = await getSupabase()
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
          focusMode: 'basic_nutrition',
          userTier: isPremium ? 'premium' : 'free',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Analysis failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Basic nutrition result:', result)

      setBasicAnalysis(result)

      // Show focus selection for premium users
      if (isPremium) {
        setShowFocusSelection(true)
      }
    } catch (error) {
      console.error('Basic analysis error:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFocusSelect = async (focusId: string) => {
    if (!isPremium) {
      return
    }

    setSelectedFocus(focusId)
    setShowFocusSelection(false)

    // Save to recent selections
    const newRecent = [focusId, ...recentSelections.filter(f => f !== focusId)].slice(0, 3)
    setRecentSelections(newRecent)
    localStorage.setItem('mealappeal_recent_focus', JSON.stringify(newRecent))

    // Get detailed analysis
    await getDetailedAnalysis(focusId)
  }

  const getDetailedAnalysis = async (focusId: string) => {
    if (!capturedImage) {
      return
    }

    setIsAnalyzing(true)

    try {
      console.log('🔍 Getting detailed analysis with focus:', focusId)

      const supabase = await getSupabase()
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
          imageDataUrl: capturedImage,
          randomSeed: Math.floor(Math.random() * 1000000),
          focusMode: focusId,
          userTier: 'premium',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Detailed analysis failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Detailed analysis result:', result)

      setDetailedAnalysis(result)
    } catch (error) {
      console.error('Detailed analysis error:', error)
      setError(error instanceof Error ? error.message : 'Detailed analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetCamera = () => {
    setCapturedImage(null)
    setBasicAnalysis(null)
    setDetailedAnalysis(null)
    setError(null)
    setSelectedFocus(null)
    setShowFocusSelection(false)
    startCamera()
  }

  return (
    <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/80 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <h1 className="gradient-text text-xl font-bold">Food Analysis</h1>
            </div>
            <div className="text-muted-foreground text-sm">
              {user ? (
                <div className="flex items-center gap-2">
                  <span>{user.email}</span>
                  {isPremium && (
                    <span className="flex items-center gap-1 font-medium text-yellow-600">
                      <Crown className="h-4 w-4" />
                      Premium
                    </span>
                  )}
                </div>
              ) : (
                'Please sign in to continue'
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="mx-auto max-w-md space-y-6">
          {/* Welcome Message */}
          {!capturedImage && !isActive && (
            <div className="from-brand-500 rounded-2xl bg-gradient-to-r to-orange-500 p-6 text-center text-white shadow-lg">
              <div className="mb-3 text-4xl">🎉</div>
              <h2 className="mb-2 text-xl font-bold">Ready for Food Magic?</h2>
              <p className="opacity-90">Capture your meal and get instant nutrition analysis!</p>
            </div>
          )}

          {/* Camera Interface */}
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-lg backdrop-blur-sm">
            {!isActive && !capturedImage && (
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <button
                  onClick={startCamera}
                  className="hover:border-brand-500 hover:bg-brand-50 flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-300 p-12 transition-all duration-200 hover:scale-105"
                  aria-label="Start camera"
                >
                  <div className="bg-brand-100 flex h-16 w-16 animate-pulse items-center justify-center rounded-full">
                    <Camera className="text-brand-600 h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <p className="mb-1 font-semibold text-gray-800">Start Camera</p>
                    <p className="text-sm text-gray-600">Let&apos;s analyze your delicious meal!</p>
                  </div>
                </button>
              </div>
            )}

            {isActive && (
              <div className="relative aspect-square bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 m-4 rounded-lg border-2 border-white/50">
                  <div className="absolute top-2 left-2 rounded-lg bg-white/20 px-2 py-1 backdrop-blur-sm">
                    <span className="text-xs font-medium text-white">📸 Perfect shot!</span>
                  </div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 transform">
                  <button
                    onClick={capturePhoto}
                    className="border-brand-500 flex h-20 w-20 animate-pulse items-center justify-center rounded-full border-4 bg-white shadow-xl transition-transform duration-200 hover:scale-110"
                    aria-label="Take photo"
                  >
                    <Camera className="text-brand-600 h-8 w-8" />
                  </button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="relative aspect-square">
                <img
                  src={capturedImage}
                  alt="Captured food"
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={resetCamera}
                  className="absolute top-4 right-4 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:scale-110 hover:bg-white"
                  aria-label="Retake photo"
                >
                  <RotateCcw className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Analysis Loading State */}
          {isAnalyzing && (
            <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-center text-white shadow-lg">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-3 border-white/30 border-t-white"></div>
              <h3 className="mb-2 text-xl font-bold">🤖 AI Magic in Progress...</h3>
              <p className="opacity-90">Analyzing your delicious meal</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xl text-red-500">😔</span>
                <p className="font-medium text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: BASIC NUTRITION RESULTS - ALWAYS SHOWN FIRST */}
          {basicAnalysis && (
            <div className="animate-slide-up space-y-6">
              {/* Success Message */}
              <div className="rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 p-4 text-center text-white shadow-lg">
                <div className="mb-2 text-2xl">🎉</div>
                <p className="text-lg font-bold">Analysis Complete!</p>
              </div>

              {/* BASIC NUTRITION - ALWAYS VISIBLE */}
              <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm">
                {/* Food Name & Confidence */}
                <div className="from-brand-500 bg-gradient-to-r to-orange-500 p-6 text-center text-white">
                  <h2 className="mb-2 text-2xl font-bold">
                    {basicAnalysis.analysis?.foodName || 'Delicious Food'}
                  </h2>
                  {basicAnalysis.analysis?.confidence && (
                    <p className="text-lg opacity-90">
                      Confidence: {Math.round(basicAnalysis.analysis.confidence * 100)}%
                    </p>
                  )}
                </div>

                {/* NUTRITION BREAKDOWN - PROPERLY FORMATTED */}
                {basicAnalysis.analysis?.nutrition && (
                  <div className="p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Nutrition Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-green-50 to-green-100 px-4 py-3">
                        <span className="font-semibold text-gray-700">Energy:</span>
                        <span className="text-lg font-bold text-green-700">
                          {basicAnalysis.analysis.nutrition.calories} kcal
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3">
                        <span className="font-semibold text-gray-700">Protein:</span>
                        <span className="text-lg font-bold text-blue-700">
                          {basicAnalysis.analysis.nutrition.protein} g
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100 px-4 py-3">
                        <span className="font-semibold text-gray-700">Carbs:</span>
                        <span className="text-lg font-bold text-yellow-700">
                          {basicAnalysis.analysis.nutrition.carbs} g
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3">
                        <span className="font-semibold text-gray-700">Fat:</span>
                        <span className="text-lg font-bold text-purple-700">
                          {basicAnalysis.analysis.nutrition.fat} g
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PREMIUM FOMO STRATEGY - Show Tempting Modes */}
                {!isPremium && (
                  <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                    <div className="mb-6 text-center">
                      <h3 className="mb-2 text-2xl font-bold text-purple-800">
                        🚀 Unlock Premium Insights
                      </h3>
                      <p className="text-purple-700">
                        Discover what makes your food truly special!
                      </p>
                    </div>

                    {/* Tempting Premium Mode Buttons */}
                    <div className="mb-6 grid grid-cols-2 gap-4">
                      <button
                        onClick={() =>
                          showUpgradePrompt(
                            '🪷 Health & Wellness',
                            'Get personalized health insights, micronutrient analysis, and wellness optimization tips tailored to your dietary goals.'
                          )
                        }
                        className="group rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-100 to-emerald-100 p-4 transition-all duration-200 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="mb-2 text-2xl transition-transform group-hover:scale-110">
                            🪷
                          </div>
                          <div className="font-semibold text-green-800">Health & Wellness</div>
                          <div className="mt-1 text-xs text-green-600">
                            Personalized health insights
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          showUpgradePrompt(
                            '💪 Fitness Fuel',
                            'Optimize your nutrition for athletic performance with pre/post workout analysis and muscle-building insights.'
                          )
                        }
                        className="group rounded-xl border-2 border-orange-200 bg-gradient-to-r from-orange-100 to-red-100 p-4 transition-all duration-200 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="mb-2 text-2xl transition-transform group-hover:scale-110">
                            💪
                          </div>
                          <div className="font-semibold text-orange-800">Fitness Fuel</div>
                          <div className="mt-1 text-xs text-orange-600">
                            Athletic performance analysis
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          showUpgradePrompt(
                            '🌍 Cultural Story',
                            'Discover the fascinating cultural heritage, traditions, and hidden mysteries behind your food.'
                          )
                        }
                        className="group rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-100 to-indigo-100 p-4 transition-all duration-200 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="mb-2 text-2xl transition-transform group-hover:scale-110">
                            🌍
                          </div>
                          <div className="font-semibold text-blue-800">Cultural Story</div>
                          <div className="mt-1 text-xs text-blue-600">
                            Origins & hidden mysteries
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          showUpgradePrompt(
                            '💰 Budget Smart',
                            'Get cost-saving tips, ingredient substitutions, and budget-friendly nutrition optimization strategies.'
                          )
                        }
                        className="group rounded-xl border-2 border-yellow-200 bg-gradient-to-r from-yellow-100 to-amber-100 p-4 transition-all duration-200 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="mb-2 text-2xl transition-transform group-hover:scale-110">
                            💰
                          </div>
                          <div className="font-semibold text-yellow-800">Budget Smart</div>
                          <div className="mt-1 text-xs text-yellow-600">Money-saving insights</div>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          showUpgradePrompt(
                            '👨‍🍳 Chef Secrets',
                            'Learn professional cooking techniques and get step-by-step recipes to recreate restaurant-quality dishes at home.'
                          )
                        }
                        className="group rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-100 to-pink-100 p-4 transition-all duration-200 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="mb-2 text-2xl transition-transform group-hover:scale-110">
                            👨‍🍳
                          </div>
                          <div className="font-semibold text-red-800">Chef Secrets</div>
                          <div className="mt-1 text-xs text-red-600">Pro cooking techniques</div>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          showUpgradePrompt(
                            '🔬 Science Lab',
                            'Dive deep into the biochemistry, molecular gastronomy, and scientific research behind your food.'
                          )
                        }
                        className="group rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-100 to-violet-100 p-4 transition-all duration-200 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="mb-2 text-2xl transition-transform group-hover:scale-110">
                            🔬
                          </div>
                          <div className="font-semibold text-purple-800">Science Lab</div>
                          <div className="mt-1 text-xs text-purple-600">Molecular insights</div>
                        </div>
                      </button>
                    </div>

                    {/* Main Upgrade CTA */}
                    <div className="text-center">
                      <button className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-105">
                        <Crown className="mr-2 inline h-6 w-6" />
                        Unlock All Premium Modes - $4.99/month
                      </button>
                      <p className="mt-2 text-sm text-purple-600">
                        ✨ Join thousands discovering the secrets in their food!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: Focus Selection for Premium Users */}
              {isPremium && showFocusSelection && !detailedAnalysis && (
                <div className="animate-slide-up">
                  <FocusSelection
                    userTier="premium"
                    onFocusSelect={handleFocusSelect}
                    selectedFocus={selectedFocus}
                    recentSelections={recentSelections}
                  />
                </div>
              )}

              {/* STEP 3: Detailed Analysis Results */}
              {detailedAnalysis && (
                <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm">
                  {/* Focus-Specific Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-center text-white">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <span className="text-2xl">
                        {detailedAnalysis.analysis?.focus_icon || '🎯'}
                      </span>
                      <span className="rounded-full bg-white/20 px-2 py-1 text-sm">
                        {detailedAnalysis.analysis?.analysis_focus || 'Detailed Analysis'}
                      </span>
                    </div>
                  </div>

                  {/* Focus-Specific Insights */}
                  {detailedAnalysis.analysis?.focus_insights && (
                    <div className="p-6">
                      <h4 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
                        {detailedAnalysis.analysis.focus_icon}{' '}
                        {detailedAnalysis.analysis.analysis_focus} Insights:
                      </h4>
                      <ul className="space-y-3">
                        {detailedAnalysis.analysis.focus_insights.map(
                          (insight: string, index: number) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400"></span>
                              <span className="leading-relaxed text-gray-700">{insight}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={resetCamera}
                  className="flex-1 rounded-xl bg-gray-100 p-4 font-semibold text-gray-700 transition-colors hover:scale-105 hover:bg-gray-200"
                >
                  📸 Analyze Another
                </button>
                <Link
                  href="/meals"
                  className="bg-brand-100 text-brand-700 hover:bg-brand-200 flex-1 rounded-xl p-4 text-center font-semibold transition-colors hover:scale-105"
                >
                  📊 View All Meals
                </Link>
              </div>
            </div>
          )}

          {/* Upgrade Prompt Modal */}
          {upgradePrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6">
                <h3 className="mb-2 text-xl font-bold">{upgradePrompt.mode}</h3>
                <p className="mb-4 text-gray-600">{upgradePrompt.description}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUpgradePrompt(null)}
                    className="flex-1 rounded-xl bg-gray-100 p-3 font-semibold text-gray-700"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      setUpgradePrompt(null)
                      // Navigate to upgrade page
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-3 font-semibold text-white"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  )
}
