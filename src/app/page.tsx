'use client'

import { Camera, Sparkles, Users, History, Crown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const { user, profile, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-50">
      {/* Header */}
      <header className="container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">MealAppeal</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-sm text-muted-foreground">
                  Welcome, {profile?.full_name || 'User'}!
                  {profile?.subscription_tier === 'premium' && (
                    <span className="ml-2 text-yellow-600 font-medium flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      Premium
                    </span>
                  )}
                </div>
                <Link 
                  href="/meals"
                  className="bg-brand-100 text-brand-700 px-4 py-2 rounded-lg hover:bg-brand-200 flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  My Meals
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Please sign in to access meal tracking
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-6xl font-bold text-balance">
              AI-Powered
              <span className="gradient-text block">Food Analysis</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Transform your food photos into detailed nutrition insights and connect with a community of food lovers.
            </p>
          </div>

          {/* User Status Dashboard - IMPROVED LAYOUT */}
          {user && profile && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto mb-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-6 text-center">Your MealAppeal Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-brand-50 to-brand-100 rounded-xl">
                  <span className="font-medium text-gray-700">Meals Analyzed:</span>
                  <span className="font-bold text-brand-600 text-lg">{profile.meal_count || 0}</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                  <span className="font-medium text-gray-700">Monthly Shares:</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {profile.subscription_tier === 'premium' ? '∞' : `${profile.monthly_shares_used || 0}/3`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                  <span className="font-medium text-gray-700">Days Storage:</span>
                  <span className="font-bold text-purple-600 text-lg">
                    {profile.subscription_tier === 'premium' ? '∞' : '14'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <span className="font-medium text-gray-700">Account Tier:</span>
                  <span className={`font-bold text-lg ${profile.subscription_tier === 'premium' ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {profile.subscription_tier === 'premium' ? 'PREMIUM' : 'FREE'}
                    {profile.subscription_tier === 'premium' && (
                      <span className="ml-2">👑</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/camera"
              className="bg-brand-500 text-white px-8 py-4 rounded-xl hover:bg-brand-600 flex items-center gap-3 text-lg font-semibold"
            >
              <Camera className="w-6 h-6" />
              📸 Analyze Your Meal
            </Link>
            
            {user && (
              <Link 
                href="/meals"
                className="bg-white/80 text-brand-700 px-8 py-4 rounded-xl hover:bg-white border border-brand-200 flex items-center gap-3 text-lg font-semibold"
              >
                <History className="w-6 h-6" />
                View My Meals
              </Link>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="glass-effect rounded-2xl p-8 space-y-4">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold">Smart Camera</h3>
              <p className="text-muted-foreground">
                Capture your meals with our optimized camera system designed for food photography.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-8 space-y-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold">AI Analysis</h3>
              <p className="text-muted-foreground">
                Get instant nutrition breakdowns and ingredient identification powered by advanced AI.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-8 space-y-4">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold">Meal History</h3>
              <p className="text-muted-foreground">
                Track your nutrition journey with personal meal history and smart insights.
              </p>
            </div>
          </div>

          {/* Development Status */}
          <div className="mt-20 p-8 bg-white/50 rounded-2xl border border-white/20">
            <h3 className="text-2xl font-semibold mb-4">Development Status</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-brand-600">✅ Foundation</div>
                <div className="text-muted-foreground">Next.js + TypeScript + Tailwind</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-brand-600">✅ Authentication</div>
                <div className="text-muted-foreground">User system working</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-brand-600">✅ AI Analysis</div>
                <div className="text-muted-foreground">OpenAI integration complete</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-orange-600">🚀 Focus Modes</div>
                <div className="text-muted-foreground">Revolutionary analysis system</div>
              </div>
            </div>
          </div>

          {/* Domain Info */}
          <div className="mt-8 p-4 bg-gradient-to-r from-brand-500 to-orange-500 rounded-xl text-white">
            <p className="font-medium">🚀 Coming Soon: www.MealAppeal.app</p>
            <p className="text-sm opacity-90 mt-1">Contact: fit@MealAppeal.app</p>
          </div>
        </div>
      </main>
    </div>
  )
}