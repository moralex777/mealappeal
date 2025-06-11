'use client'

import { useAuth } from '@/contexts/AuthContext'
import {
  Activity,
  Brain,
  ChefHat,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Heart,
  Lock,
  Microscope,
  Sparkles,
  Trophy,
  Unlock,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'

interface IMeal {
  id: string
  title: string | null
  basic_nutrition: {
    energy_kcal?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
  } | null
  premium_nutrition?: any
  health_score?: number | null
  meal_tags?: string[] | null
}

interface AnalysisMode {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  gradient: string
  isPremium: boolean
  previewText: string
  fullAnalysis: () => React.ReactNode
}

interface AIAnalysisModesProps {
  meal: IMeal
  className?: string
}

export default function AIAnalysisModes({ meal, className = '' }: AIAnalysisModesProps) {
  const { profile } = useAuth()
  const [expandedMode, setExpandedMode] = useState<string | null>(null)
  const [analysisCache, setAnalysisCache] = useState<Record<string, any>>({})
  const [loadingModes, setLoadingModes] = useState<Record<string, boolean>>({})

  const isPremium = profile?.subscription_tier === 'premium_monthly' || profile?.subscription_tier === 'premium_yearly'

  // Simulated analysis data for demo
  const generateAnalysis = (mode: string) => {
    const calories = meal.basic_nutrition?.energy_kcal || 450
    const protein = meal.basic_nutrition?.protein_g || 25
    const carbs = meal.basic_nutrition?.carbs_g || 35
    const fat = meal.basic_nutrition?.fat_g || 18

    switch (mode) {
      case 'health':
        return {
          healthScore: meal.health_score || 85,
          micronutrients: [
            { name: 'Vitamin C', amount: '45mg', daily: 75, color: 'text-orange-600' },
            { name: 'Iron', amount: '8.2mg', daily: 65, color: 'text-red-600' },
            { name: 'Calcium', amount: '180mg', daily: 22, color: 'text-blue-600' },
            { name: 'Vitamin B12', amount: '2.1μg', daily: 88, color: 'text-purple-600' },
          ],
          healthInsights: [
            '✅ Excellent protein-to-calorie ratio supports muscle maintenance',
            '🌱 Rich in antioxidants that combat cellular aging',
            '💪 Balanced amino acid profile for optimal recovery',
            '⚠️ Consider adding leafy greens for more folate',
          ]
        }
      
      case 'fitness':
        return {
          workoutAlignment: 'Perfect Pre-Workout',
          performanceMetrics: {
            energyRating: 92,
            recoveryBoost: 78,
            hydrationSupport: 65,
            inflammationFighting: 88,
          },
          fitnessInsights: [
            '🚀 Ideal carb-to-protein ratio for sustained energy',
            '💥 Natural compounds support fat oxidation during cardio',
            '🏋️ Leucine content triggers muscle protein synthesis',
            '⏰ Best consumed 30-45 minutes before training',
          ]
        }

      case 'cultural':
        return {
          origin: 'Mediterranean-Asian Fusion',
          culturalBackground: 'This dish represents a beautiful fusion of Mediterranean health principles with Asian flavor profiles.',
          traditionalBenefits: [
            '🏛️ Mediterranean: Heart-healthy olive oil and fresh herbs',
            '🥢 Asian: Fermented ingredients for gut health',
            '🌿 Combined: Anti-inflammatory spice blends',
            '🍯 Traditional: Natural preservation techniques',
          ],
          culturalScore: 94
        }

      case 'chef':
        return {
          technique: 'Pan-seared with finishing oil',
          platingScore: 87,
          culinaryInsights: [
            '🔥 Perfect Maillard reaction creates complex flavors',
            '🎨 Color balance follows classical plating principles',
            '✨ Textural contrast elevates the dining experience',
            '👨‍🍳 Professional knife work evident in uniform cuts',
          ],
          improvementTips: [
            'Add a pop of green with microgreens',
            'Consider a drizzle of reduction for depth',
            'Warm plates enhance presentation',
          ]
        }

      case 'science':
        return {
          molecularBreakdown: {
            macroRatio: { protein: 22, carbs: 47, fat: 31 },
            glycemicImpact: 'Moderate (GI: 58)',
            oxidativeStress: 'Low - high antioxidant activity',
            bioavailability: 'Enhanced by cooking method',
          },
          biochemistry: [
            '🧬 Leucine triggers mTOR pathway for muscle growth',
            '⚗️ Lycopene absorption increased by heat processing',
            '🔬 Polyphenols provide neuroprotective benefits',
            '💊 Bioactive compounds show anti-inflammatory properties',
          ]
        }

      case 'budget':
        return {
          costAnalysis: {
            estimatedCost: '$3.50',
            costPerCalorie: '$0.0078',
            nutritionValue: 'Excellent',
            seasonalScore: 85,
          },
          savingTips: [
            '💰 Buy proteins in bulk and freeze portions',
            '🛒 Shop seasonal vegetables for 40% savings',
            '⏰ Meal prep reduces cost to $2.80 per serving',
            '🌱 Grow herbs at home for year-round savings',
          ]
        }

      default:
        return {}
    }
  }

  const modes: AnalysisMode[] = [
    {
      id: 'health',
      title: 'Health Mode',
      description: 'Medical-grade nutritional assessment',
      icon: Heart,
      color: 'text-red-500',
      gradient: 'from-red-500 to-pink-500',
      isPremium: false,
      previewText: 'Basic nutrition info • Health score available',
      fullAnalysis: () => {
        const analysis = generateAnalysis('health')
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Health Assessment</h4>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-600">Health Score: {analysis.healthScore}/100</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {analysis.micronutrients?.map((nutrient: any, idx: number) => (
                <div key={idx} className="glass-effect rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900">{nutrient.name}</div>
                  <div className={`text-lg font-bold ${nutrient.color}`}>{nutrient.amount}</div>
                  <div className="text-xs text-gray-600">{nutrient.daily}% DV</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Health Insights</h5>
              {analysis.healthInsights?.map((insight: string, idx: number) => (
                <div key={idx} className="text-sm text-gray-700">{insight}</div>
              ))}
            </div>
          </div>
        )
      }
    },
    {
      id: 'fitness',
      title: 'Fitness Mode',
      description: 'Workout alignment and performance metrics',
      icon: Activity,
      color: 'text-blue-500',
      gradient: 'from-blue-500 to-cyan-500',
      isPremium: true,
      previewText: 'Unlock workout optimization and performance insights',
      fullAnalysis: () => {
        const analysis = generateAnalysis('fitness')
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Fitness Analysis</h4>
              <div className="glass-effect rounded-full px-3 py-1">
                <span className="text-sm font-medium text-blue-600">{analysis.workoutAlignment}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(analysis.performanceMetrics || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="glass-effect rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{value}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Performance Insights</h5>
              {analysis.fitnessInsights?.map((insight: string, idx: number) => (
                <div key={idx} className="text-sm text-gray-700">{insight}</div>
              ))}
            </div>
          </div>
        )
      }
    },
    {
      id: 'cultural',
      title: 'Cultural Mode',
      description: 'Cuisine origins and traditional benefits',
      icon: Brain,
      color: 'text-purple-500',
      gradient: 'from-purple-500 to-indigo-500',
      isPremium: true,
      previewText: 'Discover cultural heritage and traditional wisdom',
      fullAnalysis: () => {
        const analysis = generateAnalysis('cultural')
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Cultural Heritage</h4>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-600">Score: {analysis.culturalScore}/100</span>
              </div>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">Origin</h5>
              <p className="text-purple-600 font-semibold">{analysis.origin}</p>
              <p className="text-sm text-gray-600 mt-2">{analysis.culturalBackground}</p>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Traditional Benefits</h5>
              {analysis.traditionalBenefits?.map((benefit: string, idx: number) => (
                <div key={idx} className="text-sm text-gray-700">{benefit}</div>
              ))}
            </div>
          </div>
        )
      }
    },
    {
      id: 'chef',
      title: 'Chef Mode',
      description: 'Culinary techniques and presentation tips',
      icon: ChefHat,
      color: 'text-orange-500',
      gradient: 'from-orange-500 to-red-500',
      isPremium: true,
      previewText: 'Professional culinary analysis and plating insights',
      fullAnalysis: () => {
        const analysis = generateAnalysis('chef')
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Culinary Analysis</h4>
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">Plating: {analysis.platingScore}/100</span>
              </div>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">Cooking Technique</h5>
              <p className="text-orange-600 font-semibold">{analysis.technique}</p>
            </div>

            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Culinary Insights</h5>
                {analysis.culinaryInsights?.map((insight: string, idx: number) => (
                  <div key={idx} className="text-sm text-gray-700 mb-1">{insight}</div>
                ))}
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Enhancement Tips</h5>
                {analysis.improvementTips?.map((tip: string, idx: number) => (
                  <div key={idx} className="text-sm text-gray-600 mb-1">💡 {tip}</div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      id: 'science',
      title: 'Science Mode',
      description: 'Biochemistry and detailed nutrient breakdown',
      icon: Microscope,
      color: 'text-green-500',
      gradient: 'from-green-500 to-emerald-500',
      isPremium: true,
      previewText: 'Deep molecular analysis and biochemical insights',
      fullAnalysis: () => {
        const analysis = generateAnalysis('science')
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Scientific Analysis</h4>
              <div className="flex items-center gap-2">
                <Microscope className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Molecular Profile</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-effect rounded-lg p-3">
                <h6 className="text-sm font-medium text-gray-900 mb-2">Macro Ratio</h6>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Protein</span>
                    <span className="font-medium">{analysis.molecularBreakdown?.macroRatio?.protein || 0}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Carbs</span>
                    <span className="font-medium">{analysis.molecularBreakdown?.macroRatio?.carbs || 0}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Fat</span>
                    <span className="font-medium">{analysis.molecularBreakdown?.macroRatio?.fat || 0}%</span>
                  </div>
                </div>
              </div>

              <div className="glass-effect rounded-lg p-3">
                <h6 className="text-sm font-medium text-gray-900 mb-2">Metabolic Impact</h6>
                <div className="space-y-1 text-xs">
                  <div>GI: {analysis.molecularBreakdown?.glycemicImpact || 'N/A'}</div>
                  <div>Oxidative: {analysis.molecularBreakdown?.oxidativeStress || 'N/A'}</div>
                  <div>Absorption: {analysis.molecularBreakdown?.bioavailability || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Biochemical Insights</h5>
              {analysis.biochemistry?.map((insight: string, idx: number) => (
                <div key={idx} className="text-sm text-gray-700">{insight}</div>
              ))}
            </div>
          </div>
        )
      }
    },
    {
      id: 'budget',
      title: 'Budget Mode',
      description: 'Cost-effectiveness and money-saving tips',
      icon: DollarSign,
      color: 'text-yellow-500',
      gradient: 'from-yellow-500 to-orange-500',
      isPremium: true,
      previewText: 'Smart shopping tips and cost optimization',
      fullAnalysis: () => {
        const analysis = generateAnalysis('budget')
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Budget Analysis</h4>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-600">{analysis.costAnalysis.nutritionValue} Value</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-effect rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900">Estimated Cost</div>
                <div className="text-xl font-bold text-yellow-600">{analysis.costAnalysis?.estimatedCost || 'N/A'}</div>
                <div className="text-xs text-gray-600">{analysis.costAnalysis?.costPerCalorie || 'N/A'} per calorie</div>
              </div>

              <div className="glass-effect rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900">Seasonal Score</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                      style={{ width: `${analysis.costAnalysis?.seasonalScore || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-yellow-600">{analysis.costAnalysis?.seasonalScore || 0}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Money-Saving Tips</h5>
              {analysis.savingTips?.map((tip: string, idx: number) => (
                <div key={idx} className="text-sm text-gray-700">{tip}</div>
              ))}
            </div>
          </div>
        )
      }
    }
  ]

  const handleModeToggle = async (modeId: string) => {
    if (expandedMode === modeId) {
      setExpandedMode(null)
      return
    }

    const mode = modes.find(m => m.id === modeId)
    if (!mode) return

    // For premium modes, check if user has access
    if (mode.isPremium && !isPremium) {
      // Show upgrade prompt instead
      return
    }

    setExpandedMode(modeId)

    // Simulate loading for premium modes
    if (mode.isPremium && !analysisCache[modeId]) {
      setLoadingModes(prev => ({ ...prev, [modeId]: true }))
      
      // Simulate API call delay
      setTimeout(() => {
        setAnalysisCache(prev => ({ ...prev, [modeId]: generateAnalysis(modeId) }))
        setLoadingModes(prev => ({ ...prev, [modeId]: false }))
      }, 1500)
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">🤖 AI Analysis Modes</h3>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span className="text-sm font-medium text-purple-600">
            {isPremium ? '6 Modes Available' : '1 Free + 5 Premium'}
          </span>
        </div>
      </div>

      {modes.map(mode => {
        const IconComponent = mode.icon
        const isExpanded = expandedMode === mode.id
        const isLoading = loadingModes[mode.id]
        const canAccess = !mode.isPremium || isPremium
        const isLocked = mode.isPremium && !isPremium

        return (
          <div key={mode.id} className="glass-card overflow-hidden rounded-2xl transition-all duration-300">
            <button
              onClick={() => handleModeToggle(mode.id)}
              className="w-full p-4 text-left transition-all hover:bg-gray-50/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${mode.gradient}`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{mode.title}</h4>
                      {isLocked && <Lock className="h-4 w-4 text-gray-400" />}
                      {!mode.isPremium && <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">FREE</span>}
                    </div>
                    <p className="text-sm text-gray-600">{mode.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isLocked && (
                    <Link href="/upgrade">
                      <button className="gradient-premium rounded-lg px-3 py-1 text-xs font-medium text-white transition-all hover:scale-105">
                        Upgrade
                      </button>
                    </Link>
                  )}
                  {canAccess && (
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {!canAccess && (
                <div className="mt-3 glass-effect rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Lock className="h-4 w-4" />
                    <span>{mode.previewText}</span>
                  </div>
                </div>
              )}
            </button>

            {/* Expanded Content */}
            {isExpanded && canAccess && (
              <div className="border-t border-gray-100 bg-gray-50/30 p-4">
                {isLoading ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"></div>
                    <p className="text-sm text-gray-600">Analyzing your meal with AI...</p>
                  </div>
                ) : (
                  <div className="animate-fade-in-up">
                    {mode.fullAnalysis()}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Upgrade Prompt for Free Users */}
      {!isPremium && (
        <div className="glass-card gradient-premium overflow-hidden rounded-3xl p-6 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <Zap className="h-8 w-8 text-yellow-300" />
          </div>
          <h3 className="mb-2 text-xl font-bold">Unlock All 6 Analysis Modes!</h3>
          <p className="mb-4 text-sm opacity-90">
            Get fitness optimization, cultural insights, chef tips, scientific breakdowns, and budget analysis
          </p>
          <Link href="/upgrade">
            <button className="glass-effect rounded-xl border-2 border-white/30 bg-white/20 px-6 py-3 font-semibold backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/30">
              🚀 Upgrade to Premium
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}