'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, RotateCcw, Sparkles, ArrowLeft, Crown, Zap, Heart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import FocusSelection from '@/components/FocusSelection'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function CameraPage() {
  const { user, profile } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [basicAnalysis, setBasicAnalysis] = useState<any>(null) // Basic nutrition
  const [detailedAnalysis, setDetailedAnalysis] = useState<any>(null) // Focus-specific
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null)
  const [showFocusSelection, setShowFocusSelection] = useState(false)
  const [recentSelections, setRecentSelections] = useState<string[]>([])
  const [upgradePrompt, setUpgradePrompt] = useState<{mode: string, description: string} | null>(null)

  const isPremium = profile?.subscription_tier === 'premium'

  // Load recent selections from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mealappeal_recent_focus')
    if (saved) {
      try {
        setRecentSelections(JSON.parse(saved))
      } catch (e) {
        console.log('Could not parse recent selections')
      }
    }
  }, [])

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
          height: { ideal: 720 }
        }
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

  // STEP 1: Get basic nutrition immediately after photo
  const analyzeBasicNutrition = async (imageDataUrl: string) => {
    if (!user) {
      setError('Please sign in to analyze food')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('🔍 Getting basic nutrition analysis...')
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && {
            'Authorization': `Bearer ${session.access_token}`
          }),
        },
        body: JSON.stringify({
          imageDataUrl: imageDataUrl,
          randomSeed: Math.floor(Math.random() * 1000000),
          focusMode: 'basic_nutrition', // Special mode for basic analysis
          userTier: isPremium ? 'premium' : 'free'
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

  // STEP 2: Get detailed analysis when focus is selected (Premium only)
  const handleFocusSelect = async (focusId: string) => {
    if (!isPremium) {
      // Show upgrade prompt for free users
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
    if (!capturedImage) return

    setIsAnalyzing(true)

    try {
      console.log('🔍 Getting detailed analysis with focus:', focusId)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && {
            'Authorization': `Bearer ${session.access_token}`
          }),
        },
        body: JSON.stringify({
          imageDataUrl: capturedImage,
          randomSeed: Math.floor(Math.random() * 1000000),
          focusMode: focusId,
          userTier: 'premium'
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold gradient-text">Food Analysis</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              {user ? (
                <div className="flex items-center gap-2">
                  <span>{user.email}</span>
                  {isPremium && (
                    <span className="text-yellow-600 font-medium flex items-center gap-1">
                      <Crown className="w-4 h-4" />
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
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Welcome Message */}
          {!capturedImage && !isActive && (
            <div className="bg-gradient-to-r from-brand-500 to-orange-500 text-white p-6 rounded-2xl text-center shadow-lg">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-xl font-bold mb-2">Ready for Food Magic?</h2>
              <p className="opacity-90">
                Capture your meal and get instant nutrition analysis!
              </p>
            </div>
          )}

          {/* Camera Interface */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20">
            {!isActive && !capturedImage && (
              <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center gap-4 p-12 rounded-2xl border-2 border-dashed border-gray-300 hover:border-brand-500 hover:bg-brand-50 transition-all duration-200 hover:scale-105"
                >
                  <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center animate-pulse">
                    <Camera className="w-8 h-8 text-brand-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-800 mb-1">Start Camera</p>
                    <p className="text-sm text-gray-600">Let's analyze your delicious meal!</p>
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
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 border-2 border-white/50 rounded-lg m-4">
                  <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                    <span className="text-white text-xs font-medium">📸 Perfect shot!</span>
                  </div>
                </div>
                
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 bg-white rounded-full border-4 border-brand-500 flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-200 animate-pulse"
                  >
                    <Camera className="w-8 h-8 text-brand-600" />
                  </button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="relative aspect-square">
                <img
                  src={capturedImage}
                  alt="Captured food"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={resetCamera}
                  className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors duration-200 hover:scale-110"
                >
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Analysis Loading State */}
          {isAnalyzing && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 rounded-2xl text-center shadow-lg">
              <div className="animate-spin w-8 h-8 border-3 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">🤖 AI Magic in Progress...</h3>
              <p className="opacity-90">Analyzing your delicious meal</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-xl">😔</span>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: BASIC NUTRITION RESULTS - ALWAYS SHOWN FIRST */}
          {basicAnalysis && (
            <div className="space-y-6 animate-slide-up">
              {/* Success Message */}
              <div className="p-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl text-center shadow-lg">
                <div className="text-2xl mb-2">🎉</div>
                <p className="font-bold text-lg">Analysis Complete!</p>
              </div>
              
              {/* BASIC NUTRITION - ALWAYS VISIBLE */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                {/* Food Name & Confidence */}
                <div className="bg-gradient-to-r from-brand-500 to-orange-500 text-white p-6 text-center">
                  <h2 className="text-2xl font-bold mb-2">
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
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Nutrition Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                        <span className="font-semibold text-gray-700">Energy:</span>
                        <span className="font-bold text-green-700 text-lg">
                          {basicAnalysis.analysis.nutrition.calories} kcal
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                        <span className="font-semibold text-gray-700">Protein:</span>
                        <span className="font-bold text-blue-700 text-lg">{basicAnalysis.analysis.nutrition.protein} g</span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl">
                        <span className="font-semibold text-gray-700">Carbs:</span>
                        <span className="font-bold text-yellow-700 text-lg">{basicAnalysis.analysis.nutrition.carbs} g</span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                        <span className="font-semibold text-gray-700">Fat:</span>
                        <span className="font-bold text-purple-700 text-lg">{basicAnalysis.analysis.nutrition.fat} g</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PREMIUM FOMO STRATEGY - Show Tempting Modes */}
                {!isPremium && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-purple-800 mb-2">🚀 Unlock Premium Insights</h3>
                      <p className="text-purple-700">
                        Discover what makes your food truly special!
                      </p>
                    </div>

                    {/* Tempting Premium Mode Buttons */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <button
                        onClick={() => showUpgradePrompt('🪷 Health & Wellness', 'Get personalized health insights, micronutrient analysis, and wellness optimization tips tailored to your dietary goals.')}
                        className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-200 hover:scale-105 transition-all duration-200 group"
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🪷</div>
                          <div className="font-semibold text-green-800">Health & Wellness</div>
                          <div className="text-xs text-green-600 mt-1">Personalized health insights</div>
                        </div>
                      </button>

                      <button
                        onClick={() => showUpgradePrompt('💪 Fitness Fuel', 'Optimize your nutrition for athletic performance with pre/post workout analysis and muscle-building insights.')}
                        className="p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl border-2 border-orange-200 hover:scale-105 transition-all duration-200 group"
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💪</div>
                          <div className="font-semibold text-orange-800">Fitness Fuel</div>
                          <div className="text-xs text-orange-600 mt-1">Athletic performance analysis</div>
                        </div>
                      </button>

                      <button
                        onClick={() => showUpgradePrompt('🌍 Cultural Story', 'Discover the fascinating cultural heritage, traditions, and hidden mysteries behind your food.')}
                        className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border-2 border-blue-200 hover:scale-105 transition-all duration-200 group"
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🌍</div>
                          <div className="font-semibold text-blue-800">Cultural Story</div>
                          <div className="text-xs text-blue-600 mt-1">Origins & hidden mysteries</div>
                        </div>
                      </button>

                      <button
                        onClick={() => showUpgradePrompt('💰 Budget Smart', 'Get cost-saving tips, ingredient substitutions, and budget-friendly nutrition optimization strategies.')}
                        className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl border-2 border-yellow-200 hover:scale-105 transition-all duration-200 group"
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💰</div>
                          <div className="font-semibold text-yellow-800">Budget Smart</div>
                          <div className="text-xs text-yellow-600 mt-1">Money-saving insights</div>
                        </div>
                      </button>

                      <button
                        onClick={() => showUpgradePrompt('👨‍🍳 Chef Secrets', 'Learn professional cooking techniques and get step-by-step recipes to recreate restaurant-quality dishes at home.')}
                        className="p-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-xl border-2 border-red-200 hover:scale-105 transition-all duration-200 group"
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">👨‍🍳</div>
                          <div className="font-semibold text-red-800">Chef Secrets</div>
                          <div className="text-xs text-red-600 mt-1">Pro cooking techniques</div>
                        </div>
                      </button>

                      <button
                        onClick={() => showUpgradePrompt('🔬 Science Lab', 'Dive deep into the biochemistry, molecular gastronomy, and scientific research behind your food.')}
                        className="p-4 bg-gradient-to-r from-purple-100 to-violet-100 rounded-xl border-2 border-purple-200 hover:scale-105 transition-all duration-200 group"
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔬</div>
                          <div className="font-semibold text-purple-800">Science Lab</div>
                          <div className="text-xs text-purple-600 mt-1">Molecular insights</div>
                        </div>
                      </button>
                    </div>

                    {/* Main Upgrade CTA */}
                    <div className="text-center">
                      <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all duration-200 shadow-lg">
                        <Crown className="w-6 h-6 inline mr-2" />
                        Unlock All Premium Modes - $4.99/month
                      </button>
                      <p className="text-sm text-purple-600 mt-2">
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
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                  {/* Focus-Specific Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl">{detailedAnalysis.analysis?.focus_icon || '🎯'}</span>
                      <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                        {detailedAnalysis.analysis?.analysis_focus || 'Detailed Analysis'}
                      </span>
                    </div>
                  </div>

                  {/* Focus-Specific Insights */}
                  {detailedAnalysis.analysis?.focus_insights && (
                    <div className="p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        {detailedAnalysis.analysis.focus_icon} {detailedAnalysis.analysis.analysis_focus} Insights:
                      </h4>
                      <ul className="space-y-3">
                        {detailedAnalysis.analysis.focus_insights.map((insight: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-gray-700 leading-relaxed">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={resetCamera}
                  className="flex-1 p-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors hover:scale-105"
                >
                  📸 Analyze Another
                </button>
                <Link
                  href="/meals"
                  className="flex-1 p-4 bg-brand-100 text-brand-700 rounded-xl font-semibold hover:bg-brand-200 transition-colors text-center hover:scale-105"
                >
                  📊 View All Meals
                </Link>
              </div>
            </div>
          )}

          {/* Upgrade Prompt Modal */}
          {upgradePrompt && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-2">{upgradePrompt.mode}</h3>
                <p className="text-gray-600 mb-4">{upgradePrompt.description}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUpgradePrompt(null)}
                    className="flex-1 p-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      setUpgradePrompt(null)
                      // Navigate to upgrade page
                    }}
                    className="flex-1 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold"
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