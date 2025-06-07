'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Chrome, Crown, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof LoginSchema>

interface ILoginCardProps {
  onForgotPassword?: () => void
  onSignUp?: () => void
  onGoogleSignIn?: () => void
}

export function LoginCard({ onForgotPassword, onSignUp, onGoogleSignIn }: ILoginCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)

    try {
      // TODO: Integrate with actual authentication API
      console.log('Login data:', data)

      // Simulate API call
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 1000)
      })

      toast.success('🎉 Welcome back to MealAppeal!', {
        description: 'Let&apos;s continue your nutrition journey! 🍽️',
      })
    } catch {
      toast.error('Login failed', {
        description: 'Please check your credentials and try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await onGoogleSignIn?.()
      toast.success('🚀 Google Sign-In Successful!', {
        description: 'Welcome to your personalized nutrition experience!',
      })
    } catch {
      toast.error('Google Sign-In failed', {
        description: 'Please try again or use email login.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '28rem',
        margin: '0 auto',
        borderRadius: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '2rem',
      }}
    >
      {/* Premium Hint Banner */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(251, 146, 60, 0.3)',
          background:
            'linear-gradient(135deg, rgba(254, 215, 170, 0.8) 0%, rgba(253, 224, 71, 0.8) 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Crown style={{ height: '1rem', width: '1rem', color: '#ea580c' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#9a3412' }}>
          Upgrade to Premium for unlimited meal analysis! 👑
        </span>
      </div>

      {/* Google Sign-In Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Button
          type="button"
          variant="outline"
          className="w-full border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          style={{ borderRadius: '0.75rem', padding: '0.75rem', fontSize: '0.875rem' }}
        >
          <Chrome className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
      </div>

      {/* Divider */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            background: 'rgba(255, 255, 255, 0.3)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '0 1rem',
              color: 'rgba(75, 85, 99, 0.8)',
            }}
          >
            Or continue with email
          </span>
        </div>
      </div>

      {/* Login Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    style={{
                      color: 'rgba(55, 65, 81, 0.9)',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '0.75rem',
                          height: '1rem',
                          width: '1rem',
                          transform: 'translateY(-50%)',
                          color: 'rgba(107, 114, 128, 0.6)',
                        }}
                      />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        className="border-white/30 bg-white/20 pl-10 backdrop-blur-sm focus:border-green-400 focus:ring-green-400/20"
                        style={{ borderRadius: '0.75rem', paddingLeft: '2.5rem' }}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    style={{
                      color: 'rgba(55, 65, 81, 0.9)',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    Password
                  </FormLabel>
                  <FormControl>
                    <div style={{ position: 'relative' }}>
                      <Lock
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '0.75rem',
                          height: '1rem',
                          width: '1rem',
                          transform: 'translateY(-50%)',
                          color: 'rgba(107, 114, 128, 0.6)',
                        }}
                      />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="border-white/30 bg-white/20 pr-10 pl-10 backdrop-blur-sm focus:border-green-400 focus:ring-green-400/20"
                        style={{
                          borderRadius: '0.75rem',
                          paddingLeft: '2.5rem',
                          paddingRight: '2.5rem',
                        }}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          right: '0.75rem',
                          transform: 'translateY(-50%)',
                          color: 'rgba(107, 114, 128, 0.6)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff style={{ height: '1rem', width: '1rem' }} />
                        ) : (
                          <Eye style={{ height: '1rem', width: '1rem' }} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                fontSize: '0.875rem',
                color: '#16a34a',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.textDecoration = 'underline'
                e.currentTarget.style.color = '#15803d'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.textDecoration = 'none'
                e.currentTarget.style.color = '#16a34a'
              }}
            >
              Forgot password? 🤔
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #16a34a 0%, #ea580c 100%)',
              padding: '1rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: 'scale(1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.02)'
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    height: '1rem',
                    width: '1rem',
                    borderRadius: '50%',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Signing in...
              </div>
            ) : (
              '🚀 Sign In to MealAppeal'
            )}
          </Button>
        </form>
      </Form>

      {/* Feature Preview */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          borderRadius: '0.75rem',
          background: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
        }}
      >
        <h4
          style={{
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: 'rgba(55, 65, 81, 0.9)',
            fontSize: '0.875rem',
          }}
        >
          Ready to transform your meals? 📸
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'rgba(75, 85, 99, 0.8)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>📊</span>
            <span>Nutrition Analysis</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>🎯</span>
            <span>Goal Tracking</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>📤</span>
            <span>Social Sharing</span>
          </div>
        </div>
      </div>

      {/* Sign Up Link */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'rgba(75, 85, 99, 0.8)', margin: '0 0 0.5rem 0' }}>
          Don&apos;t have an account?{' '}
          <button
            onClick={onSignUp}
            style={{
              fontWeight: '500',
              color: '#16a34a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.textDecoration = 'underline'
              e.currentTarget.style.color = '#15803d'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.textDecoration = 'none'
              e.currentTarget.style.color = '#16a34a'
            }}
          >
            Join MealAppeal today! 🌱
          </button>
        </p>
      </div>

      {/* Premium CTA */}
      <div
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          background:
            'linear-gradient(135deg, rgba(220, 252, 231, 0.8) 0%, rgba(187, 247, 208, 0.8) 100%)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Crown style={{ height: '1rem', width: '1rem', color: '#16a34a' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#166534' }}>
              Premium Features
            </span>
          </div>
          <p
            style={{
              marginBottom: '0.5rem',
              fontSize: '0.75rem',
              color: '#15803d',
              margin: '0 0 0.5rem 0',
            }}
          >
            Unlimited storage • Advanced insights • 6 analysis modes
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-green-100"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
          >
            Learn More 💎
          </Button>
        </div>
      </div>

      <p
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'rgba(107, 114, 128, 0.8)',
          margin: 0,
        }}
      >
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>

      {/* Add spin animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
