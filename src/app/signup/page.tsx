'use client'

import { Camera, Crown, Eye, EyeOff, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Navigation } from '@/components/Navigation'

// Complete country list with ISO codes and flag emojis
const countries = [
  // Priority countries first
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'JP', name: '🇯🇵 Japan' },
  { code: 'BR', name: '🇧🇷 Brazil' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'MX', name: '🇲🇽 Mexico' },
  { code: 'separator', name: '──────────────' },
  // All countries alphabetically
  { code: 'AF', name: '🇦🇫 Afghanistan' },
  { code: 'AL', name: '🇦🇱 Albania' },
  { code: 'DZ', name: '🇩🇿 Algeria' },
  { code: 'AD', name: '🇦🇩 Andorra' },
  { code: 'AO', name: '🇦🇴 Angola' },
  { code: 'AG', name: '🇦🇬 Antigua and Barbuda' },
  { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'AM', name: '🇦🇲 Armenia' },
  { code: 'AT', name: '🇦🇹 Austria' },
  { code: 'AZ', name: '🇦🇿 Azerbaijan' },
  { code: 'BS', name: '🇧🇸 Bahamas' },
  { code: 'BH', name: '🇧🇭 Bahrain' },
  { code: 'BD', name: '🇧🇩 Bangladesh' },
  { code: 'BB', name: '🇧🇧 Barbados' },
  { code: 'BY', name: '🇧🇾 Belarus' },
  { code: 'BE', name: '🇧🇪 Belgium' },
  { code: 'BZ', name: '🇧🇿 Belize' },
  { code: 'BJ', name: '🇧🇯 Benin' },
  { code: 'BT', name: '🇧🇹 Bhutan' },
  { code: 'BO', name: '🇧🇴 Bolivia' },
  { code: 'BA', name: '🇧🇦 Bosnia and Herzegovina' },
  { code: 'BW', name: '🇧🇼 Botswana' },
  { code: 'BN', name: '🇧🇳 Brunei' },
  { code: 'BG', name: '🇧🇬 Bulgaria' },
  { code: 'BF', name: '🇧🇫 Burkina Faso' },
  { code: 'BI', name: '🇧🇮 Burundi' },
  { code: 'CV', name: '🇨🇻 Cabo Verde' },
  { code: 'KH', name: '🇰🇭 Cambodia' },
  { code: 'CM', name: '🇨🇲 Cameroon' },
  { code: 'CF', name: '🇨🇫 Central African Republic' },
  { code: 'TD', name: '🇹🇩 Chad' },
  { code: 'CL', name: '🇨🇱 Chile' },
  { code: 'CN', name: '🇨🇳 China' },
  { code: 'CO', name: '🇨🇴 Colombia' },
  { code: 'KM', name: '🇰🇲 Comoros' },
  { code: 'CG', name: '🇨🇬 Congo' },
  { code: 'CD', name: '🇨🇩 Congo (DRC)' },
  { code: 'CR', name: '🇨🇷 Costa Rica' },
  { code: 'HR', name: '🇭🇷 Croatia' },
  { code: 'CU', name: '🇨🇺 Cuba' },
  { code: 'CY', name: '🇨🇾 Cyprus' },
  { code: 'CZ', name: '🇨🇿 Czech Republic' },
  { code: 'DK', name: '🇩🇰 Denmark' },
  { code: 'DJ', name: '🇩🇯 Djibouti' },
  { code: 'DM', name: '🇩🇲 Dominica' },
  { code: 'DO', name: '🇩🇴 Dominican Republic' },
  { code: 'EC', name: '🇪🇨 Ecuador' },
  { code: 'EG', name: '🇪🇬 Egypt' },
  { code: 'SV', name: '🇸🇻 El Salvador' },
  { code: 'GQ', name: '🇬🇶 Equatorial Guinea' },
  { code: 'ER', name: '🇪🇷 Eritrea' },
  { code: 'EE', name: '🇪🇪 Estonia' },
  { code: 'SZ', name: '🇸🇿 Eswatini' },
  { code: 'ET', name: '🇪🇹 Ethiopia' },
  { code: 'FJ', name: '🇫🇯 Fiji' },
  { code: 'FI', name: '🇫🇮 Finland' },
  { code: 'GA', name: '🇬🇦 Gabon' },
  { code: 'GM', name: '🇬🇲 Gambia' },
  { code: 'GE', name: '🇬🇪 Georgia' },
  { code: 'GH', name: '🇬🇭 Ghana' },
  { code: 'GR', name: '🇬🇷 Greece' },
  { code: 'GD', name: '🇬🇩 Grenada' },
  { code: 'GT', name: '🇬🇹 Guatemala' },
  { code: 'GN', name: '🇬🇳 Guinea' },
  { code: 'GW', name: '🇬🇼 Guinea-Bissau' },
  { code: 'GY', name: '🇬🇾 Guyana' },
  { code: 'HT', name: '🇭🇹 Haiti' },
  { code: 'HN', name: '🇭🇳 Honduras' },
  { code: 'HU', name: '🇭🇺 Hungary' },
  { code: 'IS', name: '🇮🇸 Iceland' },
  { code: 'ID', name: '🇮🇩 Indonesia' },
  { code: 'IR', name: '🇮🇷 Iran' },
  { code: 'IQ', name: '🇮🇶 Iraq' },
  { code: 'IE', name: '🇮🇪 Ireland' },
  { code: 'IL', name: '🇮🇱 Israel' },
  { code: 'IT', name: '🇮🇹 Italy' },
  { code: 'CI', name: '🇨🇮 Ivory Coast' },
  { code: 'JM', name: '🇯🇲 Jamaica' },
  { code: 'JO', name: '🇯🇴 Jordan' },
  { code: 'KZ', name: '🇰🇿 Kazakhstan' },
  { code: 'KE', name: '🇰🇪 Kenya' },
  { code: 'KI', name: '🇰🇮 Kiribati' },
  { code: 'KP', name: '🇰🇵 North Korea' },
  { code: 'KR', name: '🇰🇷 South Korea' },
  { code: 'XK', name: '🇽🇰 Kosovo' },
  { code: 'KW', name: '🇰🇼 Kuwait' },
  { code: 'KG', name: '🇰🇬 Kyrgyzstan' },
  { code: 'LA', name: '🇱🇦 Laos' },
  { code: 'LV', name: '🇱🇻 Latvia' },
  { code: 'LB', name: '🇱🇧 Lebanon' },
  { code: 'LS', name: '🇱🇸 Lesotho' },
  { code: 'LR', name: '🇱🇷 Liberia' },
  { code: 'LY', name: '🇱🇾 Libya' },
  { code: 'LI', name: '🇱🇮 Liechtenstein' },
  { code: 'LT', name: '🇱🇹 Lithuania' },
  { code: 'LU', name: '🇱🇺 Luxembourg' },
  { code: 'MG', name: '🇲🇬 Madagascar' },
  { code: 'MW', name: '🇲🇼 Malawi' },
  { code: 'MY', name: '🇲🇾 Malaysia' },
  { code: 'MV', name: '🇲🇻 Maldives' },
  { code: 'ML', name: '🇲🇱 Mali' },
  { code: 'MT', name: '🇲🇹 Malta' },
  { code: 'MH', name: '🇲🇭 Marshall Islands' },
  { code: 'MR', name: '🇲🇷 Mauritania' },
  { code: 'MU', name: '🇲🇺 Mauritius' },
  { code: 'FM', name: '🇫🇲 Micronesia' },
  { code: 'MD', name: '🇲🇩 Moldova' },
  { code: 'MC', name: '🇲🇨 Monaco' },
  { code: 'MN', name: '🇲🇳 Mongolia' },
  { code: 'ME', name: '🇲🇪 Montenegro' },
  { code: 'MA', name: '🇲🇦 Morocco' },
  { code: 'MZ', name: '🇲🇿 Mozambique' },
  { code: 'MM', name: '🇲🇲 Myanmar' },
  { code: 'NA', name: '🇳🇦 Namibia' },
  { code: 'NR', name: '🇳🇷 Nauru' },
  { code: 'NP', name: '🇳🇵 Nepal' },
  { code: 'NL', name: '🇳🇱 Netherlands' },
  { code: 'NZ', name: '🇳🇿 New Zealand' },
  { code: 'NI', name: '🇳🇮 Nicaragua' },
  { code: 'NE', name: '🇳🇪 Niger' },
  { code: 'NG', name: '🇳🇬 Nigeria' },
  { code: 'MK', name: '🇲🇰 North Macedonia' },
  { code: 'NO', name: '🇳🇴 Norway' },
  { code: 'OM', name: '🇴🇲 Oman' },
  { code: 'PK', name: '🇵🇰 Pakistan' },
  { code: 'PW', name: '🇵🇼 Palau' },
  { code: 'PS', name: '🇵🇸 Palestine' },
  { code: 'PA', name: '🇵🇦 Panama' },
  { code: 'PG', name: '🇵🇬 Papua New Guinea' },
  { code: 'PY', name: '🇵🇾 Paraguay' },
  { code: 'PE', name: '🇵🇪 Peru' },
  { code: 'PH', name: '🇵🇭 Philippines' },
  { code: 'PL', name: '🇵🇱 Poland' },
  { code: 'PT', name: '🇵🇹 Portugal' },
  { code: 'QA', name: '🇶🇦 Qatar' },
  { code: 'RO', name: '🇷🇴 Romania' },
  { code: 'RU', name: '🇷🇺 Russia' },
  { code: 'RW', name: '🇷🇼 Rwanda' },
  { code: 'KN', name: '🇰🇳 Saint Kitts and Nevis' },
  { code: 'LC', name: '🇱🇨 Saint Lucia' },
  { code: 'VC', name: '🇻🇨 Saint Vincent and the Grenadines' },
  { code: 'WS', name: '🇼🇸 Samoa' },
  { code: 'SM', name: '🇸🇲 San Marino' },
  { code: 'ST', name: '🇸🇹 Sao Tome and Principe' },
  { code: 'SA', name: '🇸🇦 Saudi Arabia' },
  { code: 'SN', name: '🇸🇳 Senegal' },
  { code: 'RS', name: '🇷🇸 Serbia' },
  { code: 'SC', name: '🇸🇨 Seychelles' },
  { code: 'SL', name: '🇸🇱 Sierra Leone' },
  { code: 'SG', name: '🇸🇬 Singapore' },
  { code: 'SK', name: '🇸🇰 Slovakia' },
  { code: 'SI', name: '🇸🇮 Slovenia' },
  { code: 'SB', name: '🇸🇧 Solomon Islands' },
  { code: 'SO', name: '🇸🇴 Somalia' },
  { code: 'ZA', name: '🇿🇦 South Africa' },
  { code: 'SS', name: '🇸🇸 South Sudan' },
  { code: 'ES', name: '🇪🇸 Spain' },
  { code: 'LK', name: '🇱🇰 Sri Lanka' },
  { code: 'SD', name: '🇸🇩 Sudan' },
  { code: 'SR', name: '🇸🇷 Suriname' },
  { code: 'SE', name: '🇸🇪 Sweden' },
  { code: 'CH', name: '🇨🇭 Switzerland' },
  { code: 'SY', name: '🇸🇾 Syria' },
  { code: 'TW', name: '🇹🇼 Taiwan' },
  { code: 'TJ', name: '🇹🇯 Tajikistan' },
  { code: 'TZ', name: '🇹🇿 Tanzania' },
  { code: 'TH', name: '🇹🇭 Thailand' },
  { code: 'TL', name: '🇹🇱 Timor-Leste' },
  { code: 'TG', name: '🇹🇬 Togo' },
  { code: 'TO', name: '🇹🇴 Tonga' },
  { code: 'TT', name: '🇹🇹 Trinidad and Tobago' },
  { code: 'TN', name: '🇹🇳 Tunisia' },
  { code: 'TR', name: '🇹🇷 Turkey' },
  { code: 'TM', name: '🇹🇲 Turkmenistan' },
  { code: 'TV', name: '🇹🇻 Tuvalu' },
  { code: 'UG', name: '🇺🇬 Uganda' },
  { code: 'UA', name: '🇺🇦 Ukraine' },
  { code: 'AE', name: '🇦🇪 United Arab Emirates' },
  { code: 'UY', name: '🇺🇾 Uruguay' },
  { code: 'UZ', name: '🇺🇿 Uzbekistan' },
  { code: 'VU', name: '🇻🇺 Vanuatu' },
  { code: 'VA', name: '🇻🇦 Vatican City' },
  { code: 'VE', name: '🇻🇪 Venezuela' },
  { code: 'VN', name: '🇻🇳 Vietnam' },
  { code: 'YE', name: '🇾🇪 Yemen' },
  { code: 'ZM', name: '🇿🇲 Zambia' },
  { code: 'ZW', name: '🇿🇼 Zimbabwe' },
]

export default function SignUpPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
  })

  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // Validation
      if (!formData.firstName.trim()) {
        setError('Please enter your first name')
        return
      }

      if (!formData.lastName.trim()) {
        setError('Please enter your last name')
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        return
      }

      if (!formData.country || formData.country === 'separator') {
        setError('Please select your country')
        return
      }

      setLoading(true)

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            first_name: formData.firstName,
            last_name: formData.lastName,
            date_of_birth: formData.dateOfBirth,
            country: formData.country,
          },
        },
      })

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.')
        } else if (authError.message.includes('Invalid email')) {
          setError('Please enter a valid email address')
        } else {
          setError(authError.message)
        }
      } else if (authData.user) {
        setSuccess('Account created! Please check your email to verify.')
        // Clear form after successful signup
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Navigation />
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
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Camera style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
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
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#6b7280', fontSize: '16px' }}>Already have an account?</span>
              <Link
                href="/login"
                style={{
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  fontWeight: '600',
                  color: 'white',
                  textDecoration: 'none',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'inline-block',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 12px 20px rgba(16, 185, 129, 0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 24px',
        }}
      >
        {/* Welcome Section */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}
        >
          <h2
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '24px',
              lineHeight: '1.2',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Join the Food Revolution!
            </span>
            <span
              style={{ display: 'block', fontSize: '28px', color: '#6b7280', marginTop: '12px' }}
            >
              Transform every meal into nutritional insights 📸✨
            </span>
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6',
            }}
          >
            Start your personalized nutrition journey today. Discover what&apos;s really in your
            food and unlock your health potential!
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            maxWidth: '560px',
            margin: '0 auto',
            gap: '32px',
          }}
        >
          {/* Premium Features Banner */}
          <div
            style={{
              borderRadius: '24px',
              background: 'linear-gradient(to right, #10b981, #ea580c)',
              padding: '32px',
              color: 'white',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }}
            ></div>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
              >
                <Crown style={{ width: '32px', height: '32px', color: '#fde68a' }} />
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  🚀 Unlock Premium Features
                </h3>
              </div>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '24px' }}>
                Join thousands of food lovers who&apos;ve transformed their eating habits with our
                smart nutrition insights
              </p>

              {/* Pricing Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    padding: '16px',
                    textAlign: 'center',
                    backdropFilter: 'blur(8px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
                    $4.99
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                    per month
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    • Unlimited storage
                    <br />• Advanced insights
                  </div>
                </div>

                <div
                  style={{
                    background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                    borderRadius: '16px',
                    padding: '16px',
                    textAlign: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '10px',
                      background: '#dc2626',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    Save 17%!
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
                    $49.99
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>per year 🎉</div>
                  <div style={{ fontSize: '12px' }}>
                    • All premium features
                    <br />• Exclusive beta access
                  </div>
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  opacity: 0.9,
                  marginBottom: '12px',
                }}
              >
                ✨ You can upgrade right after registration
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>Unlimited Meals</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>Smart Analysis</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>6 Analysis Modes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>Priority Support</span>
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginTop: '16px',
                }}
              >
                Start your nutrition journey! 🌟
              </div>
            </div>
          </div>

          {/* Signup Form Card */}
          <div
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              padding: '48px 40px',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Error/Success Messages */}
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid #ef4444',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '24px',
                  color: '#dc2626',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '2px solid #10b981',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '24px',
                  color: '#059669',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Basic Information */}
              <div style={{ marginBottom: '32px' }}>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  👤 Your Information
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* First Name and Last Name side-by-side on desktop, stacked on mobile */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        border: '2px solid #e5e7eb',
                        background: 'white',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#10b981'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      required
                    />

                    <input
                      type="text"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        border: '2px solid #e5e7eb',
                        background: 'white',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#10b981'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      required
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: '2px solid #e5e7eb',
                      background: 'white',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#10b981'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    required
                  />

                  <select
                    value={formData.country}
                    onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    aria-label="Country"
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: '2px solid #e5e7eb',
                      background: 'white',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      color: formData.country ? '#1f2937' : '#9ca3af',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#10b981'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    required
                  >
                    <option value="">Select your country</option>
                    {countries.map(country => (
                      <option
                        key={country.code}
                        value={country.code}
                        disabled={country.code === 'separator'}
                        style={{
                          color: country.code === 'separator' ? '#9ca3af' : '#1f2937',
                          fontWeight: country.code === 'separator' ? 'normal' : 'normal',
                        }}
                      >
                        {country.name}
                      </option>
                    ))}
                  </select>

                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password (min. 6 characters)"
                      value={formData.password}
                      onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '16px 56px 16px 20px',
                        borderRadius: '16px',
                        border: '2px solid #e5e7eb',
                        background: 'white',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#10b981'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                        padding: '16px 56px 16px 20px',
                        borderRadius: '16px',
                        border: '2px solid #e5e7eb',
                        background: 'white',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#10b981'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                        padding: '16px 20px',
                        borderRadius: '16px',
                        border: '2px solid #e5e7eb',
                        background: 'white',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        color: formData.dateOfBirth ? '#1f2937' : '#9ca3af',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#10b981'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      required
                    />
                    <p
                      style={{
                        color: '#6b7280',
                        fontSize: '14px',
                        marginTop: '8px',
                      }}
                    >
                      Used for personalized nutrition recommendations
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                  marginBottom: '24px',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 12px 20px rgba(16, 185, 129, 0.4)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                {loading ? 'Creating Your Account...' : 'Start Your Journey 🚀'}
              </button>

              {/* Sign In Link */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>
                  Already have an account?{' '}
                  <Link
                    href="/login"
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
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
