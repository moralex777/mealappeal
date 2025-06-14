'use client'

import { Camera, Crown, Eye, EyeOff, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Navigation } from '@/components/Navigation'

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

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/account')
    }
  }, [user, router])

  const handleForgotPassword = () => {
    router.push('/forgot-password')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
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
        // Wait a moment for auth state to propagate
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Success: redirect to account page
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
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Navigation />
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Camera style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <h1
                style={{
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  margin: 0,
                }}
              >
                MealAppeal
              </h1>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#6b7280', fontSize: '16px' }}>
                Don&apos;t have an account?
              </span>
              <Link
                href="/signup"
                style={{
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  fontWeight: '600',
                  color: 'white',
                  textDecoration: 'none',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'inline-block',
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
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

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
            <form onSubmit={handleSubmit}>
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
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
                    <br />• Advanced analysis
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
                  <span style={{ fontSize: '14px' }}>Advanced AI</span>
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
  )
}
