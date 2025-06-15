'use client'

import { Camera, Crown, Sparkles, Zap, Heart, Trophy, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/AppLayout'
// import { MobileRecommendationBanner } from '@/components/MobileRecommendationBanner'

export default function HomePage(): React.ReactElement {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      refreshProfile()
    }
  }, [user, refreshProfile])

  // Check for payment success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('payment') === 'success') {
      setShowPaymentSuccess(true)
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      setTimeout(() => setShowPaymentSuccess(false), 8000)
    }
  }, [])

  const handleSignOut = async (): Promise<void> => {
    try {
      console.log('🔐 [HomePage] Sign out button clicked!')
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('❌ [HomePage] Error signing out:', error)
      window.location.href = '/login'
    }
  }

  const isPremium = profile?.subscription_tier === 'premium_monthly' || profile?.subscription_tier === 'premium_yearly'

  return (
    <AppLayout>
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 25%, #f0f9ff 50%, #fef3c7 75%, #fdf2f8 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Inter, sans-serif',
          paddingBottom: '100px', // Space for bottom navigation
        }}
      >
      {/* Animated Background Elements */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(234, 88, 12, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)
          `,
          animation: 'float 8s ease-in-out infinite',
          zIndex: 1,
        }}
      />

      {/* Floating Food Elements */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          fontSize: '3rem',
          opacity: 0.3,
          animation: 'float 6s ease-in-out infinite',
          animationDelay: '0s',
          zIndex: 1,
        }}
      >
        🥗
      </div>
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          fontSize: '2.5rem',
          opacity: 0.3,
          animation: 'float 7s ease-in-out infinite',
          animationDelay: '1s',
          zIndex: 1,
        }}
      >
        🍎
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '10%',
          fontSize: '2rem',
          opacity: 0.3,
          animation: 'float 5s ease-in-out infinite',
          animationDelay: '2s',
          zIndex: 1,
        }}
      >
        🥑
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '5%',
          fontSize: '2.5rem',
          opacity: 0.3,
          animation: 'float 6.5s ease-in-out infinite',
          animationDelay: '1.5s',
          zIndex: 1,
        }}
      >
        🍊
      </div>

      {/* Premium Dashboard Status Banner */}
      {user && (
        <div style={{
          background: isPremium 
            ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' 
            : 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
          color: 'white',
          padding: '16px',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          {isPremium ? (
            <>
              <Crown style={{ width: '20px', height: '20px' }} />
              Premium Analytics Dashboard • Advanced Insights Enabled
            </>
          ) : (
            <>
              <Zap style={{ width: '20px', height: '20px' }} />
              Free Tier • {14 - Math.min(Math.floor((Date.now() - new Date(profile?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)), 14)} days remaining
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Payment Success Banner */}
        {showPaymentSuccess && (
          <div
            style={{
              position: 'fixed',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              maxWidth: '24rem',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '16px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.95)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                color: 'white',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                animation: 'bounce 1s infinite',
              }}
            >
              <div style={{ fontSize: '2rem' }}>🎉</div>
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>Welcome to Premium!</p>
                <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                  Enjoy unlimited features and deep insights!
                </p>
              </div>
              <button
                onClick={() => setShowPaymentSuccess(false)}
                style={{
                  marginLeft: 'auto',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'white',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '16px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '32px',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  height: '48px',
                  width: '48px',
                  background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'scale(1)',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Camera style={{ height: '24px', width: '24px', color: 'white' }} />
              </div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                }}
              >
                MealAppeal
              </h1>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {user ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <Link
                      href="/camera"
                      style={{
                        fontWeight: '500',
                        color: '#374151',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        padding: '8px 16px',
                        borderRadius: '8px',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#10b981'
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      Camera
                    </Link>
                    <Link
                      href="/meals"
                      style={{
                        fontWeight: '500',
                        color: '#374151',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        padding: '8px 16px',
                        borderRadius: '8px',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#10b981'
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      My Meals
                    </Link>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {!isPremium && (
                      <Link
                        href="/upgrade"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                          padding: '10px 20px',
                          borderRadius: '50px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white',
                          textDecoration: 'none',
                          transform: 'scale(1)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.4)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Crown style={{ height: '16px', width: '16px' }} />
                        <span>Upgrade</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6b7280',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                        padding: '8px 16px',
                        borderRadius: '8px',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444'
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#6b7280'
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Link
                    href="/login"
                    style={{
                      padding: '10px 20px',
                      fontWeight: '500',
                      color: '#374151',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      borderRadius: '8px',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#10b981'
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#374151'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                      padding: '10px 24px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      color: 'white',
                      textDecoration: 'none',
                      transform: 'scale(1)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main style={{ position: 'relative' }}>
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '80px 32px',
            }}
          >
            {/* Main Hero Content */}
            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                textAlign: 'center',
                marginBottom: '80px',
              }}
            >
              {user && profile ? (
                <>
                  <div style={{ marginBottom: '32px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '50px',
                        padding: '8px 16px',
                        marginBottom: '24px',
                        animation: 'pulse 2s infinite',
                      }}
                    >
                      <Sparkles style={{ width: '16px', height: '16px', color: '#10b981' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#10b981' }}>
                        Welcome back, {profile.full_name?.split(' ')[0] || 'Friend'}!
                      </span>
                    </div>
                  </div>
                  <h1
                    style={{
                      fontSize: '42px',
                      fontWeight: 'bold',
                      lineHeight: '1.1',
                      marginBottom: '24px',
                      color: '#111827',
                    }}
                  >
                    Your Personal
                    <span
                      style={{
                        display: 'block',
                        background: isPremium 
                          ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Nutrition Coach
                    </span>
                  </h1>
                  
                  {/* Premium Analytics Dashboard */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '16px',
                    maxWidth: '600px',
                    margin: '0 auto 32px auto',
                    padding: '24px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '28px', 
                        fontWeight: 'bold', 
                        color: '#10b981',
                        marginBottom: '4px'
                      }}>
                        {profile.meal_count || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                        Meals Analyzed
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '28px', 
                        fontWeight: 'bold', 
                        color: '#ea580c',
                        marginBottom: '4px'
                      }}>
                        {isPremium ? '97%' : '78%'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                        Health Score
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '28px', 
                        fontWeight: 'bold', 
                        color: '#7c3aed',
                        marginBottom: '4px'
                      }}>
                        {isPremium ? '+12%' : '+5%'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                        This Week
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '28px', 
                        fontWeight: 'bold', 
                        color: '#059669',
                        marginBottom: '4px'
                      }}>
                        {isPremium ? 'A+' : 'B+'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                        Nutrition Grade
                      </div>
                    </div>
                  </div>
                  
                  {/* Personalized Insights */}
                  <div style={{
                    maxWidth: '600px',
                    margin: '0 auto 40px auto',
                    padding: '20px',
                    borderRadius: '16px',
                    background: isPremium 
                      ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%)',
                    border: isPremium 
                      ? '1px solid rgba(124, 58, 237, 0.2)'
                      : '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      {isPremium ? (
                        <Crown style={{ width: '20px', height: '20px', color: '#7c3aed' }} />
                      ) : (
                        <Sparkles style={{ width: '20px', height: '20px', color: '#10b981' }} />
                      )}
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: isPremium ? '#7c3aed' : '#10b981'
                      }}>
                        {isPremium ? 'Advanced Coaching Insights' : 'Smart Recommendations'}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '16px',
                      lineHeight: '1.5',
                      color: '#374151',
                      margin: 0
                    }}>
                      {isPremium 
                        ? 'Your protein intake is 15% above optimal this week. Consider increasing fiber-rich vegetables in your next 3 meals to improve digestive efficiency and nutrient absorption.'
                        : 'Great progress this week! Try adding more colorful vegetables to boost your antioxidant intake.'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '32px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '50px',
                        padding: '8px 16px',
                        marginBottom: '24px',
                        animation: 'pulse 2s infinite',
                      }}
                    >
                      <Star style={{ width: '16px', height: '16px', color: '#10b981' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#10b981' }}>
                        Discover your nutrition insights
                      </span>
                    </div>
                  </div>
                  <h1
                    style={{
                      fontSize: '64px',
                      fontWeight: 'bold',
                      lineHeight: '1.1',
                      marginBottom: '24px',
                      color: '#111827',
                    }}
                  >
                    <span
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Transform Every Meal Into Deep Insights
                    </span>
                  </h1>
                  <p
                    style={{
                      maxWidth: '600px',
                      margin: '0 auto 40px auto',
                      fontSize: '20px',
                      lineHeight: '1.6',
                      color: '#6b7280',
                    }}
                  >
                    Stop guessing what's in your food. Point, shoot, and discover the complete story behind every meal – from nutrition and origins to smart ingredient swaps.
                  </p>
                </>
              )}

              {/* Advanced Analytics Preview */}
              {user && (
                <div style={{
                  maxWidth: '700px',
                  margin: '0 auto 32px auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '20px'
                }}>
                  {/* Weekly Nutrition Trends */}
                  <div style={{
                    padding: '24px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <TrendingUp style={{ width: '20px', height: '20px', color: '#10b981' }} />
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        Weekly Nutrition Trends
                      </span>
                      {isPremium && (
                        <div style={{
                          marginLeft: 'auto',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          PREMIUM
                        </div>
                      )}
                    </div>
                    
                    {/* Simulated Chart */}
                    <div style={{
                      height: '120px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%)',
                      borderRadius: '12px',
                      position: 'relative',
                      overflow: 'hidden',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '20px',
                        right: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'end'
                      }}>
                        {[65, 78, 85, 72, 89, 92, 87].map((height, i) => (
                          <div
                            key={i}
                            style={{
                              width: '8px',
                              height: `${height}px`,
                              background: isPremium 
                                ? 'linear-gradient(to top, #7c3aed, #a855f7)'
                                : 'linear-gradient(to top, #10b981, #34d399)',
                              borderRadius: '4px',
                              opacity: isPremium ? 1 : 0.6
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      <span>Protein: {isPremium ? '127g avg' : '95g avg'}</span>
                      <span>Fiber: {isPremium ? '31g avg' : '22g avg'}</span>
                    </div>
                  </div>
                  
                  {/* Health Goals Progress */}
                  <div style={{
                    padding: '24px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <Trophy style={{ width: '20px', height: '20px', color: '#ea580c' }} />
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        Health Goals
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}>
                        <span style={{ color: '#374151', fontWeight: '500' }}>Weight Management</span>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>{isPremium ? '92%' : '67%'}</span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: '#f3f4f6',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: isPremium ? '92%' : '67%',
                          height: '100%',
                          background: 'linear-gradient(to right, #10b981, #34d399)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}>
                        <span style={{ color: '#374151', fontWeight: '500' }}>Energy Balance</span>
                        <span style={{ color: '#ea580c', fontWeight: '600' }}>{isPremium ? '88%' : '45%'}</span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: '#f3f4f6',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: isPremium ? '88%' : '45%',
                          height: '100%',
                          background: 'linear-gradient(to right, #ea580c, #fb923c)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                    
                    {isPremium && (
                      <div style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.2)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#7c3aed',
                          marginBottom: '4px'
                        }}>
                          Next Milestone
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280'
                        }}>
                          Reduce sodium by 200mg daily to reach optimal cardiovascular health zone
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* CTA Buttons */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '48px',
                }}
              >
                <Link
                  href={user ? '/camera' : '/signup'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    background: isPremium 
                      ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                    padding: '20px 40px',
                    borderRadius: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'white',
                    textDecoration: 'none',
                    transform: 'scale(1)',
                    transition: 'all 0.3s ease',
                    boxShadow: isPremium 
                      ? '0 10px 25px rgba(124, 58, 237, 0.3)'
                      : '0 10px 25px rgba(16, 185, 129, 0.3)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                    e.currentTarget.style.boxShadow = isPremium 
                      ? '0 20px 40px rgba(124, 58, 237, 0.4)'
                      : '0 20px 40px rgba(16, 185, 129, 0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                    e.currentTarget.style.boxShadow = isPremium 
                      ? '0 10px 25px rgba(124, 58, 237, 0.3)'
                      : '0 10px 25px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Camera style={{ height: '24px', width: '24px' }} />
                  {user ? (isPremium ? 'Analyze Next Meal' : 'Start Analyzing') : 'Try Free for 14 Days'}
                </Link>

                {user && !isPremium && (
                  <Link
                    href="/upgrade"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      border: '2px solid rgba(124, 58, 237, 0.3)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(12px)',
                      padding: '16px 32px',
                      borderRadius: '16px',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      textDecoration: 'none',
                      transform: 'scale(1)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                      e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)'
                      e.currentTarget.style.color = '#7c3aed'
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(124, 58, 237, 0.15)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                      e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)'
                      e.currentTarget.style.color = '#374151'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <Crown style={{ height: '20px', width: '20px' }} />
                    Unlock Advanced Analytics
                  </Link>
                )}
                
                {!user && (
                  <Link
                    href="/login"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(12px)',
                      padding: '16px 32px',
                      borderRadius: '16px',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      textDecoration: 'none',
                      transform: 'scale(1)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    I Have an Account
                  </Link>
                )}
              </div>

              {/* Professional Social Proof */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '32px',
                  fontSize: '14px',
                  color: '#6b7280',
                  flexWrap: 'wrap',
                  fontWeight: '500'
                }}
              >
                <span>🏥 Used by Health Professionals</span>
                <span style={{ width: '1px', height: '16px', background: '#d1d5db' }}></span>
                <span>📊 USDA-Enhanced Analysis</span>
                <span style={{ width: '1px', height: '16px', background: '#d1d5db' }}></span>
                <span>🔬 Research-Grade Insights</span>
              </div>
            </div>

            {/* Features Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
                marginBottom: '80px',
              }}
            >
              {/* Feature 1: Professional Analysis */}
              <div
                style={{
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '32px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}
              >
                {user && isPremium && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    ACTIVE
                  </div>
                )}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Zap style={{ width: '32px', height: '32px', color: 'white' }} />
                </div>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '12px',
                  }}
                >
                  Professional-Grade Analysis
                </h3>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    margin: '0 0 16px 0',
                  }}
                >
                  Nutritionist-level insights in 3 seconds. Complete macro breakdowns, micronutrient analysis, and USDA-enhanced data precision.
                </p>
                {user && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: isPremium 
                      ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%)',
                    border: isPremium 
                      ? '1px solid rgba(124, 58, 237, 0.2)'
                      : '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    <span style={{ color: isPremium ? '#7c3aed' : '#10b981' }}>
                      {isPremium ? '✓ ' : '⏳ '}
                    </span>
                    <span style={{ color: '#374151' }}>
                      {isPremium 
                        ? 'Advanced USDA enhancement active'
                        : 'Upgrade for enhanced accuracy'}
                    </span>
                  </div>
                )}
              </div>

              {/* Feature 2: Personal Coaching */}
              <div
                style={{
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '32px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}
              >
                {user && !isPremium && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    UPGRADE
                  </div>
                )}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 8px 20px rgba(234, 88, 12, 0.3)',
                  }}
                >
                  <Heart style={{ width: '32px', height: '32px', color: 'white' }} />
                </div>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '12px',
                  }}
                >
                  Personal Nutrition Coach
                </h3>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    margin: '0 0 16px 0',
                  }}
                >
                  {user && isPremium 
                    ? 'Advanced pattern recognition learns your preferences and goals. Get personalized meal recommendations and macro optimization.'
                    : 'Smart recommendations that adapt to your health goals, dietary preferences, and lifestyle. Track progress with professional-grade insights.'}
                </p>
                {user && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: isPremium ? '#10b981' : '#6b7280'
                    }}>
                      <span>{isPremium ? '✓' : '○'}</span>
                      <span>Personalized daily recommendations</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: isPremium ? '#10b981' : '#6b7280'
                    }}>
                      <span>{isPremium ? '✓' : '○'}</span>
                      <span>Health goal tracking & milestones</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: isPremium ? '#10b981' : '#6b7280'
                    }}>
                      <span>{isPremium ? '✓' : '○'}</span>
                      <span>Advanced pattern recognition</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Feature 3: Professional Platform */}
              <div
                style={{
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '32px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}
              >
                {user && isPremium && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    PREMIUM
                  </div>
                )}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)',
                  }}
                >
                  <Trophy style={{ width: '32px', height: '32px', color: 'white' }} />
                </div>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '12px',
                  }}
                >
                  Professional Health Platform
                </h3>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    margin: '0 0 16px 0',
                  }}
                >
                  Enterprise-grade nutrition analytics. Unlimited storage, export capabilities, and white-label reports for health professionals.
                </p>
                {user && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.2)'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#7c3aed',
                      marginBottom: '4px'
                    }}>
                      {isPremium ? 'Available Features' : 'Unlock Premium'}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280'
                    }}>
                      {isPremium 
                        ? 'PDF exports, trend analysis, goal tracking, priority support'
                        : 'Upgrade to access professional features and unlimited storage'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Premium CTA Section */}
            {user && !isPremium && (
              <div
                style={{
                  borderRadius: '32px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  padding: '48px',
                  textAlign: 'center',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px rgba(124, 58, 237, 0.3)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
                    `,
                    animation: 'float 6s ease-in-out infinite',
                  }}
                />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '24px'
                  }}>
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <Crown style={{ width: '40px', height: '40px', color: 'white' }} />
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: 'rgba(234, 88, 12, 0.9)',
                      fontSize: '14px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      animation: 'pulse 2s infinite'
                    }}>
                      Limited Time: $19.99/mo
                    </div>
                  </div>
                  <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>
                    Unlock Professional Nutrition Analytics
                  </h2>
                  <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px auto' }}>
                    Join 15,000+ health professionals using MealAppeal for advanced nutrition analysis. Price increasing to $29.99 in 2025.
                  </p>
                  
                  {/* Value Proposition Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                    maxWidth: '600px',
                    margin: '0 auto 32px auto'
                  }}>
                    <div style={{
                      padding: '20px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(12px)'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Unlimited</div>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>Meal storage & exports</div>
                    </div>
                    <div style={{
                      padding: '20px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(12px)'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>5x</div>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>Analysis rate limit</div>
                    </div>
                    <div style={{
                      padding: '20px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(12px)'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>USDA</div>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>Enhanced accuracy</div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <Link
                      href="/upgrade"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#7c3aed',
                        padding: '16px 32px',
                        borderRadius: '16px',
                        fontSize: '18px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        transform: 'scale(1)',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                        e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.3)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <Crown style={{ height: '24px', width: '24px' }} />
                      Upgrade to Premium
                    </Link>
                    <div style={{
                      fontSize: '12px',
                      opacity: 0.8,
                      textAlign: 'center'
                    }}>
                      30-day money-back guarantee • Cancel anytime<br/>
                      <strong>Price locks in for first year subscribers</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Premium User Success Section */}
            {user && isPremium && (
              <div
                style={{
                  borderRadius: '32px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  padding: '48px',
                  textAlign: 'center',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px rgba(16, 185, 129, 0.3)',
                }}
              >
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <Star style={{ width: '40px', height: '40px', color: 'white' }} />
                  </div>
                  <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>
                    You're Maximizing Your Health Investment
                  </h2>
                  <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px auto' }}>
                    Premium subscribers see 3x better health outcomes. Your advanced analytics are working!
                  </p>
                  <Link
                    href="/account/billing"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      backdropFilter: 'blur(12px)',
                      padding: '16px 32px',
                      borderRadius: '16px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'white',
                      textDecoration: 'none',
                      transform: 'scale(1)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <Crown style={{ height: '24px', width: '24px' }} />
                    Manage Subscription
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate(-50%, 0);
          }
          40%, 43% {
            transform: translate(-50%, -30px);
          }
          70% {
            transform: translate(-50%, -15px);
          }
          90% {
            transform: translate(-50%, -4px);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}