'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LoginCard } from '@/components/auth/LoginCard'
import { Navigation } from '@/components/Navigation'
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
        position: 'relative',
        background:
          'radial-gradient(circle at 20% 50%, rgba(255, 107, 107, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(72, 219, 251, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(255, 159, 243, 0.3) 0%, transparent 50%)',
        overflow: 'hidden',
      }}
    >
      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Navigation />

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
