'use client'

import { Bell, CreditCard, Crown, LogOut, Shield, Star, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppLayout } from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AvatarUpload from '@/components/AvatarUpload'

interface IUserProfile {
  id: string
  email: string
  full_name: string
  subscription_tier: 'free' | 'premium_monthly' | 'premium_yearly'
  meal_count: number
  created_at: string
  subscription_expires_at?: string
  avatar_url?: string | null
}

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<IUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    loadProfile()
  }, [user])

  const loadProfile = async (retryCount = 0) => {
    
    if (!user?.id) {
      console.error('❌ Account: No user ID found')
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      setError(null)
      console.log('📊 Account: Querying profiles with user_id:', user.id)
      
      let { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
        
      // Fallback: If no data found, try querying by id column
      if (!data && !queryError) {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        data = result.data
        queryError = result.error
      }
      
      // No retry needed - Supabase handles session detection

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // No profile found - create default one
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,  // Add id field for compatibility
              user_id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'User',
              subscription_tier: 'free',
              meal_count: 0,
            })
            .select('*')
            .single()

          if (createError) {
            throw createError
          }
          
          setProfile({
            ...newProfile,
            email: user.email || '',
          })
        } else {
          throw queryError
        }
      } else if (data) {
        setProfile({
          ...data,
          email: user.email || '',
        })
      } else {
        console.error('❌ Account: No profile data found')
        setError('No profile data found')
      }
    } catch (err: any) {
      console.error('❌ Account: Error loading profile:', err)
      setError(err.message || 'Failed to load profile')
      // Don't leave user stuck - show error state
      setLoading(false)
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

  // Show login prompt if user is not authenticated
  if (!user && !loading) {
    return (
      <AppLayout>
        <div
          style={{
            minHeight: '100vh',
            background:
              'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '400px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              padding: '48px',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>🔒</div>
            <h2
              style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}
            >
              Login Required
            </h2>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
              Please log in to access your account settings
            </p>
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 12px 20px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.3)'
              }}
            >
              Log In
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              padding: '48px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                  margin: '0 auto 24px',
                  animation: 'pulse 2s infinite',
                }}
              />
              <div
                style={{
                  height: '24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                  marginBottom: '12px',
                  animation: 'pulse 2s infinite',
                }}
              />
              <div
                style={{
                  height: '16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                  marginBottom: '32px',
                  maxWidth: '300px',
                  margin: '0 auto 32px',
                  animation: 'pulse 2s infinite',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    style={{
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error only after loading is complete
  if (!loading && (error || !profile)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            padding: '48px',
            backdropFilter: 'blur(12px)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚠️</div>
          <h2
            style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}
          >
            Error Loading Account
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            {error || 'Unable to load your account information'}
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'linear-gradient(to right, #10b981, #ea580c)',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '16px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 12px 20px rgba(16, 185, 129, 0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  const isPremium =
    profile.subscription_tier === 'premium_monthly' ||
    profile.subscription_tier === 'premium_yearly'

  try {
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
      {/* Main Content */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '12px',
              background: 'linear-gradient(to right, #10b981, #ea580c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Account Settings
          </h1>
          <p style={{ fontSize: '20px', color: '#6b7280' }}>Manage your MealAppeal account 🍽️</p>
        </div>

        {/* Profile Card */}
        <div
          style={{
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              padding: '32px',
              background: isPremium
                ? 'linear-gradient(to right, #10b981, #ea580c)'
                : 'linear-gradient(to right, #6b7280, #4b5563)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <AvatarUpload 
                currentAvatarUrl={profile.avatar_url}
                onAvatarUpdate={(newUrl) => {
                  setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null)
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                    {profile.full_name}
                  </h2>
                  {isPremium && (
                    <Crown style={{ width: '24px', height: '24px', color: '#fde68a' }} />
                  )}
                </div>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '12px' }}>
                  {profile.email}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span
                    style={{
                      background: isPremium ? '#fde68a' : 'rgba(255, 255, 255, 0.2)',
                      color: isPremium ? '#854d0e' : 'white',
                      padding: '6px 16px',
                      borderRadius: '24px',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    {isPremium ? '👑 Premium' : 'Free'}
                  </span>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Member since {formatMemberSince(profile.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              padding: '32px',
              borderBottom: '1px solid #e5e7eb',
              background: 'white',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {profile.meal_count}
              </div>
              <div style={{ fontSize: '18px', color: '#6b7280' }}>Meals Analyzed</div>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Billing */}
          <button
            onClick={() => router.push('/account/billing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid transparent',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#10b981'
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditCard style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  Billing & Subscription
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  {isPremium ? 'Manage your premium subscription' : 'Upgrade to premium'}
                </p>
              </div>
            </div>
            <div style={{ color: '#6b7280', fontSize: '20px' }}>→</div>
          </button>

          {/* Notifications */}
          <button
            onClick={() => router.push('/account/notifications')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid transparent',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#3b82f6'
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  Notifications
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Manage your notification preferences
                </p>
              </div>
            </div>
            <div style={{ color: '#6b7280', fontSize: '20px' }}>→</div>
          </button>

          {/* Privacy */}
          <button
            onClick={() => router.push('/account/privacy')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid transparent',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#10b981'
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #10b981, #34d399)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  Privacy & Security
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Control your data and privacy settings
                </p>
              </div>
            </div>
            <div style={{ color: '#6b7280', fontSize: '20px' }}>→</div>
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid transparent',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ef4444'
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #ef4444, #f87171)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogOut style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  Sign Out
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Sign out of your MealAppeal account
                </p>
              </div>
            </div>
            <div style={{ color: '#6b7280', fontSize: '20px' }}>→</div>
          </button>
        </div>

        {/* Free User Upgrade Prompt */}
        {!isPremium && (
          <div
            style={{
              marginTop: '48px',
              borderRadius: '24px',
              background: 'linear-gradient(to right, #10b981, #ea580c)',
              padding: '32px',
              color: 'white',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }}
            ></div>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}
              >
                <Star style={{ width: '32px', height: '32px', color: '#fde68a' }} />
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  Upgrade to Premium 👑
                </h3>
              </div>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '24px' }}>
                Get unlimited meal storage, advanced nutrition analysis, and exclusive features!
              </p>
              <button
                onClick={() => router.push('/upgrade')}
                style={{
                  background: 'white',
                  color: '#10b981',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 12px 20px rgba(0, 0, 0, 0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.2)'
                }}
              >
                Upgrade Now - From $4.99/month
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
      </div>
    </AppLayout>
    )
  } catch (error) {
    console.error('❌ Account page render error:', error)
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>Error loading account page</h1>
        <p>Please try refreshing or <a href="/login">login again</a></p>
      </div>
    )
  }
}
