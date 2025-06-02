'use client'

import { Camera } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { AuthModal } from '@/components/auth/AuthModal'
import { useAuth } from '@/contexts/AuthContext'

export default function SignUpPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  return (
    <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/food-pattern.svg')] opacity-5" />

      {/* Header */}
      <div className="container py-8">
        <Link href="/" className="group flex items-center space-x-3">
          <div className="gradient-brand flex h-10 w-10 transform items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <h1 className="gradient-text text-2xl font-bold">MealAppeal</h1>
        </Link>
      </div>

      {/* Content */}
      <div className="container flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="mb-4 text-4xl font-bold">Join MealAppeal 🚀</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Start your food journey and discover what&apos;s in your meals
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={true} onClose={() => router.push('/')} defaultMode="register" />
    </div>
  )
}
