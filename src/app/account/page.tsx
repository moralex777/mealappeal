'use client'

import { Bell, CreditCard, Crown, LogOut, Shield, Star, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'

interface IUserProfile {
  id: string
  email: string
  full_name: string
  subscription_tier: 'free' | 'premium'
  meal_count: number
  created_at: string
  subscription_expires_at?: string
}

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<IUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadProfile()
  }, [user, router])

  const loadProfile = async () => {
    try {
      // Use imported supabase client directly
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (error) {
        throw error
      }
      setProfile(data)
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatMemberSince = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })

  if (loading) {
    return (
      <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="animate-pulse">
              <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gray-200"></div>
              <div className="mb-2 h-6 rounded bg-gray-200"></div>
              <div className="mb-8 h-4 rounded bg-gray-200"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 rounded bg-gray-200"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="from-brand-50 flex min-h-screen items-center justify-center bg-gradient-to-br to-orange-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-red-500">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Error Loading Account</h2>
          <p className="mb-4 text-gray-600">{error || 'Unable to load your account information'}</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Return Home
          </button>
        </div>
      </div>
    )
  }

  const isPremium = profile.subscription_tier === 'premium'

  return (
    <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600">Manage your MealAppeal account 🍽️</p>
        </div>

        {/* Profile Card */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div
            className={`p-6 ${isPremium ? 'from-brand-500 bg-gradient-to-r to-orange-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}
          >
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
                  {isPremium && <Crown className="h-5 w-5 text-yellow-300" />}
                </div>
                <p className="text-white/80">{profile.email}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isPremium ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'
                    }`}
                  >
                    {isPremium ? '👑 Premium' : 'Free'}
                  </span>
                  <span className="text-sm text-white/80">
                    Member since {formatMemberSince(profile.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="border-b border-gray-100 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-brand-600 text-2xl font-bold">{profile.meal_count}</div>
                <div className="text-sm text-gray-600">Meals Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {isPremium ? '∞' : Math.max(0, 3 - (profile.meal_count % 30))}
                </div>
                <div className="text-sm text-gray-600">
                  {isPremium ? 'Unlimited Shares' : 'Shares Remaining'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="space-y-3">
          {/* Billing */}
          <button
            onClick={() => router.push('/account/billing')}
            className="hover:border-brand-200 group flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-brand-100 group-hover:bg-brand-200 flex h-10 w-10 items-center justify-center rounded-full transition-colors">
                <CreditCard className="text-brand-600 h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Billing & Subscription</h3>
                <p className="text-sm text-gray-600">
                  {isPremium ? 'Manage your premium subscription' : 'Upgrade to premium'}
                </p>
              </div>
            </div>
            <div className="group-hover:text-brand-500 text-gray-400 transition-colors">→</div>
          </button>

          {/* Notifications */}
          <button
            onClick={() => router.push('/account/notifications')}
            className="hover:border-brand-200 group flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 transition-colors group-hover:bg-blue-200">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">Manage your notification preferences</p>
              </div>
            </div>
            <div className="group-hover:text-brand-500 text-gray-400 transition-colors">→</div>
          </button>

          {/* Privacy */}
          <button
            onClick={() => router.push('/account/privacy')}
            className="hover:border-brand-200 group flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 transition-colors group-hover:bg-green-200">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Privacy & Security</h3>
                <p className="text-sm text-gray-600">Control your data and privacy settings</p>
              </div>
            </div>
            <div className="group-hover:text-brand-500 text-gray-400 transition-colors">→</div>
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="group flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-red-200 hover:shadow-md"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 transition-colors group-hover:bg-red-200">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Sign Out</h3>
                <p className="text-sm text-gray-600">Sign out of your MealAppeal account</p>
              </div>
            </div>
            <div className="text-gray-400 transition-colors group-hover:text-red-500">→</div>
          </button>
        </div>

        {/* Free User Upgrade Prompt */}
        {!isPremium && (
          <div className="from-brand-500 mt-8 rounded-2xl bg-gradient-to-r to-orange-500 p-6 text-white">
            <div className="mb-3 flex items-center space-x-3">
              <Star className="h-6 w-6 text-yellow-300" />
              <h3 className="text-lg font-bold">Upgrade to Premium 👑</h3>
            </div>
            <p className="mb-4 text-white/90">
              Get unlimited meal storage, advanced nutrition analysis, and exclusive features!
            </p>
            <button
              onClick={() => router.push('/upgrade')}
              className="text-brand-600 rounded-xl bg-white px-6 py-2 font-semibold transition-colors hover:bg-gray-50"
            >
              Upgrade Now - $4.99/month
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
