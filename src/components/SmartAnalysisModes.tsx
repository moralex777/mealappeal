'use client'

import { useAuth } from '@/contexts/AuthContext'
import {
  Activity,
  Brain,
  ChefHat,
  ChevronRight,
  DollarSign,
  Lock,
  Microscope,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

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

interface SmartAnalysisModesProps {
  meal: IMeal
  className?: string
}

export default function SmartAnalysisModes({ meal, className = '' }: SmartAnalysisModesProps) {
  const { profile } = useAuth()
  const [expandedMode, setExpandedMode] = useState<string | null>(null)
  const [analysisCache, setAnalysisCache] = useState<Record<string, any>>({})
  const [loadingModes, setLoadingModes] = useState<Record<string, boolean>>({})

  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'premium_monthly'

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
      description: 'Comprehensive nutritional assessment',
      icon: () => <span style={{ fontSize: '24px' }}>🪷</span>,
      color: 'text-purple-500',
      gradient: 'from-purple-400 to-green-400',
      isPremium: false,
      previewText: 'Basic nutrition info • Health score available • USDA enhanced for premium',
      fullAnalysis: () => {
        const analysis = generateAnalysis('health')
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Health Assessment</h4>
                {isPremium && (
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    color: '#059669', 
                    background: '#dcfce7', 
                    padding: '2px 6px', 
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    USDA ENHANCED
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#059669' }}>Health Score: {analysis.healthScore}/100</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {analysis.micronutrients?.map((nutrient: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{nutrient.name}</div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: nutrient.color.includes('orange') ? '#ea580c' 
                          : nutrient.color.includes('red') ? '#dc2626'
                          : nutrient.color.includes('blue') ? '#2563eb'
                          : '#9333ea'
                  }}>{nutrient.amount}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{nutrient.daily}% DV</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: 0 }}>Health Insights</h5>
              {analysis.healthInsights?.map((insight: string, idx: number) => (
                <div key={idx} style={{ fontSize: '14px', color: '#374151' }}>{insight}</div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Fitness Analysis</h4>
              <div
                style={{
                  borderRadius: '50px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#2563eb' }}>{analysis.workoutAlignment}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {Object.entries(analysis.performanceMetrics || {}).map(([key, value]: [string, any]) => (
                <div
                  key={key}
                  style={{
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', textTransform: 'capitalize', marginBottom: '8px' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '50px', height: '8px' }}>
                      <div
                        style={{
                          height: '8px',
                          borderRadius: '50px',
                          background: 'linear-gradient(to right, #60a5fa, #2563eb)',
                          width: `${value}%`,
                          transition: 'width 0.5s ease',
                        }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb' }}>{value}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: 0 }}>Performance Insights</h5>
              {analysis.fitnessInsights?.map((insight: string, idx: number) => (
                <div key={idx} style={{ fontSize: '14px', color: '#374151' }}>{insight}</div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Cultural Heritage</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy style={{ width: '16px', height: '16px', color: '#a855f7' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#9333ea' }}>Score: {analysis.culturalScore}/100</span>
              </div>
            </div>

            <div
              style={{
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              }}
            >
              <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: '0 0 8px 0' }}>Origin</h5>
              <p style={{ color: '#9333ea', fontWeight: '600', margin: '0 0 8px 0' }}>{analysis.origin}</p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{analysis.culturalBackground}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: 0 }}>Traditional Benefits</h5>
              {analysis.traditionalBenefits?.map((benefit: string, idx: number) => (
                <div key={idx} style={{ fontSize: '14px', color: '#374151' }}>{benefit}</div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Culinary Analysis</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChefHat style={{ width: '16px', height: '16px', color: '#f97316' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#ea580c' }}>Plating: {analysis.platingScore}/100</span>
              </div>
            </div>

            <div
              style={{
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              }}
            >
              <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: '0 0 8px 0' }}>Cooking Technique</h5>
              <p style={{ color: '#ea580c', fontWeight: '600', margin: 0 }}>{analysis.technique}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: '0 0 8px 0' }}>Culinary Insights</h5>
                {analysis.culinaryInsights?.map((insight: string, idx: number) => (
                  <div key={idx} style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>{insight}</div>
                ))}
              </div>

              <div>
                <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: '0 0 8px 0' }}>Enhancement Tips</h5>
                {analysis.improvementTips?.map((tip: string, idx: number) => (
                  <div key={idx} style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>💡 {tip}</div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Scientific Analysis</h4>
                {isPremium && (
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    color: '#059669', 
                    background: '#dcfce7', 
                    padding: '2px 6px', 
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    USDA ENHANCED
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Microscope style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#059669' }}>Molecular Profile</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                style={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                }}
              >
                <h6 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: '0 0 8px 0' }}>Macro Ratio</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Protein</span>
                    <span style={{ fontWeight: '500' }}>{analysis.molecularBreakdown?.macroRatio?.protein || 0}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Carbs</span>
                    <span style={{ fontWeight: '500' }}>{analysis.molecularBreakdown?.macroRatio?.carbs || 0}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Fat</span>
                    <span style={{ fontWeight: '500' }}>{analysis.molecularBreakdown?.macroRatio?.fat || 0}%</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                }}
              >
                <h6 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: '0 0 8px 0' }}>Metabolic Impact</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                  <div>GI: {analysis.molecularBreakdown?.glycemicImpact || 'N/A'}</div>
                  <div>Oxidative: {analysis.molecularBreakdown?.oxidativeStress || 'N/A'}</div>
                  <div>Absorption: {analysis.molecularBreakdown?.bioavailability || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: 0 }}>Biochemical Insights</h5>
              {analysis.biochemistry?.map((insight: string, idx: number) => (
                <div key={idx} style={{ fontSize: '14px', color: '#374151' }}>{insight}</div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Budget Analysis</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign style={{ width: '16px', height: '16px', color: '#eab308' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#ca8a04' }}>{analysis.costAnalysis?.nutritionValue} Value</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                style={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>Estimated Cost</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ca8a04' }}>{analysis.costAnalysis?.estimatedCost || 'N/A'}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{analysis.costAnalysis?.costPerCalorie || 'N/A'} per calorie</div>
              </div>

              <div
                style={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '8px' }}>Seasonal Score</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '50px', height: '8px' }}>
                    <div
                      style={{
                        height: '8px',
                        borderRadius: '50px',
                        background: 'linear-gradient(to right, #fbbf24, #eab308)',
                        width: `${analysis.costAnalysis?.seasonalScore || 0}%`,
                        transition: 'width 0.5s ease',
                      }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ca8a04' }}>{analysis.costAnalysis?.seasonalScore || 0}%</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: 0 }}>Money-Saving Tips</h5>
              {analysis.savingTips?.map((tip: string, idx: number) => (
                <div key={idx} style={{ fontSize: '14px', color: '#374151' }}>{tip}</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>✨ Deep Insights</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles style={{ width: '20px', height: '20px', color: '#a855f7' }} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#9333ea' }}>
            {isPremium ? '6 Analysis Modes Available' : '1 Free + 5 Premium'}
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
          <div
            key={mode.id}
            style={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <button
              onClick={() => handleModeToggle(mode.id)}
              style={{
                width: '100%',
                padding: '20px',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                if (!isLocked) {
                  e.currentTarget.style.background = 'rgba(249, 250, 251, 0.5)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      width: '48px',
                      height: '48px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '16px',
                      background: mode.id === 'health' 
                        ? 'linear-gradient(to bottom right, #a855f7, #22c55e)'
                        : mode.id === 'fitness'
                        ? 'linear-gradient(to bottom right, #3b82f6, #06b6d4)'
                        : mode.id === 'cultural'
                        ? 'linear-gradient(to bottom right, #a855f7, #6366f1)'
                        : mode.id === 'chef'
                        ? 'linear-gradient(to bottom right, #f97316, #ef4444)'
                        : mode.id === 'science'
                        ? 'linear-gradient(to bottom right, #22c55e, #10b981)'
                        : 'linear-gradient(to bottom right, #eab308, #f97316)',
                      boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{mode.title}</h4>
                      {isLocked && <Lock style={{ width: '16px', height: '16px', color: '#9ca3af' }} />}
                      {!mode.isPremium && (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#059669',
                            background: '#dcfce7',
                            padding: '4px 8px',
                            borderRadius: '50px',
                          }}
                        >
                          FREE
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{mode.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isLocked && (
                    <Link href="/upgrade">
                      <div
                        style={{
                          background: 'linear-gradient(to right, #9333ea, #ec4899)',
                          borderRadius: '12px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'white',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          boxShadow: '0 4px 8px rgba(147, 51, 234, 0.3)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 6px 12px rgba(147, 51, 234, 0.4)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(147, 51, 234, 0.3)'
                        }}
                      >
                        Upgrade
                      </div>
                    </Link>
                  )}
                  {canAccess && (
                    <div
                      style={{
                        transition: 'transform 0.3s ease',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}
                    >
                      <ChevronRight style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
                    </div>
                  )}
                </div>
              </div>

              {!canAccess && (
                <div
                  style={{
                    marginTop: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(8px)',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                    <Lock style={{ width: '16px', height: '16px' }} />
                    <span>{mode.previewText}</span>
                  </div>
                </div>
              )}
            </button>

            {/* Expanded Content with Smooth Animation */}
            {isExpanded && canAccess && (
              <div
                style={{
                  borderTop: '1px solid rgba(229, 231, 235, 0.5)',
                  background: 'rgba(249, 250, 251, 0.3)',
                  padding: '24px',
                  animation: 'expandDown 0.4s ease-out',
                  overflow: 'hidden',
                }}
              >
                {isLoading ? (
                  <div style={{ padding: '32px 0', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        margin: '0 auto 16px',
                        border: '3px solid #e5e7eb',
                        borderTop: '3px solid #9333ea',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Generating deep insights...</p>
                  </div>
                ) : (
                  <div
                    style={{
                      animation: 'fadeInUp 0.5s ease-out',
                    }}
                  >
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
        <div
          style={{
            borderRadius: '24px',
            background: 'linear-gradient(to right, #9333ea, #ec4899)',
            overflow: 'hidden',
            padding: '32px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Zap style={{ width: '32px', height: '32px', color: '#fbbf24' }} />
          </div>
          <h3 style={{ marginBottom: '8px', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Unlock All 6 Deep Insights!
          </h3>
          <p style={{ marginBottom: '24px', fontSize: '16px', opacity: 0.9, margin: '0 0 24px 0' }}>
            Get fitness optimization, cultural insights, chef tips, scientific breakdowns, and budget analysis
          </p>
          <Link href="/upgrade">
            <div
              style={{
                borderRadius: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(12px)',
                padding: '16px 24px',
                fontSize: '18px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                display: 'inline-block',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }}
            >
              🚀 Upgrade to Premium
            </div>
          </Link>
        </div>
      )}
      
      {/* Animation Styles */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes expandDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 1000px;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}