'use client'

// MealAppeal Authentication Modal
// Action 029: Login/Register UI with MealAppeal branding

import { Camera, Eye, EyeOff, Loader2, Lock, Mail, User, X } from 'lucide-react'
import React, { useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'

interface IAuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: IAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp, resetPassword } = useAuth()

  // Reset form when mode changes
  React.useEffect(() => {
    setError('')
    setSuccess('')
    setPassword('')
    if (mode !== 'register') {
      setFullName('')
    }
  }, [mode])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      switch (mode) {
        case 'login':
          const { error: loginError } = await signIn(email, password)
          if (loginError) {
            setError(loginError.message)
          } else {
            setSuccess('Login successful! Redirecting...')
            setTimeout(() => {
              onClose()
            }, 500)
          }
          break

        case 'register':
          if (!fullName.trim()) {
            setError('Please enter your full name')
            break
          }
          const { error: signUpError } = await signUp(email, password, fullName)
          if (signUpError) {
            setError(signUpError.message)
          } else {
            setSuccess('Check your email to confirm your account!')
          }
          break

        case 'reset':
          const { error: resetError } = await resetPassword(email)
          if (resetError) {
            setError(resetError.message)
          } else {
            setSuccess('Password reset email sent! Check your inbox.')
          }
          break
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
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
            {mode === 'login' && 'Welcome back to your food journey'}
            {mode === 'register' && 'Join the MealAppeal community'}
            {mode === 'reset' && 'Reset your password'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="focus:ring-brand-500 w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 transition-colors focus:border-transparent focus:ring-2"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="focus:ring-brand-500 w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 transition-colors focus:border-transparent focus:ring-2"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password (not for reset) */}
            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative" suppressHydrationWarning>
                  <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="focus:ring-brand-500 w-full rounded-lg border border-gray-300 py-3 pr-12 pl-10 transition-colors focus:border-transparent focus:ring-2"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {mode === 'register' && (
                  <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="from-brand-500 hover:from-brand-600 flex w-full items-center justify-center space-x-2 rounded-lg bg-gradient-to-r to-orange-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              <span>
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Log In'
                    : mode === 'register'
                      ? 'Create Account'
                      : 'Send Reset Email'}
              </span>
            </button>
          </form>

          {/* Mode Switching */}
          <div className="mt-6 space-y-2 text-center">
            {mode === 'login' && (
              <>
                <p className="text-sm">
                  <button
                    onClick={() => setMode('reset')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Forgot your password?
                  </button>
                </p>
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Sign up here
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
                  Log in here
                </button>
              </p>
            )}

            {mode === 'reset' && (
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-brand-600 hover:text-brand-700 font-medium"
                >
                  Back to login
                </button>
              </p>
            )}
          </div>

          {/* Benefits (Register mode) */}
          {mode === 'register' && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">🎉 What you&apos;ll get:</h3>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>Instant food analysis from photos</li>
                <li>Detailed nutrition insights</li>
                <li>Share meals with the community</li>
                <li>Track your food journey</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
