'use client'

import { Camera } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LoginCard } from '@/components/auth/LoginCard'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    router.push('/forgot-password')
  }

  const handleSignUp = () => {
    router.push('/signup')
  }

  const handleGoogleSignIn = () => {
    // TODO: Implement Google OAuth
    console.log('Google sign in clicked')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(circle at 20% 50%, rgba(255, 107, 107, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(72, 219, 251, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(255, 159, 243, 0.3) 0%, transparent 50%)',
          animation: 'float 6s ease-in-out infinite',
          zIndex: 1,
        }}
      />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Navigation Header */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '1rem 1.5rem',
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
                gap: '0.75rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  height: '2.5rem',
                  width: '2.5rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #f97316 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'scale(1)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Camera style={{ height: '1.5rem', width: '1.5rem', color: 'white' }} />
              </div>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #16a34a, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                }}
              >
                MealAppeal
              </h1>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'rgba(55, 65, 81, 0.8)', fontSize: '0.875rem' }}>
                New to MealAppeal?
              </span>
              <Link
                href="/signup"
                style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #f97316 100%)',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontWeight: '500',
                  color: 'white',
                  textDecoration: 'none',
                  transform: 'scale(1)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Welcome Content */}
        <main style={{ position: 'relative' }}>
          <div
            style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '3rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100vh - 80px)',
            }}
          >
            {/* Welcome Message */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: '3rem',
                maxWidth: '32rem',
              }}
            >
              <h2
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  lineHeight: '1.2',
                  margin: '0 0 1rem 0',
                }}
              >
                Welcome Back to
                <span
                  style={{
                    display: 'block',
                    background: 'linear-gradient(135deg, #16a34a 0%, #ea580c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  MealAppeal! 🍽️✨
                </span>
              </h2>
              <p
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.75',
                  color: 'rgba(55, 65, 81, 0.8)',
                  margin: 0,
                }}
              >
                Ready to continue your personalized nutrition journey? Let's discover what's in your
                next meal! 📸👑
              </p>
            </div>

            {/* Login Card */}
            <LoginCard
              onForgotPassword={handleForgotPassword}
              onSignUp={handleSignUp}
              onGoogleSignIn={handleGoogleSignIn}
            />
          </div>
        </main>
      </div>

      {/* Add the animation keyframes */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(1deg);
          }
          66% {
            transform: translateY(-10px) rotate(-1deg);
          }
        }
      `}</style>
    </div>
  )
}
