'use client'

import { ArrowLeft, Camera, Crown, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

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
        console.log('🔍 Result structure:', Object.keys(result))
        console.log('🔍 Has analysis field?', !!result.analysis)
        console.log('🔍 Has premium_analysis field?', !!result.premium_analysis)
        console.log('🔍 All result keys:', JSON.stringify(Object.keys(result)))
        console.log('🔍 ANALYSIS CONTENT:', JSON.stringify(result.analysis, null, 2))
        console.log('🔍 FULL RESULT:', JSON.stringify(result, null, 2))
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

      // 🚀 INSTANT BASIC ANALYSIS - NO WAITING!
      console.log('🚀 Starting instant basic analysis...')
      analyzeFood(imageDataUrl, 'health_wellness')
    } catch (err) {
      console.error('❌ Capture error:', err)
      setError('Failed to capture photo. Please try again.')
    }
  }, [stopCamera, analyzeFood])

  // State for premium content display
  const [showPremiumContent, setShowPremiumContent] = useState<string | null>(null)
  const [premiumUsage, setPremiumUsage] = useState<{ [key: string]: number }>({})

  // 🎯 PREMIUM TRIAL HANDLER - WITH TOGGLE & USAGE TRACKING
  const handlePremiumTrial = (focusMode: string) => {
    console.log('🎯🎯🎯 PREMIUM TRIAL CLICKED:', focusMode)

    if (!capturedImage) {
      console.error('❌ No image captured!')
      setError('No image captured. Please take a photo first.')
      return
    }

    // Toggle - if already showing this mode, hide it
    if (showPremiumContent === focusMode) {
      setShowPremiumContent(null)
      return
    }

    // Check daily usage (simple localStorage for now)
    const today = new Date().toDateString()
    const usageKey = `${focusMode}_${today}`
    const currentUsage = parseInt(localStorage.getItem(usageKey) || '0')

    if (currentUsage >= 3) {
      setError(
        `You've used ${focusMode.replace('_', ' ')} 3 times today. Upgrade to Premium for unlimited access!`
      )
      return
    }

    // Only analyze if we don't have content yet OR it's a different mode
    if (!basicAnalysis?.analysis?.focus_insights || showPremiumContent !== focusMode) {
      console.log('🚀🚀🚀 RUNNING PREMIUM TRIAL ANALYSIS...')
      setIsAnalyzing(true)

      // Increment usage
      localStorage.setItem(usageKey, String(currentUsage + 1))
      setPremiumUsage(prev => ({ ...prev, [focusMode]: currentUsage + 1 }))

      analyzeFood(capturedImage, focusMode)
    }

    setShowPremiumContent(focusMode)
  }

  // Get usage count for display
  const getUsageCount = (focusMode: string) => {
    const today = new Date().toDateString()
    const usageKey = `${focusMode}_${today}`
    return parseInt(localStorage.getItem(usageKey) || '0')
  }

  const resetCamera = useCallback(() => {
    console.log('🔄 Resetting camera...')
    setCapturedImage(null)
    setBasicAnalysis(null)
    setError(null)
    setIsAnalyzing(false)
    setShowPremiumContent(null) // Reset premium content
    startCamera()
  }, [startCamera])

  const navigateToMeals = useCallback(() => {
    router.push('/meals')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/20 bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <h1 className="bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-xl font-bold text-transparent">
                Food Discovery
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">{user.email}</span>
                  {isPremium && (
                    <span className="flex items-center gap-1 font-medium text-yellow-600">
                      <Crown className="h-4 w-4" />
                      <span className="hidden sm:inline">Premium</span>
                    </span>
                  )}
                </div>
              ) : (
                'Please sign in'
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-md space-y-6">
          {/* Welcome Message */}
          {!capturedImage && !isActive && !isAnalyzing && (
            <div className="rounded-2xl bg-gradient-to-r from-green-500 to-orange-500 p-6 text-center text-white shadow-lg">
              <div className="mb-3 text-4xl">🎉</div>
              <h2 className="mb-2 text-xl font-bold">Ready for Food Magic?</h2>
              <p className="opacity-90">Capture your meal and discover its secrets!</p>
            </div>
          )}

          {/* Camera Interface */}
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm">
            {/* 1. Initial State - Start Camera */}
            {!isActive && !capturedImage && !isAnalyzing && (
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-300 p-12 transition-all duration-200 hover:scale-105 hover:border-green-500 hover:bg-green-50"
                  aria-label="Start camera"
                >
                  <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-green-100">
                    <Camera className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="mb-1 font-semibold text-gray-800">Start Camera</p>
                    <p className="text-sm text-gray-600">Let's discover your meal!</p>
                  </div>
                </button>
              </div>
            )}

            {/* 2. Camera Active - Video Stream */}
            {isActive && !capturedImage && (
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
                    <span className="text-xs font-medium text-white">📸 Perfect!</span>
                  </div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <button
                    onClick={capturePhoto}
                    className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-500 bg-white shadow-xl transition-transform duration-200 hover:scale-110 active:scale-95"
                    aria-label="Take photo"
                  >
                    <Camera className="h-8 w-8 text-green-600" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Analysis in Progress */}
            {isAnalyzing && (
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
                  <h3 className="mb-2 text-lg font-bold text-purple-800">🪄 Analyzing...</h3>
                  <p className="text-purple-600">Discovering your meal's secrets...</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">😔</span>
                <p className="font-medium text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* 🚀 INSTANT ANALYSIS RESULTS + PREMIUM BUTTONS */}
          {basicAnalysis && (basicAnalysis.analysis || basicAnalysis.success) && (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 p-4 text-center text-white shadow-lg">
                <div className="mb-2 text-2xl">🎉</div>
                <p className="text-lg font-bold">Analysis Complete!</p>
              </div>

              {/* Food Name & Basic Nutrition */}
              <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm">
                {/* 🥗 FOOD NAME HEADER */}
                <div className="bg-gradient-to-r from-green-500 to-orange-500 p-6 text-center text-white">
                  <h2 className="mb-2 text-2xl font-bold">
                    {basicAnalysis.analysis?.foodName ||
                      basicAnalysis.analysis?.name ||
                      'Delicious Food'}
                  </h2>
                  {basicAnalysis.analysis?.confidence && (
                    <p className="text-lg opacity-90">
                      Confidence: {Math.round(basicAnalysis.analysis.confidence * 100)}%
                    </p>
                  )}
                </div>

                {/* 📊 NUTRITION BREAKDOWN - FLEXIBLE */}
                <div className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Nutrition Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-green-50 to-green-100 px-4 py-3">
                      <span className="font-semibold text-gray-700">Energy:</span>
                      <span className="text-lg font-bold text-green-700">
                        {basicAnalysis.analysis?.nutrition?.calories ||
                          basicAnalysis.analysis?.calories ||
                          0}{' '}
                        kcal
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3">
                      <span className="font-semibold text-gray-700">Protein:</span>
                      <span className="text-lg font-bold text-blue-700">
                        {basicAnalysis.analysis?.nutrition?.protein ||
                          basicAnalysis.analysis?.protein ||
                          0}{' '}
                        g
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100 px-4 py-3">
                      <span className="font-semibold text-gray-700">Carbs:</span>
                      <span className="text-lg font-bold text-yellow-700">
                        {basicAnalysis.analysis?.nutrition?.carbs ||
                          basicAnalysis.analysis?.carbs ||
                          0}{' '}
                        g
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3">
                      <span className="font-semibold text-gray-700">Fat:</span>
                      <span className="text-lg font-bold text-purple-700">
                        {basicAnalysis.analysis?.nutrition?.fat || basicAnalysis.analysis?.fat || 0}{' '}
                        g
                      </span>
                    </div>
                  </div>

                  {/* 🎯 PREMIUM CONTENT - ONLY SHOW AFTER BUTTON CLICK */}
                  {showPremiumContent === 'cultural_story' &&
                    basicAnalysis?.analysis?.focus_insights && (
                      <div className="mt-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                        <h4 className="mb-3 flex items-center gap-2 text-xl font-bold text-blue-800">
                          <span className="text-2xl">🌍</span>
                          Cultural Story
                        </h4>
                        {basicAnalysis.analysis.focus_insights.map(
                          (insight: string, index: number) => (
                            <div key={index} className="mb-3 rounded-lg bg-white/70 p-4">
                              <p className="leading-relaxed text-blue-700">{insight}</p>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {showPremiumContent === 'chef_secrets' &&
                    basicAnalysis?.analysis?.focus_insights && (
                      <div className="mt-6 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 p-6">
                        <h4 className="mb-3 flex items-center gap-2 text-xl font-bold text-orange-800">
                          <span className="text-2xl">👨‍🍳</span>
                          Chef's Recipe & Cooking Tips
                        </h4>
                        {basicAnalysis.analysis.focus_insights.map(
                          (insight: string, index: number) => (
                            <div key={index} className="mb-3 rounded-lg bg-white/70 p-4">
                              <p className="leading-relaxed text-orange-700">{insight}</p>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {showPremiumContent === 'fitness_fuel' &&
                    basicAnalysis?.analysis?.focus_insights && (
                      <div className="mt-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                        <h4 className="mb-3 flex items-center gap-2 text-xl font-bold text-green-800">
                          <span className="text-2xl">💪</span>
                          Fitness Fuel
                        </h4>
                        {basicAnalysis.analysis.focus_insights.map(
                          (insight: string, index: number) => (
                            <div key={index} className="mb-3 rounded-lg bg-white/70 p-4">
                              <p className="leading-relaxed text-green-700">{insight}</p>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {showPremiumContent === 'science_lab' &&
                    basicAnalysis?.analysis?.focus_insights && (
                      <div className="mt-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                        <h4 className="mb-3 flex items-center gap-2 text-xl font-bold text-purple-800">
                          <span className="text-2xl">🔬</span>
                          Science Lab
                        </h4>
                        {basicAnalysis.analysis.focus_insights.map(
                          (insight: string, index: number) => (
                            <div key={index} className="mb-3 rounded-lg bg-white/70 p-4">
                              <p className="leading-relaxed text-purple-700">{insight}</p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>

                {/* 🚀 PREMIUM TRIAL SYSTEM - 3 FREE TESTS PER DAY */}
                {!isPremium && (
                  <div className="border-t border-gray-200 bg-gradient-to-br from-orange-50 to-pink-50 p-6">
                    <div className="mb-6 text-center">
                      <h3 className="mb-2 text-2xl font-bold text-orange-800">
                        🚀 Try Premium Analysis Modes
                      </h3>
                      <p className="text-orange-700">
                        Test each mode 3 times today for FREE! See the magic yourself ✨
                      </p>
                      <div className="mt-2 text-sm text-orange-600">
                        After 3 tries → Upgrade to Premium for unlimited access
                      </div>
                    </div>

                    {/* BIGGER PREMIUM BUTTONS WITH MORE SPACING */}
                    <div className="mb-8 space-y-6">
                      <button
                        onClick={() => handlePremiumTrial('cultural_story')}
                        className={`group hover:shadow-3xl flex w-full items-center justify-between rounded-3xl p-8 text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                          showPremiumContent === 'cultural_story'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 ring-4 ring-blue-300'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <span className="text-5xl">🌍</span>
                          <div className="text-left">
                            <div className="text-2xl font-bold">Cultural Story</div>
                            <div className="text-lg text-blue-100">
                              Discover origins & traditions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-blue-200">
                            {getUsageCount('cultural_story')}/3 used today
                          </div>
                          <div className="text-lg font-bold">
                            {showPremiumContent === 'cultural_story' ? 'Hide' : 'Show'}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => handlePremiumTrial('chef_secrets')}
                        className={`group hover:shadow-3xl flex w-full items-center justify-between rounded-3xl p-8 text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                          showPremiumContent === 'chef_secrets'
                            ? 'bg-gradient-to-r from-orange-600 to-red-700 ring-4 ring-orange-300'
                            : 'bg-gradient-to-r from-orange-500 to-red-600'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <span className="text-5xl">👨‍🍳</span>
                          <div className="text-left">
                            <div className="text-2xl font-bold">Chef Secrets</div>
                            <div className="text-lg text-orange-100">
                              Recipe & cooking techniques
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-orange-200">
                            {getUsageCount('chef_secrets')}/3 used today
                          </div>
                          <div className="text-lg font-bold">
                            {showPremiumContent === 'chef_secrets' ? 'Hide' : 'Show'}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => handlePremiumTrial('fitness_fuel')}
                        className={`group hover:shadow-3xl flex w-full items-center justify-between rounded-3xl p-8 text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                          showPremiumContent === 'fitness_fuel'
                            ? 'bg-gradient-to-r from-green-600 to-emerald-700 ring-4 ring-green-300'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <span className="text-5xl">💪</span>
                          <div className="text-left">
                            <div className="text-2xl font-bold">Fitness Fuel</div>
                            <div className="text-lg text-green-100">
                              Athletic performance insights
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-200">
                            {getUsageCount('fitness_fuel')}/3 used today
                          </div>
                          <div className="text-lg font-bold">
                            {showPremiumContent === 'fitness_fuel' ? 'Hide' : 'Show'}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => handlePremiumTrial('science_lab')}
                        className={`group hover:shadow-3xl flex w-full items-center justify-between rounded-3xl p-8 text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                          showPremiumContent === 'science_lab'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-700 ring-4 ring-purple-300'
                            : 'bg-gradient-to-r from-purple-500 to-pink-600'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <span className="text-5xl">🔬</span>
                          <div className="text-left">
                            <div className="text-2xl font-bold">Science Lab</div>
                            <div className="text-lg text-purple-100">
                              Scientific nutrition analysis
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-purple-200">
                            {getUsageCount('science_lab')}/3 used today
                          </div>
                          <div className="text-lg font-bold">
                            {showPremiumContent === 'science_lab' ? 'Hide' : 'Show'}
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="border-t border-orange-200 pt-4 text-center">
                      <p className="mb-3 text-sm text-orange-700">
                        Love the premium insights? Get unlimited access!
                      </p>
                      <button
                        onClick={() => router.push('/upgrade')}
                        className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        <Crown className="mr-2 inline h-5 w-5" />
                        Upgrade to Premium - $4.99/month
                      </button>
                    </div>
                  </div>
                )}

                {/* Premium User Success */}
                {isPremium && (
                  <div className="border-t border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center">
                    <Crown className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
                    <h3 className="mb-1 text-lg font-bold text-green-800">
                      Premium Analysis Active
                    </h3>
                    <p className="text-green-700">Enjoying unlimited insights and storage!</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={resetCamera}
                  className="flex-1 rounded-xl bg-gray-100 p-4 font-semibold text-gray-700 transition-all hover:scale-105 hover:bg-gray-200"
                >
                  📸 Analyze Another
                </button>
                <button
                  onClick={navigateToMeals}
                  className="flex-1 rounded-xl bg-green-100 p-4 text-center font-semibold text-green-700 transition-all hover:scale-105 hover:bg-green-200"
                >
                  📊 View All Meals
                </button>
              </div>

              {/* 🔄 RESET TRIALS BUTTON - FOR DEMO */}
              <div className="text-center">
                <button
                  onClick={() => {
                    const today = new Date().toDateString()
                    localStorage.removeItem(`cultural_story_${today}`)
                    localStorage.removeItem(`chef_secrets_${today}`)
                    localStorage.removeItem(`fitness_fuel_${today}`)
                    localStorage.removeItem(`science_lab_${today}`)
                    setPremiumUsage({})
                    alert('🎉 Trial usage reset! You have 3 new tries for each mode today!')
                    window.location.reload()
                  }}
                  className="rounded-lg bg-purple-100 px-6 py-2 text-purple-700 hover:bg-purple-200"
                >
                  🔄 Reset Trial Usage (Demo)
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  )
}
