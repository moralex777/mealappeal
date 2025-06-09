'use client'

import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function SignUpPage() {
  const router = useRouter()
  const { user, signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    goal: 'maintain_health',
    activityLevel: 'moderately_active',
    dietaryPreferences: [] as string[],
  })

  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName)
      if (error) {
        alert(error.message)
      } else {
        alert('Account created! Please check your email to verify.')
      }
    } catch (err) {
      alert('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDietaryChange = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter(p => p !== pref)
        : [...prev.dietaryPreferences, pref],
    }))
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
        <Navigation />

        {/* Signup Content */}
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
                marginBottom: '2rem',
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
                Join MealAppeal 🚀
                <span
                  style={{
                    display: 'block',
                    background: 'linear-gradient(135deg, #16a34a 0%, #ea580c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Transform Your Food Journey! 🍽️✨
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
                Start your personalized nutrition journey today! Let&apos;s unlock the secrets of
                every meal together 📸🌱
              </p>
            </div>

            {/* Premium Promotion Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem',
                textAlign: 'center',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                maxWidth: '500px',
                width: '100%',
              }}
            >
              <h3
                style={{
                  color: 'white',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                }}
              >
                🚀 Unlock Premium Analysis!
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1rem', fontSize: '1rem' }}>
                Get unlimited meal analysis, detailed nutrition insights, and personalized
                recommendations
              </p>
              <button
                onClick={() => (window.location.href = '/upgrade')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                View Premium Plans 💎
              </button>
            </div>

            {/* Signup Card */}
            <div
              style={{
                width: '100%',
                maxWidth: '500px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      color: 'white',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    👤 Basic Information
                  </h3>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '1rem',
                        }}
                        required
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '1rem',
                        }}
                        required
                      />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '1rem',
                          paddingRight: '3rem',
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer',
                        }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '1rem',
                          paddingRight: '3rem',
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer',
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    <div>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))
                        }
                        aria-label="Date of Birth"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '1rem',
                        }}
                        required
                      />
                    </div>
                  </div>
                  <p
                    style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.875rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    Used to provide personalized nutrition recommendations
                  </p>
                </div>

                {/* Nutrition Goals */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      color: 'white',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    🎯 Nutrition Goals
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                    What&apos;s your primary goal?
                  </p>

                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {[
                      { id: 'weight_loss', label: 'Weight Loss', color: '#3b82f6' },
                      { id: 'muscle_gain', label: 'Muscle Gain', color: '#3b82f6' },
                      { id: 'maintain_health', label: 'Maintain Health', color: '#eab308' },
                      { id: 'improve_energy', label: 'Improve Energy', color: '#eab308' },
                    ].map(goal => (
                      <label
                        key={goal.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          background:
                            formData.goal === goal.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        }}
                      >
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: goal.color,
                            border:
                              formData.goal === goal.id
                                ? '2px solid white'
                                : '2px solid transparent',
                          }}
                        />
                        <input
                          type="radio"
                          name="goal"
                          value={goal.id}
                          checked={formData.goal === goal.id}
                          onChange={e => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                          style={{ display: 'none' }}
                        />
                        <span style={{ color: 'white', fontSize: '1rem' }}>{goal.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Activity Level */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      color: 'white',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      marginBottom: '1rem',
                    }}
                  >
                    Activity Level
                  </h3>
                  <select
                    value={formData.activityLevel}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, activityLevel: e.target.value }))
                    }
                    aria-label="Activity Level"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="sedentary" style={{ background: '#333', color: 'white' }}>
                      Sedentary (little to no exercise)
                    </option>
                    <option value="lightly_active" style={{ background: '#333', color: 'white' }}>
                      Lightly Active (1-3 days/week)
                    </option>
                    <option
                      value="moderately_active"
                      style={{ background: '#333', color: 'white' }}
                    >
                      Moderately Active (3-5 days/week)
                    </option>
                    <option value="very_active" style={{ background: '#333', color: 'white' }}>
                      Very Active (6-7 days/week)
                    </option>
                  </select>
                </div>

                {/* Dietary Preferences */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      color: 'white',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Dietary Preferences
                  </h3>
                  <p
                    style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.875rem',
                      marginBottom: '1rem',
                    }}
                  >
                    Select all that apply
                  </p>

                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {[
                      { id: 'vegetarian', label: 'Vegetarian', emoji: '🌱' },
                      { id: 'vegan', label: 'Vegan', emoji: '🌿' },
                      { id: 'gluten_free', label: 'Gluten-Free', emoji: '🚫' },
                      { id: 'dairy_free', label: 'Dairy-Free', emoji: '🥛' },
                      { id: 'keto', label: 'Keto', emoji: '🥑' },
                    ].map(pref => (
                      <label
                        key={pref.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          background: formData.dietaryPreferences.includes(pref.id)
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.dietaryPreferences.includes(pref.id)}
                          onChange={() => handleDietaryChange(pref.id)}
                          style={{
                            width: '18px',
                            height: '18px',
                            accentColor: '#22c55e',
                          }}
                        />
                        <span style={{ fontSize: '1.25rem' }}>{pref.emoji}</span>
                        <span style={{ color: 'white', fontSize: '1rem' }}>{pref.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #22c55e 0%, #f97316 100%)',
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    marginBottom: '1rem',
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account 🚀'}
                </button>

                {/* Sign In Link */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                    Already have an account?{' '}
                    <Link
                      href="/login"
                      style={{
                        color: 'white',
                        fontWeight: '600',
                        textDecoration: 'underline',
                      }}
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </div>
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
