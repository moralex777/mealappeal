'use client'

import { Camera, Crown, Eye, EyeOff, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppLayout } from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [hasInteracted, setHasInteracted] = useState(false)
  const [lastInteractionTime, setLastInteractionTime] = useState<number>(0)
  const [submitAttempts, setSubmitAttempts] = useState(0)

  // Redirect if user is already logged in - DISABLED for now
  // Users should manually click login
  useEffect(() => {
    // Commented out to prevent auto-redirect
    // if (user && !loading) {
    //   router.push('/account')
    // }
    
    // Debug: Log if user is already authenticated on page load
    if (user && !loading) {
      console.log('🔍 User already authenticated on login page load:', user.email)
      console.log('🔍 Not auto-redirecting - user must manually click login')
    }
  }, [user, router, loading])

  const handleForgotPassword = () => {
    router.push('/forgot-password')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const submitTime = Date.now()
    const timeSinceLastInteraction = submitTime - lastInteractionTime
    setSubmitAttempts(prev => prev + 1)
    
    console.log('🔍 Login form submission attempt:', {
      isTrusted: e.isTrusted,
      hasInteracted,
      timeSinceLastInteraction,
      submitAttempts: submitAttempts + 1,
      formData: { email: formData.email, passwordLength: formData.password.length }
    })
    
    // Enhanced validation for genuine user interaction
    if (!e.isTrusted) {
      console.log('❌ Prevented non-trusted submit event')
      return
    }
    
    if (!hasInteracted) {
      console.log('❌ Prevented submit without user interaction')
      return
    }
    
    // Require recent interaction (within last 30 seconds)
    if (timeSinceLastInteraction > 30000) {
      console.log('❌ Prevented submit - interaction too old:', timeSinceLastInteraction + 'ms')
      setError('Please interact with the form again before submitting')
      return
    }
    
    // Prevent rapid successive submissions
    if (submitAttempts > 3) {
      console.log('❌ Prevented submit - too many attempts')
      setError('Too many submission attempts. Please refresh the page.')
      return
    }
    
    setError(null)
    setLoading(true)
    
    try {
      if (!formData.email.trim()) {
        setError('Please enter your email address')
        setLoading(false)
        return
      }
      if (!formData.password) {
        setError('Please enter your password')
        setLoading(false)
        return
      }
      
      // Attempt login with Supabase
      const normalizedEmail = formData.email.toLowerCase().trim()
      console.log('🔐 Attempting login for:', normalizedEmail)
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      })
      
      if (authError) {
        if (authError.message.toLowerCase().includes('invalid')) {
          setError('Invalid email or password')
        } else if (authError.message.toLowerCase().includes('network')) {
          setError('Connection error, please try again')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }
      
      // Check if we have a valid session
      if (authData?.session) {
        console.log('✅ Login successful - redirecting immediately', {
          email: normalizedEmail,
          sessionId: authData.session.access_token.slice(0, 20) + '...',
          hasInteracted,
          timeSinceLastInteraction,
          submitAttempts: submitAttempts + 1
        })
        
        // Redirect using Next.js router to maintain auth state
        router.push('/account')
      } else {
        setError('Login failed. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

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
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 24px',
        }}
      >
        {/* Welcome Section */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}
        >
          <h2
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '24px',
              lineHeight: '1.2',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Welcome Back!
            </span>
            <span
              style={{ display: 'block', fontSize: '28px', color: '#6b7280', marginTop: '12px' }}
            >
              Continue your food journey and unlock new insights 🌟
            </span>
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6',
            }}
          >
            Log in to access your personalized nutrition dashboard, track your meals, and discover
            premium features!
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            maxWidth: '560px',
            margin: '0 auto',
            gap: '32px',
          }}
        >
          {/* Login Form Card */}
          <div
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              padding: '48px 40px',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Error Message */}
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid #ef4444',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '24px',
                  color: '#dc2626',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} autoComplete="off" data-form="login">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label
                    htmlFor="email"
                    style={{
                      fontWeight: 600,
                      color: '#1f2937',
                      marginBottom: '8px',
                      display: 'block',
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                      setHasInteracted(true)
                      setLastInteractionTime(Date.now())
                      console.log('🔍 User typing in email field')
                    }}
                    autoComplete="off"
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
                      background: 'white',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#10b981'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = error ? '#ef4444' : '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    required
                    autoComplete="off"
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <label
                    htmlFor="password"
                    style={{
                      fontWeight: 600,
                      color: '#1f2937',
                      marginBottom: '8px',
                      display: 'block',
                    }}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, password: e.target.value }))
                      setHasInteracted(true)
                      setLastInteractionTime(Date.now())
                      console.log('🔍 User typing in password field')
                    }}
                    style={{
                      width: '100%',
                      padding: '16px 56px 16px 20px',
                      borderRadius: '16px',
                      border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
                      background: 'white',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#10b981'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = error ? '#ef4444' : '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8b5cf6',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '15px',
                      padding: 0,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#ea580c'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#8b5cf6'
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  onClick={(e) => {
                    setHasInteracted(true)
                    setLastInteractionTime(Date.now())
                    console.log('🔍 User clicked Sign In button', {
                      isTrusted: e.isTrusted,
                      timestamp: Date.now()
                    })
                  }}
                  style={{
                    width: '100%',
                    padding: '20px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(to right, #a21caf, #ec4899)',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 15px rgba(168, 34, 202, 0.2)',
                    marginBottom: '8px',
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'scale(1.02)'
                      e.currentTarget.style.boxShadow = '0 12px 20px rgba(236, 72, 153, 0.3)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 8px 15px rgba(168, 34, 202, 0.2)'
                  }}
                >
                  {loading ? (
                    <span>
                      <span
                        className="loading-spinner"
                        style={{ marginRight: 8, verticalAlign: 'middle' }}
                      />
                      Logging in...
                    </span>
                  ) : (
                    'Log In'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Premium Reminder Card */}
          <div
            style={{
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
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
              >
                <Crown style={{ width: '32px', height: '32px', color: '#fde68a' }} />
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  🚀 Ready to supercharge your experience?
                </h3>
              </div>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '24px' }}>
                Unlock unlimited storage, advanced analysis, and exclusive features for just{' '}
                <b>$4.99/month</b> or <b>$49.99/year</b> (Save 17%!)
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    padding: '16px',
                    textAlign: 'center',
                    backdropFilter: 'blur(8px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
                    $4.99
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                    per month
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    • Unlimited storage
                    <br />• Advanced insights
                  </div>
                </div>
                <div
                  style={{
                    background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                    borderRadius: '16px',
                    padding: '16px',
                    textAlign: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '10px',
                      background: '#dc2626',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    Save 17%!
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
                    $49.99
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>per year 🎉</div>
                  <div style={{ fontSize: '12px' }}>
                    • All premium features
                    <br />• Exclusive beta access
                  </div>
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  opacity: 0.9,
                  marginBottom: '12px',
                }}
              >
                ✨ You can upgrade after logging in
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>Unlimited Meals</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>Smart Analysis</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>6 Analysis Modes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>Priority Support</span>
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginTop: '16px',
                }}
              >
                Start your nutrition journey! 🌟
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  )
}
