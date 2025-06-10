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

  const loadNotificationSettings = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      setError(null)
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
      <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="animate-pulse">
              <div className="mb-6 h-8 rounded bg-gray-200"></div>
              <div className="space-y-6">
                {[1, 2].map(i => (
                  <div key={i}>
                    <div className="mb-4 h-6 rounded bg-gray-200"></div>
                    <div className="space-y-3">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="h-16 rounded bg-gray-200"></div>
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
    <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <button
            onClick={() => router.push('/account')}
            className="mr-4 rounded-full p-2 transition-colors hover:bg-white/50"
            aria-label="Go back to account page"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Manage your notification preferences 🔔</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center space-x-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <Bell className="h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {saved && (
          <div className="mb-6 flex items-center space-x-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <Sparkles className="h-5 w-5 flex-shrink-0 text-green-500" />
            <p className="text-green-700">Settings saved successfully!</p>
          </div>
        )}

        {/* Notification Categories */}
        <div className="space-y-8">
          {notificationCategories.map(category => (
            <div key={category.title} className="overflow-hidden rounded-2xl bg-white shadow-lg">
              {/* Category Header */}
              <div className="from-brand-500 bg-gradient-to-r to-orange-500 p-6">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{category.title}</h2>
                    <p className="text-sm text-white/80">{category.description}</p>
                  </div>
                </div>
              </div>

              {/* Settings List */}
              <div className="p-6">
                <div className="space-y-4">
                  {category.settings.map(setting => (
                    <div
                      key={setting.key}
                      className="hover:border-brand-200 flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{setting.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{setting.description}</p>
                      </div>

                      {/* Toggle Switch */}
                      <label className="relative ml-4 inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={settings[setting.key]}
                          onChange={e => updateSetting(setting.key, e.target.checked)}
                          aria-label={`Toggle ${setting.title}`}
                        />
                        <div className="peer-focus:ring-brand-300 peer peer-checked:bg-brand-500 h-6 w-11 rounded-full bg-gray-200 peer-focus:ring-4 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="sticky bottom-4 mt-8">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="from-brand-500 hover:from-brand-600 w-full transform rounded-2xl bg-gradient-to-r to-orange-500 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:to-orange-600 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <MessageSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
            <div>
              <h3 className="mb-1 font-semibold text-blue-900">Notification Tips</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Push notifications require browser permission</li>
                <li>• Email notifications are sent to your account email</li>
                <li>• You can always change these settings later</li>
                <li>• Premium users get exclusive notification features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
