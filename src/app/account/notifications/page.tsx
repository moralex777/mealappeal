'use client'

import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface INotificationSettings {
  email_meal_reminders: boolean
  email_weekly_summary: boolean
  email_premium_features: boolean
  push_meal_analysis_complete: boolean
  push_sharing_activity: boolean
  push_achievement_unlocked: boolean
  push_premium_tips: boolean
}

const defaultSettings: INotificationSettings = {
  email_meal_reminders: true,
  email_weekly_summary: true,
  email_premium_features: false,
  push_meal_analysis_complete: true,
  push_sharing_activity: true,
  push_achievement_unlocked: true,
  push_premium_tips: false,
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<INotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadNotificationSettings = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.warn('⚠️ Supabase not configured, using default notification settings')
        setSettings(defaultSettings)
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // No settings found - use defaults and create entry
          console.log('No notification settings found, using defaults')
          setSettings(defaultSettings)
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          // Table doesn't exist yet
          console.log('Notification settings table not created yet, using defaults')
          setSettings(defaultSettings)
          setError('Notification settings will be available after database migration')
        } else {
          throw error
        }
      } else if (data) {
        setSettings(data)
      }
    } catch (err: any) {
      console.error('Error loading notification settings:', err)
      setError(err.message || 'Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    loadNotificationSettings()
  }, [user, authLoading, router, loadNotificationSettings])

  const saveSettings = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const { error } = await supabase.from('notification_settings').upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          // Table doesn't exist yet
          setError('Notification settings table not ready. Please run database migrations.')
        } else {
          throw error
        }
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err: any) {
      console.error('Error saving notification settings:', err)
      setError(err.message || 'Failed to save notification settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof INotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const notificationCategories = [
    {
      title: 'Email Notifications',
      icon: Mail,
      description: 'Receive updates via email',
      settings: [
        {
          key: 'email_meal_reminders' as keyof INotificationSettings,
          title: 'Meal Reminders 🍽️',
          description: 'Daily reminders to log your meals',
        },
        {
          key: 'email_weekly_summary' as keyof INotificationSettings,
          title: 'Weekly Summary 📊',
          description: 'Your weekly nutrition insights and progress',
        },
        {
          key: 'email_premium_features' as keyof INotificationSettings,
          title: 'Premium Features 👑',
          description: 'Updates about new premium features and benefits',
        },
      ],
    },
    {
      title: 'Push Notifications',
      icon: Smartphone,
      description: 'Real-time notifications on your device',
      settings: [
        {
          key: 'push_meal_analysis_complete' as keyof INotificationSettings,
          title: 'Analysis Complete ✅',
          description: 'When your meal analysis is ready',
        },
        {
          key: 'push_sharing_activity' as keyof INotificationSettings,
          title: 'Social Activity 📤',
          description: 'Likes and comments on your shared meals',
        },
        {
          key: 'push_achievement_unlocked' as keyof INotificationSettings,
          title: 'Achievements 🏆',
          description: 'When you unlock new achievements or milestones',
        },
        {
          key: 'push_premium_tips' as keyof INotificationSettings,
          title: 'Nutrition Tips 🌱',
          description: 'Personalized nutrition tips and recommendations',
        },
      ],
    },
  ]

  if (loading || authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
          padding: '16px',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              padding: '48px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ animation: 'pulse 2s infinite' }}>
              <div
                style={{
                  height: '32px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                  marginBottom: '32px',
                  animation: 'pulse 2s infinite',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {[1, 2].map(i => (
                  <div key={i}>
                    <div
                      style={{
                        height: '24px',
                        borderRadius: '8px',
                        background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                        marginBottom: '16px',
                        animation: 'pulse 2s infinite',
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[1, 2, 3].map(j => (
                        <div
                          key={j}
                          style={{
                            height: '64px',
                            borderRadius: '12px',
                            background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                            animation: 'pulse 2s infinite',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/account')}
            style={{
              marginRight: '16px',
              padding: '12px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.8)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}
            aria-label="Go back to account page"
          >
            <ArrowLeft style={{ width: '24px', height: '24px', color: '#6b7280' }} />
          </button>
          <div>
            <h1
              style={{
                fontSize: '40px',
                fontWeight: 'bold',
                marginBottom: '12px',
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}
            >
              Notifications
            </h1>
            <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
              Manage your notification preferences 🔔
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              padding: '16px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid #ef4444',
            }}
          >
            <Bell style={{ width: '24px', height: '24px', color: '#ef4444', flexShrink: 0 }} />
            <p style={{ color: '#dc2626', fontSize: '16px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {saved && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              padding: '16px',
              borderRadius: '16px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '2px solid #22c55e',
            }}
          >
            <Sparkles style={{ width: '24px', height: '24px', color: '#22c55e', flexShrink: 0 }} />
            <p style={{ color: '#15803d', fontSize: '16px', margin: 0 }}>Settings saved successfully!</p>
          </div>
        )}

        {/* Notification Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {notificationCategories.map(category => (
            <div
              key={category.title}
              style={{
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Category Header */}
              <div
                style={{
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      width: '48px',
                      height: '48px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <category.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                      {category.title}
                    </h2>
                    <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings List */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {category.settings.map(setting => (
                    <div
                      key={setting.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '16px',
                        border: '2px solid #f3f4f6',
                        padding: '16px',
                        transition: 'all 0.3s ease',
                        background: 'white',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#10b981'
                        e.currentTarget.style.background = '#f0fdf4'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#f3f4f6'
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          {setting.title}
                        </h3>
                        <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280', margin: 0 }}>
                          {setting.description}
                        </p>
                      </div>

                      {/* Toggle Switch */}
                      <label
                        style={{
                          position: 'relative',
                          marginLeft: '16px',
                          display: 'inline-flex',
                          cursor: 'pointer',
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="checkbox"
                          style={{
                            position: 'absolute',
                            width: '1px',
                            height: '1px',
                            padding: 0,
                            margin: '-1px',
                            overflow: 'hidden',
                            clip: 'rect(0, 0, 0, 0)',
                            whiteSpace: 'nowrap',
                            border: 0,
                          }}
                          checked={settings[setting.key]}
                          onChange={e => updateSetting(setting.key, e.target.checked)}
                          aria-label={`Toggle ${setting.title}`}
                        />
                        <div
                          style={{
                            width: '48px',
                            height: '24px',
                            borderRadius: '50px',
                            background: settings[setting.key] ? '#10b981' : '#e5e7eb',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: '2px',
                              left: settings[setting.key] ? '26px' : '2px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div style={{ position: 'sticky', bottom: '16px', marginTop: '32px' }}>
          <button
            onClick={saveSettings}
            disabled={saving}
            style={{
              width: '100%',
              padding: '18px 24px',
              borderRadius: '16px',
              border: 'none',
              background: saving ? '#d1d5db' : 'linear-gradient(to right, #10b981, #ea580c)',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
            }}
            onMouseEnter={e => {
              if (!saving) {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 20px rgba(16, 185, 129, 0.4)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            {saving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>

        {/* Info Box */}
        <div
          style={{
            marginTop: '24px',
            borderRadius: '16px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '2px solid #3b82f6',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <MessageSquare
              style={{ marginTop: '2px', width: '24px', height: '24px', flexShrink: 0, color: '#3b82f6' }}
            />
            <div>
              <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                Notification Tips
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', color: '#2563eb' }}>
                <li>• Push notifications require browser permission</li>
                <li>• Email notifications are sent to your account email</li>
                <li>• You can always change these settings later</li>
                <li>• Premium users get exclusive notification features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
