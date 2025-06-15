'use client'

import { ArrowLeft, Check, Eye, Lock, Shield, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { AppLayout } from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface IPrivacySettings {
  profile_visibility: 'public' | 'private'
  meal_visibility_default: 'public' | 'private'
  allow_indexing: boolean
  data_analytics: boolean
  marketing_emails: boolean
  share_anonymous_usage: boolean
}

const defaultSettings: IPrivacySettings = {
  profile_visibility: 'private',
  meal_visibility_default: 'private',
  allow_indexing: false,
  data_analytics: true,
  marketing_emails: false,
  share_anonymous_usage: true,
}

export default function PrivacyPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<IPrivacySettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    loadPrivacySettings()
  }, [user, authLoading, router])

  const loadPrivacySettings = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      setError(null)
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found - use defaults
          console.log('No privacy settings found, using defaults')
          setSettings(defaultSettings)
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          // Table doesn't exist yet
          console.log('Privacy settings table not created yet, using defaults')
          setSettings(defaultSettings)
          setError('Privacy settings will be available after database migration')
        } else {
          throw error
        }
      } else if (data) {
        setSettings(data)
      }
    } catch (err: any) {
      console.error('Error loading privacy settings:', err)
      setError(err.message || 'Failed to load privacy settings')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const saveSettings = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const { error } = await supabase.from('privacy_settings').upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          setError('Privacy settings table not ready. Please run database migrations.')
        } else {
          throw error
        }
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err: any) {
      console.error('Error saving privacy settings:', err)
      setError(err.message || 'Failed to save privacy settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof IPrivacySettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading || authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
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
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    style={{
                      height: '64px',
                      borderRadius: '16px',
                      background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div
        style={{
          minHeight: '100vh',
        background:
          'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page Title with Back Button */}
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
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}
            >
              Privacy & Security
            </h1>
            <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
              Control your data and privacy settings 🛡️
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
            <Shield style={{ width: '24px', height: '24px', color: '#ef4444', flexShrink: 0 }} />
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
            <Check style={{ width: '24px', height: '24px', color: '#22c55e', flexShrink: 0 }} />
            <p style={{ color: '#15803d', fontSize: '16px', margin: 0 }}>
              Privacy settings saved successfully!
            </p>
          </div>
        )}

        {/* Privacy Settings Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Profile Visibility */}
          <div
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                padding: '24px',
                color: 'white',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Eye style={{ width: '24px', height: '24px' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    Profile Visibility
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '8px 0 0 0' }}>
                    Control who can see your profile and meals
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '2px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      Profile Visibility
                    </h3>
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
                      Control if your profile appears in public searches
                    </p>
                  </div>
                  <select
                    value={settings.profile_visibility}
                    onChange={e => updateSetting('profile_visibility', e.target.value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      background: 'white',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#1f2937',
                      cursor: 'pointer',
                      transition: 'border-color 0.3s ease',
                    }}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '2px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      Default Meal Visibility
                    </h3>
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
                      Default privacy setting for new meals
                    </p>
                  </div>
                  <select
                    value={settings.meal_visibility_default}
                    onChange={e => updateSetting('meal_visibility_default', e.target.value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      background: 'white',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#1f2937',
                      cursor: 'pointer',
                      transition: 'border-color 0.3s ease',
                    }}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Data & Analytics */}
          <div
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                padding: '24px',
                color: 'white',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Lock style={{ width: '24px', height: '24px' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    Data & Analytics
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '8px 0 0 0' }}>
                    Manage how we use your data to improve the app
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  {
                    key: 'allow_indexing' as keyof IPrivacySettings,
                    title: 'Search Engine Indexing',
                    description: 'Allow search engines to index your public content',
                    value: settings.allow_indexing,
                  },
                  {
                    key: 'data_analytics' as keyof IPrivacySettings,
                    title: 'Usage Analytics',
                    description: 'Help us improve the app by sharing anonymous usage data',
                    value: settings.data_analytics,
                  },
                  {
                    key: 'marketing_emails' as keyof IPrivacySettings,
                    title: 'Marketing Communications',
                    description: 'Receive emails about new features and special offers',
                    value: settings.marketing_emails,
                  },
                  {
                    key: 'share_anonymous_usage' as keyof IPrivacySettings,
                    title: 'Anonymous Usage Sharing',
                    description: 'Share anonymized usage patterns to improve nutrition insights',
                    value: settings.share_anonymous_usage,
                  },
                ].map(setting => (
                  <div
                    key={setting.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '2px solid #e5e7eb',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div>
                      <h3
                        style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}
                      >
                        {setting.title}
                      </h3>
                      <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>{setting.description}</p>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={setting.value as boolean}
                        onChange={e => updateSetting(setting.key, e.target.checked)}
                        style={{ display: 'none' }}
                      />
                      <div
                        style={{
                          width: '56px',
                          height: '32px',
                          borderRadius: '16px',
                          background: (setting.value as boolean)
                            ? 'linear-gradient(to right, #10b981, #ea580c)'
                            : '#d1d5db',
                          position: 'relative',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'white',
                            position: 'absolute',
                            top: '4px',
                            left: (setting.value as boolean) ? '28px' : '4px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          }}
                        />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '48px' }}>
          <button
            onClick={saveSettings}
            disabled={saving}
            style={{
              width: '100%',
              padding: '20px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(to right, #10b981, #ea580c)',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
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
            {saving ? 'Saving Privacy Settings...' : 'Save Privacy Settings'}
          </button>
        </div>

        {/* Data Deletion Section */}
        <div
          style={{
            marginTop: '48px',
            borderRadius: '24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #ef4444',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <UserX style={{ width: '32px', height: '32px', color: '#dc2626' }} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
            Delete Account & Data
          </h3>
          <p style={{ color: '#7f1d1d', margin: '12px 0 24px 0' }}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid #dc2626',
              color: '#dc2626',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#dc2626'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              e.currentTarget.style.color = '#dc2626'
            }}
          >
            Request Account Deletion
          </button>
        </div>

        {/* Info Box */}
        <div
          style={{
            marginTop: '32px',
            borderRadius: '16px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '2px solid #3b82f6',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Shield style={{ width: '24px', height: '24px', color: '#3b82f6', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', margin: 0 }}>
                Your Privacy Matters
              </h3>
              <p style={{ color: '#2563eb', margin: '8px 0 0 0' }}>
                We&apos;re committed to protecting your data. Read our{' '}
                <a
                  href="/privacy-policy"
                  style={{
                    color: '#10b981',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#ea580c'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#10b981'
                  }}
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  href="/terms"
                  style={{
                    color: '#10b981',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#ea580c'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#10b981'
                  }}
                >
                  Terms of Service
                </a>{' '}
                for more details.
              </p>
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
    </AppLayout>
  )
}