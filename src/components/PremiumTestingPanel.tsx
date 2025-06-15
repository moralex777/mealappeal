'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Crown, Settings, ToggleRight, User, Zap } from 'lucide-react'
import { useState } from 'react'

interface PremiumTestingPanelProps {
  isVisible: boolean
  onToggle: () => void
}

export default function PremiumTestingPanel({ isVisible, onToggle }: PremiumTestingPanelProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)

  const currentTier = profile?.subscription_tier || 'free'

  const tiers = [
    { id: 'free', label: 'Free User', icon: User, color: 'text-gray-600' },
    { id: 'premium', label: 'Premium', icon: Crown, color: 'text-yellow-600' },
    { id: 'premium_monthly', label: 'Premium Monthly', icon: Zap, color: 'text-purple-600' },
  ]

  const handleTierSwitch = async (newTier: string) => {
    if (!user?.id || isUpdating) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: newTier,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating subscription tier:', error.message || error)
        alert(`Failed to update tier: ${error.message || 'Unknown error'}`)
      } else {
        await refreshProfile()
        console.log(`✅ Successfully switched to ${newTier}`)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const getFeaturePreview = (tier: string) => {
    switch (tier) {
      case 'free':
        return {
          features: ['Basic nutrition analysis', '14-day meal storage', '3 monthly shares'],
          limitations: 'Limited insights, no detailed analysis modes',
        }
      case 'premium_monthly':
        return {
          features: ['6 analysis modes', 'Unlimited storage', 'Advanced insights', 'Export features'],
          limitations: 'None - full access to all features',
        }
      case 'premium_yearly':
        return {
          features: ['All premium features', 'Priority support', 'Early access to new features'],
          limitations: 'None - full access + exclusive benefits',
        }
      default:
        return { features: [], limitations: '' }
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '2px solid rgba(139, 69, 19, 0.3)',
          borderRadius: '50%',
          padding: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        title="Open Premium Testing Panel"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <Settings style={{ width: '20px', height: '20px', color: '#8b4513' }} />
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onToggle}
      />

      {/* Panel */}
      <div className="fixed right-4 top-4 z-50 w-80 max-h-[80vh] overflow-y-auto glass-card rounded-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="gradient-text text-xl font-bold">🧪 Premium Testing</h2>
          <button
            onClick={onToggle}
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <ToggleRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-6 glass-effect rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2">
            {(() => {
              const currentTierData = tiers.find(t => t.id === currentTier)
              const IconComponent = currentTierData?.icon
              return IconComponent ? (
                <div className={currentTierData.color}>
                  <IconComponent className="h-5 w-5" />
                </div>
              ) : null
            })()}
            <span className="font-semibold text-gray-900">
              Current: {tiers.find(t => t.id === currentTier)?.label}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            User ID: {user?.id?.slice(0, 8)}...
          </p>
        </div>

        {/* Tier Switcher */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold text-gray-900">Switch Testing Tier</h3>
          <div className="space-y-2">
            {tiers.map(tier => {
              const IconComponent = tier.icon
              const isActive = tier.id === currentTier
              const preview = getFeaturePreview(tier.id)
              
              return (
                <div key={tier.id} className="space-y-2">
                  <button
                    onClick={() => handleTierSwitch(tier.id)}
                    disabled={isUpdating || isActive}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                      isActive
                        ? 'gradient-appetite text-white'
                        : 'glass-effect hover:bg-gray-50'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <IconComponent className={`h-5 w-5 ${isActive ? 'text-white' : tier.color}`} />
                    <div className="flex-1">
                      <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {tier.label}
                      </div>
                      {isActive && (
                        <div className="text-sm opacity-90">Currently Active</div>
                      )}
                    </div>
                    {isUpdating && isActive && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    )}
                  </button>

                  {/* Feature Preview */}
                  {isActive && (
                    <div className="ml-8 glass-effect rounded-lg p-3">
                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-900">Features:</div>
                        <ul className="text-xs text-gray-600">
                          {preview.features.map((feature, idx) => (
                            <li key={idx}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Limitations:</span> {preview.limitations}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Testing Scenarios */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold text-gray-900">Test Scenarios</h3>
          <div className="space-y-2 text-sm">
            <div className="glass-effect rounded-lg p-3">
              <div className="font-medium text-gray-900">🔍 Analysis Testing</div>
              <div className="text-gray-600">
                Test how analysis modes appear for each tier
              </div>
            </div>
            <div className="glass-effect rounded-lg p-3">
              <div className="font-medium text-gray-900">💎 Upgrade Prompts</div>
              <div className="text-gray-600">
                Verify conversion triggers show at right moments
              </div>
            </div>
            <div className="glass-effect rounded-lg p-3">
              <div className="font-medium text-gray-900">📱 Mobile Experience</div>
              <div className="text-gray-600">
                Test premium features on mobile devices
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={() => window.location.href = '/meals'}
            className="btn-primary w-full"
          >
            🍽️ Test Meals Page
          </button>
          <button
            onClick={() => window.location.href = '/camera'}
            className="btn-secondary w-full"
          >
            📸 Test Camera Flow
          </button>
          <button
            onClick={() => window.location.href = '/upgrade'}
            className="btn-success w-full"
          >
            👑 Test Upgrade Page
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          ⚠️ Development Mode Only - Changes affect UI behavior
        </div>
      </div>
    </>
  )
}