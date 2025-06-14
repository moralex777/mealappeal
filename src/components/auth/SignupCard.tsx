'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Chrome, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

import { Calendar } from '@/components/ui/calendar'

const SignupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  dateOfBirth: z.date({
    required_error: 'Please select your date of birth',
  }),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
})

type SignupForm = z.infer<typeof SignupSchema>

interface ISignupCardProps {
  onSuccess?: () => void
  onGoogleSignIn?: () => void
  onLoginRedirect?: () => void
}

export function SignupCard({ onSuccess, onGoogleSignIn, onLoginRedirect }: ISignupCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const { signUp } = useAuth()

  const form = useForm<SignupForm>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      acceptTerms: false,
    },
  })

  async function onSubmit(data: SignupForm) {
    setIsLoading(true)

    try {
      const { error } = await signUp(data.email, data.password, data.fullName)

      if (error) {
        toast.error('Registration failed', {
          description: error.message || 'Please check your details and try again.',
        })
        return
      }

      toast.success('🎉 Welcome to MealAppeal!', {
        description: 'Check your email to verify your account! 📧',
      })

      onSuccess?.()
    } catch (err) {
      console.error('Signup error:', err)
      toast.error('Registration failed', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await onGoogleSignIn?.()
      toast.success('🚀 Google Sign-In Successful!', {
        description: 'Welcome to your personalized nutrition experience!',
      })
    } catch (err) {
      console.error('Google sign-in error:', err)
      toast.error('Google Sign-In failed', {
        description: 'Please try again or use email registration.',
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Card
        className="animate-bounce-in w-full max-w-md"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <CardHeader className="pb-6 text-center">
          <CardTitle
            className="mb-2 text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #ea580c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Join MealAppeal 🍽️
          </CardTitle>
          <CardDescription className="text-gray-700">
            Transform your meals into your personal nutrition coach! 📸✨
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30"
            style={{ borderRadius: '0.75rem' }}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/20 px-2 text-gray-600 backdrop-blur-sm">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name Field */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                        <Input
                          placeholder="Your full name"
                          className="border-white/30 bg-white/20 pl-10 backdrop-blur-sm focus:border-green-400 focus:ring-green-400/20"
                          style={{ borderRadius: '0.75rem' }}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormLabel className="text-sm font-medium text-gray-600">Full Name</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          className="border-white/30 bg-white/20 pl-10 backdrop-blur-sm focus:border-green-400 focus:ring-green-400/20"
                          style={{ borderRadius: '0.75rem' }}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormLabel className="text-sm font-medium text-gray-600">
                      Email Address
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          className="border-white/30 bg-white/20 pr-10 pl-10 backdrop-blur-sm focus:border-green-400 focus:ring-green-400/20"
                          style={{ borderRadius: '0.75rem' }}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormLabel className="text-sm font-medium text-gray-600">
                      Password (min. 8 characters with uppercase, lowercase & number)
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Birth Field */}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start border-white/30 bg-white/20 text-left font-normal backdrop-blur-sm hover:bg-white/30',
                              !field.value && 'text-gray-400'
                            )}
                            style={{ borderRadius: '0.75rem' }}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'PPP') : 'Pick your birth date'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                        style={{
                          zIndex: 9999,
                          backgroundColor: 'white !important',
                          background: 'white !important',
                          opacity: '1 !important',
                          backdropFilter: 'none !important',
                          border: '1px solid rgb(229, 231, 235) !important',
                          boxShadow:
                            '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important',
                        }}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date > new Date() || date < new Date('1900-01-01')}
                          captionLayout="dropdown"
                          className="rounded-md border-0 shadow-none"
                          style={{
                            backgroundColor: 'white !important',
                            background: 'white !important',
                            opacity: '1 !important',
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormLabel className="text-sm font-medium text-gray-600">
                      Date of Birth (for personalized nutrition recommendations)
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms & Conditions Checkbox */}
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-white/30 data-[state=checked]:border-green-500 data-[state=checked]:bg-green-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm text-gray-600">
                        I agree to the{' '}
                        <a href="/terms" className="text-green-600 underline hover:text-green-700">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a
                          href="/privacy"
                          className="text-green-600 underline hover:text-green-700"
                        >
                          Privacy Policy
                        </a>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full font-semibold text-white"
                style={{
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #16a34a 0%, #ea580c 100%)',
                  padding: '0.75rem 1.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
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
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating your account...
                  </div>
                ) : (
                  '🚀 Join MealAppeal'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="pt-0 text-center">
          <div className="w-full space-y-3">
            {/* Login Redirect */}
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onLoginRedirect}
                className="font-medium text-green-600 underline hover:text-green-700"
              >
                Sign in here 🌱
              </button>
            </p>

            {/* Trust Indicators */}
            <p className="text-xs text-gray-500">
              🔒 Your data is secure • 🌱 Free forever tier • 👑 Premium features available
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
