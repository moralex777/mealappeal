'use client'

// Enhanced MealAppeal Authentication Modal with Context7-powered improvements
// Implements latest Supabase Auth patterns and Next.js 14 best practices

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  X,
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'

interface IEnhancedAuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register' | 'reset'
  onSuccess?: () => void
}

type AuthMode = 'login' | 'register' | 'reset' | 'verify'

interface IAuthFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

export function EnhancedAuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccess,
}: IEnhancedAuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState<IAuthFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })

  // Create Supabase client for additional operations
  const supabase = createClientComponentClient()

  // Reset form when mode changes
  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    })
    setError(null)
    setSuccess(null)
  }, [mode])

  // Form validation
  const validateForm = useCallback((): string | null => {
    const { email, password, confirmPassword, fullName } = formData

    if (!email.trim()) {
      return 'Email is required'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email'
    }

    if (mode === 'reset') {
      return null
    } // Only email needed for reset

    if (!password) {
      return 'Password is required'
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        return 'Full name is required'
      }
      if (password !== confirmPassword) {
        return 'Passwords do not match'
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return 'Password must contain uppercase, lowercase, and number'
      }
    }

    return null
  }, [formData, mode])

  // Handle form submission with enhanced error handling
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        return
      }

      setLoading(true)
      setError(null)

      try {
        switch (mode) {
          case 'login': {
            const { error: loginError } = await signIn(formData.email, formData.password)
            if (loginError) {
              // Enhanced error messages based on Supabase error codes
              switch (loginError.message) {
                case 'Invalid login credentials':
                  setError('Incorrect email or password. Please check and try again.')
                  break
                case 'Email not confirmed':
                  setError('Please check your email and click the confirmation link.')
                  break
                case 'Too many requests':
                  setError('Too many login attempts. Please wait a moment and try again.')
                  break
                default:
                  setError(loginError.message || 'Login failed. Please try again.')
              }
              return
            }

            setSuccess('Welcome back! 🎉')
            setTimeout(() => {
              onSuccess?.()
              onClose()
            }, 1000)
            break
          }

          case 'register': {
            const { error: signUpError } = await signUp(formData.email, formData.password, formData.fullName)
            if (signUpError) {
              switch (signUpError.message) {
                case 'User already registered':
                  setError('An account with this email already exists. Try logging in instead.')
                  break
                case 'Password should be at least 6 characters':
                  setError('Password must be at least 8 characters long.')
                  break
                default:
                  setError(signUpError.message || 'Registration failed. Please try again.')
              }
              return
            }

            // Create user profile with proper error handling
            const { error: profileError } = await supabase.from('profiles').upsert({
              email: formData.email,
              full_name: formData.fullName,
              subscription_tier: 'free',
              subscription_status: 'inactive',
              meal_count: 0,
              monthly_shares_used: 0,
              share_reset_date: new Date().toISOString(),
            })

            if (profileError) {
              console.error('Profile creation error:', profileError)
              // Continue anyway as the user is created
            }

            setMode('verify')
            setSuccess('Account created! Please check your email to verify your account. 📧')
            break
          }

          case 'reset': {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
              formData.email,
              {
                redirectTo: `${window.location.origin}/auth/reset-password`,
              }
            )

            if (resetError) {
              setError(resetError.message || 'Password reset failed. Please try again.')
              return
            }

            setSuccess('Password reset email sent! Check your inbox. 📧')
            setTimeout(() => {
              setMode('login')
            }, 3000)
            break
          }
        }
      } catch (err) {
        console.error('Auth error:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [formData, mode, signIn, signUp, supabase, onSuccess, onClose, validateForm]
  )

  // Handle input changes
  const handleInputChange = useCallback((field: keyof IAuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null) // Clear error when user starts typing
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in slide-in-from-bottom-4 w-full max-w-md rounded-2xl bg-white shadow-2xl duration-300">
        {/* Header */}
        <div className="from-brand-500 relative rounded-t-2xl bg-gradient-to-r to-orange-500 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 transition-colors hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-2 flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">MealAppeal</h1>
          </div>

          <p className="text-sm text-white/90">
            {mode === 'login' && 'Welcome back to your food journey 🍽️'}
            {mode === 'register' && 'Start your food journey with MealAppeal 🚀'}
            {mode === 'reset' && 'Reset your password 🔒'}
            {mode === 'verify' && 'Check your email 📧'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {mode !== 'verify' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 focus:ring-2 focus:outline-none"
                    placeholder="your@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Full Name Field (Register only) */}
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={e => handleInputChange('fullName', e.target.value)}
                      className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 focus:ring-2 focus:outline-none"
                      placeholder="Your full name"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              {mode !== 'reset' && (
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => handleInputChange('password', e.target.value)}
                      className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-gray-300 py-3 pr-12 pl-10 focus:ring-2 focus:outline-none"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password Field (Register only) */}
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={e => handleInputChange('confirmPassword', e.target.value)}
                      className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-gray-300 py-3 pr-12 pl-10 focus:ring-2 focus:outline-none"
                      placeholder="Confirm your password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="from-brand-500 hover:from-brand-600 focus:ring-brand-500/20 w-full rounded-lg bg-gradient-to-r to-orange-500 px-4 py-3 font-medium text-white transition-all duration-200 hover:to-orange-600 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {mode === 'login' && 'Signing In...'}
                    {mode === 'register' && 'Creating Account...'}
                    {mode === 'reset' && 'Sending Reset Email...'}
                  </div>
                ) : (
                  <>
                    {mode === 'login' && 'Sign In to MealAppeal'}
                    {mode === 'register' && 'Create Account'}
                    {mode === 'reset' && 'Send Reset Email'}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode Switching */}
          <div className="mt-6 space-y-2 text-center">
            {mode === 'login' && (
              <>
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Sign up here
                  </button>
                </p>
                <p className="text-sm text-gray-600">
                  Forgot your password?{' '}
                  <button
                    onClick={() => setMode('reset')}
                    className="text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Reset it
                  </button>
                </p>
              </>
            )}

            {mode === 'register' && (
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-brand-600 hover:text-brand-700 font-medium"
                >
                  Sign in here
                </button>
              </p>
            )}

            {(mode === 'reset' || mode === 'verify') && (
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-brand-600 hover:text-brand-700 font-medium"
                >
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
